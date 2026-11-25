/**
 * Rebuild src/data/galmanProperties.json from galmangroup.com.
 *
 * Galman rate-limits parallel requests, so this walks one page at a time.
 * Re-run only when they add or drop a property. Availability itself is
 * fetched live from on-site.com and is not part of this file.
 *
 *   node scripts/sync-galman-properties.mjs
 *   REFRESH=1 node scripts/sync-galman-properties.mjs   # ignore the local page cache
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outFile = path.join(root, 'src/data/galmanProperties.json')
const cacheDir = '/tmp/galman-sync'
const refresh = process.env.REFRESH === '1'
const delayMs = 2200

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'

const regions = [
  ['city', 'https://galmangroup.com/philadelphia/'],
  ['suburbs', 'https://galmangroup.com/philadelphia-suburbs/'],
]

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function safeDecode(value) {
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '))
  } catch {
    return ''
  }
}

function decode(value) {
  return value
    .replace(/&#8217;|&#x2019;/g, "'")
    .replace(/&#038;|&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

let lastNetworkAt = 0

async function get(url) {
  const key = Buffer.from(url).toString('base64url')
  const cached = path.join(cacheDir, `${key}.html`)
  if (!refresh) {
    try {
      const hit = await readFile(cached, 'utf8')
      if (hit.length > 10000 && !/Forbidden/i.test(hit.slice(0, 500))) return { html: hit, cached: true }
    } catch {
      /* cache miss */
    }
  }

  const sinceNetwork = Date.now() - lastNetworkAt
  if (lastNetworkAt && sinceNetwork < delayMs) await sleep(delayMs - sinceNetwork)
  lastNetworkAt = Date.now()

  for (let attempt = 1; attempt <= 5; attempt++) {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
      redirect: 'follow',
    })
    const text = await res.text()
    const forbidden = res.status === 403 || (text.length < 8000 && /<title>\s*Forbidden/i.test(text))
    if (!forbidden && res.ok && text.length > 8000) {
      await writeFile(cached, text)
      return { html: text, cached: false }
    }
    const wait = 4000 * attempt
    console.warn(`retry ${attempt} ${res.status} ${text.length}b ${url} (waiting ${wait}ms)`)
    await sleep(wait)
  }
  throw new Error(`Failed to fetch ${url}`)
}

function parseAddress(html) {
  let street = ''
  let city = ''
  let state = ''
  let zip = ''

  const block = html.match(/rr-property-address[\s\S]*?et_pb_text_inner[^>]*>([\s\S]*?)<\/div>/)
  if (block) {
    const lines = [...block[1].matchAll(/<li>([\s\S]*?)<\/li>/g)]
      .map((match) => decode(match[1]))
      .filter(Boolean)
    if (lines[0]) street = lines[0].replace(/\.+$/, '')
    const rest = lines[1] || ''
    const cityMatch = rest.match(/^(.*?)\s+([A-Z]{2})\s+(\d{5})(?:-\d{4})?$/)
    if (cityMatch) {
      city = cityMatch[1].replace(/,/g, '').trim()
      state = cityMatch[2]
      zip = cityMatch[3]
    }
  }

  if (!street || !city) {
    const places = [...html.matchAll(/!2s([^!]{1,180})!/g)].map((match) => safeDecode(match[1]))
    const formatted = places.find((place) => /\d/.test(place) && /,\s*[A-Z]{2}\s+\d{5}/.test(place))
    const cityMatch = formatted?.match(/^(.*?),\s*(.*?),\s*([A-Z]{2})\s+(\d{5})/)
    if (cityMatch) {
      street = street || cityMatch[1]
      city = city || cityMatch[2]
      state = state || cityMatch[3]
      zip = zip || cityMatch[4]
    }
  }

  return { street, city, state, zip }
}

function parseCoords(html) {
  const match = html.match(/!2d(-?\d+\.\d+)!3d(-?\d+\.\d+)/)
  if (!match) return { lat: null, lng: null }
  return { lng: Number(match[1]), lat: Number(match[2]) }
}

function parseName(html, slug) {
  const heading = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)
  const title = html.match(/<title>([^<]+)<\/title>/i)
  const titleName = title
    ? decode(title[1])
        .split(/\s+[|–-]\s+/)[0]
        .replace(/\s+/g, ' ')
        .trim()
    : ''
  let name = heading ? decode(heading[1]).replace(/\s+[|–-]\s+The Galman Group$/i, '') : ''
  if (name && name === name.toUpperCase() && titleName) name = titleName
  if (name) return name
  if (titleName) return titleName
  return slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function uniqueIds(matches) {
  return [...new Set(matches)]
}

