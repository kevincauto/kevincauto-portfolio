export const dynamic = 'force-dynamic'

type GeoResult = { label: string; lat: number; lng: number }

const cache = new Map<string, { at: number; results: GeoResult[] }>()
const DAY = 24 * 60 * 60 * 1000

function shorten(displayName: string): string {
  return displayName
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part && part !== 'United States')
    .slice(0, 3)
    .join(', ')
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q')?.trim() || ''
  if (query.length < 3) return Response.json({ results: [] satisfies GeoResult[] })

  const key = query.toLowerCase()
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < DAY) return Response.json({ results: hit.results })

  const biased = /\b(pa|pennsylvania)\b/i.test(query) ? query : `${query}, PA`
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', biased)
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', '5')
  url.searchParams.set('countrycodes', 'us')
  url.searchParams.set('viewbox', '-76.3,40.7,-74.5,39.6')
  url.searchParams.set('bounded', '0')

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'kevincauto-portfolio/1.0 (Philadelphia apartment search)',
      Accept: 'application/json',
    },
    next: { revalidate: 86400 },
  })

  if (!response.ok) {
    return Response.json({ results: [], error: 'Geocoder unavailable' }, { status: 502 })
  }

  const body = (await response.json()) as Array<{ display_name?: string; lat?: string; lon?: string }>
  const results = body
    .map((item) => ({
      label: shorten(item.display_name || ''),
      lat: Number(item.lat),
      lng: Number(item.lon),
    }))
    .filter((item) => item.label && Number.isFinite(item.lat) && Number.isFinite(item.lng))

  cache.set(key, { at: Date.now(), results })
  return Response.json({ results })
}
