import { revalidateTag } from 'next/cache'
import properties from '@/data/galmanProperties.json'
import type { GalmanProperty, PropertyRecord, UnitRecord, UnitsResponse } from '@/lib/galman/types'
import { parseUnits, propertyNameFromPage } from '@/lib/onsite/parseUnits'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const TAG = 'galman-units'
const TTL_MS = 15 * 60 * 1000
const CONCURRENCY = 6

const directory = properties as GalmanProperty[]

type Memory = { at: number; body: UnitsResponse }
let memory: Memory | null = null

function listingUrl(propertyId: string): string {
  return `https://www.on-site.com/web/online_app/choose_unit?goal=6&attr=x20&property_id=${propertyId}&lease_id=0&unit_id=0&required=`
}

async function fetchHtml(propertyId: string, fresh: boolean): Promise<string> {
  let lastError: unknown
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 25000)
    try {
      const response = await fetch(listingUrl(propertyId), {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
          Accept: 'text/html',
        },
        ...(fresh ? { cache: 'no-store' as const } : { next: { revalidate: 900, tags: [TAG] } }),
      })
      if (!response.ok) throw new Error(`On-Site returned ${response.status}`)
      return await response.text()
    } catch (error) {
      lastError = error
      if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 500))
    } finally {
      clearTimeout(timer)
    }
  }
  throw lastError
}

async function mapPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length)
  let cursor = 0
  async function worker() {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      results[index] = await fn(items[index])
    }
  }
  const workers = Math.min(limit, items.length)
  if (workers > 0) await Promise.all(Array.from({ length: workers }, () => worker()))
  return results
}

async function loadProperty(
  property: GalmanProperty,
  fresh: boolean
): Promise<{ property: PropertyRecord; units: UnitRecord[] }> {
  const record: PropertyRecord = {
    slug: property.slug,
    name: property.name,
    region: property.region,
    address: property.address,
    city: property.city,
    state: property.state,
    zip: property.zip,
    lat: property.lat,
    lng: property.lng,
    url: property.url,
    ok: false,
    unitCount: 0,
  }

  if (!property.onsiteIds.length) {
    return { property: { ...record, error: 'No On-Site listing on the Galman page' }, units: [] }
  }

  try {
    const pages = await Promise.all(property.onsiteIds.map((id) => fetchHtml(id, fresh)))
    const units: UnitRecord[] = []
    const seen = new Set<string>()
    pages.forEach((html, index) => {
      if (!propertyNameFromPage(html) && !html.includes('unit_display')) {
        throw new Error('On-Site did not return a unit list')
      }
      for (const unit of parseUnits(html, property.onsiteIds[index])) {
        if (seen.has(unit.unitId)) continue
        seen.add(unit.unitId)
        units.push({
          ...unit,
          slug: property.slug,
          propertyName: property.name,
          address: property.address,
          city: property.city,
          state: property.state,
          zip: property.zip,
          region: property.region,
          lat: property.lat,
          lng: property.lng,
          galmanUrl: property.url,
        })
      }
    })
    return { property: { ...record, ok: true, unitCount: units.length }, units }
  } catch (error) {
    const message = error instanceof Error && error.name === 'AbortError' ? 'Timed out' : error instanceof Error ? error.message : 'Failed to load'
    return { property: { ...record, error: message }, units: [] }
  }
}

async function loadAll(fresh: boolean): Promise<UnitsResponse> {
  const loaded = await mapPool(directory, CONCURRENCY, (property) => loadProperty(property, fresh))
  return {
    fetchedAt: new Date().toISOString(),
    units: loaded.flatMap((entry) => entry.units),
    properties: loaded.map((entry) => entry.property),
  }
}

export async function GET(request: Request) {
  if (!directory.length) {
    return Response.json(
      { error: 'Property directory is empty. Run npm run sync:galman.' },
      { status: 503, headers: { 'Cache-Control': 'private, no-store' } }
    )
  }

  const fresh = new URL(request.url).searchParams.get('fresh') === '1'
  if (!fresh && memory && Date.now() - memory.at < TTL_MS) {
    return Response.json(memory.body, { headers: { 'Cache-Control': 'private, no-store' } })
  }

  if (fresh) revalidateTag(TAG)
  const body = await loadAll(fresh)
  memory = { at: Date.now(), body }
  return Response.json(body, { headers: { 'Cache-Control': 'private, no-store' } })
}