function parseOnsiteIds(html) {
  const choose = uniqueIds(
    [...html.matchAll(/choose_unit\?[^"'<>]*property_id=(\d+)/g)].map((match) => match[1])
  )
  if (choose.length) return choose
  const apply = uniqueIds([...html.matchAll(/on-site\.com\/apply\/property\/(\d+)/g)].map((match) => match[1]))
  if (apply.length) return apply
  return uniqueIds([...html.matchAll(/property_id=(\d+)/g)].map((match) => match[1]))
}

function geocodeQuery(property) {
  const street = property.address
    .replace(/#.*$/, '')
    .replace(/\b(\d+)\s*-\s*\d+\b/, '$1')
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return [street, property.city, property.state, property.zip].filter(Boolean).join(', ')
}

async function reverseGeocode(property) {
  const query = geocodeQuery(property)
  if (!query) return
  console.log(`  query: ${query}`)
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', query)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', '1')
  url.searchParams.set('countrycodes', 'us')
  const res = await fetch(url, {
    headers: { 'User-Agent': 'kevincauto-portfolio/galman-sync (Philadelphia apartment search)', Accept: 'application/json' },
  })
  if (!res.ok) return
  const body = await res.json()
  const hit = body?.[0]
  if (!hit) {
    console.log('  no geocode result')
    return
  }
  property.lat = Number(hit.lat)
  property.lng = Number(hit.lon)
}

async function main() {
  await mkdir(cacheDir, { recursive: true })
  await mkdir(path.dirname(outFile), { recursive: true })
  const seen = new Map()
  let previous = []
  try {
    previous = JSON.parse(await readFile(outFile, 'utf8'))
  } catch {
    previous = []
  }
  const laundryBySlug = new Map(
    previous.filter((property) => property.laundry).map((property) => [property.slug, property])
  )

  for (const [region, url] of regions) {
    console.log(`listing ${region}`)
    const html = (await get(url)).html
    const slugs = [
      ...new Set([...html.matchAll(/https:\/\/galmangroup\.com\/property\/([a-z0-9-]+)\/?/g)].map((match) => match[1])),
    ]
    console.log(`  ${slugs.length} properties`)

    for (const slug of slugs) {
      if (seen.has(slug)) continue
      const pageUrl = `https://galmangroup.com/property/${slug}/`
      process.stdout.write(`fetch ${slug} ... `)
      const page = (await get(pageUrl)).html
      let address
      let coords
      try {
        address = parseAddress(page)
        coords = parseCoords(page)
      } catch (error) {
        console.error(`parse failed for ${slug}:`, error instanceof Error ? error.message : error)
        continue
      }
      const property = {
        slug,
        name: parseName(page, slug),
        region,
        onsiteIds: parseOnsiteIds(page),
        lat: coords.lat,
        lng: coords.lng,
        address: address.street,
        city: address.city,
        state: address.state || 'PA',
        zip: address.zip,
        url: pageUrl,
      }
      const kept = laundryBySlug.get(slug)
      if (kept) {
        property.laundry = kept.laundry
        property.sharedLaundry = Boolean(kept.sharedLaundry)
      }
      seen.set(slug, property)
      console.log(
        `${property.name} | ${property.onsiteIds.join(',') || 'NO ID'} | ${property.address}, ${property.city} | ${property.lat ?? 'no lat'}`
      )
    }
  }

  const properties = [...seen.values()].sort((a, b) => a.name.localeCompare(b.name))
  for (const property of properties) {
    if (property.lat != null && property.lng != null) continue
    console.log(`geocode ${property.slug}`)
    await reverseGeocode(property)
    await sleep(1100)
  }

  await writeFile(outFile, `${JSON.stringify(properties, null, 2)}\n`)
  const incomplete = properties.filter(
    (property) => !property.onsiteIds.length || property.lat == null || !property.address || !property.city
  )
  console.log(`wrote ${properties.length} -> ${outFile}`)
  console.log(`incomplete ${incomplete.length}: ${incomplete.map((property) => property.slug).join(', ') || 'none'}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
