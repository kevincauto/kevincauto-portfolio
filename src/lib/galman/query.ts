import { milesBetween } from '@/lib/geo'
import type { UnitRecord } from '@/lib/galman/types'

export const SORTS = ['rent', 'ppsf', 'beds', 'sqft', 'available', 'distance', 'property'] as const
export type SortKey = (typeof SORTS)[number]
export type SortDir = 'asc' | 'desc'

export type Filters = {
  min: number | null
  max: number | null
  beds: number[]
  baths: number | null
  sqft: number | null
  by: string
  region: 'all' | 'city' | 'suburbs'
  props: string[]
  q: string
  sort: SortKey
  dir: SortDir
  then: SortKey | ''
  view: 'table' | 'cards'
  lat: number | null
  lng: number | null
  radius: number
  near: string
}

export type ListedUnit = UnitRecord & {
  distance: number | null
  pricePerSqft: number | null
}

export const defaultFilters: Filters = {
  min: null,
  max: null,
  beds: [],
  baths: null,
  sqft: null,
  by: '',
  region: 'all',
  props: [],
  q: '',
  sort: 'rent',
  dir: 'asc',
  then: 'available',
  view: 'table',
  lat: null,
  lng: null,
  radius: 5,
  near: '',
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function num(value: string | null): number | null {
  if (value == null || value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function isSort(value: string | null): value is SortKey {
  return SORTS.includes(value as SortKey)
}

export function filtersFromSearchParams(params: URLSearchParams): Filters {
  const beds = (params.get('beds') || '')
    .split(',')
    .filter(Boolean)
    .map((part) => Number(part))
    .filter((bed) => bed === 0 || bed === 1 || bed === 2 || bed === 3)
  const region = params.get('region')
  const then = params.get('then')
  const sort = params.get('sort')
  return {
    min: num(params.get('min')),
    max: num(params.get('max')),
    beds,
    baths: num(params.get('baths')),
    sqft: num(params.get('sqft')),
    by: /^\d{4}-\d{2}-\d{2}$/.test(params.get('by') || '') ? params.get('by') || '' : '',
    region: region === 'city' || region === 'suburbs' ? region : 'all',
    props: (params.get('props') || '').split(',').map((slug) => slug.trim()).filter(Boolean),
    q: params.get('q') || '',
    sort: isSort(sort) ? sort : 'rent',
    dir: params.get('dir') === 'desc' ? 'desc' : 'asc',
    then: then === '' ? '' : isSort(then) ? then : 'available',
    view: params.get('view') === 'cards' ? 'cards' : 'table',
    lat: num(params.get('lat')),
    lng: num(params.get('lng')),
    radius: Math.min(25, Math.max(0.5, num(params.get('mi')) ?? 5)),
    near: params.get('near') || '',
  }
}

export function filtersToQuery(filters: Filters): string {
  const params = new URLSearchParams()
  if (filters.min != null) params.set('min', String(filters.min))
  if (filters.max != null) params.set('max', String(filters.max))
  if (filters.beds.length) params.set('beds', filters.beds.join(','))
  if (filters.baths != null) params.set('baths', String(filters.baths))
  if (filters.sqft != null) params.set('sqft', String(filters.sqft))
  if (filters.by) params.set('by', filters.by)
  if (filters.region !== 'all') params.set('region', filters.region)
  if (filters.props.length) params.set('props', filters.props.join(','))
  if (filters.q.trim()) params.set('q', filters.q.trim())
  if (filters.sort !== 'rent') params.set('sort', filters.sort)
  if (filters.dir !== 'asc') params.set('dir', filters.dir)
  if (filters.then !== 'available') params.set('then', filters.then)
  if (filters.view !== 'table') params.set('view', filters.view)
  if (filters.lat != null && filters.lng != null) {
    params.set('lat', filters.lat.toFixed(5))
    params.set('lng', filters.lng.toFixed(5))
    params.set('mi', String(filters.radius))
    if (filters.near) params.set('near', filters.near)
  }
  return params.toString()
}

export function defaultDir(sort: SortKey): SortDir {
  return sort === 'sqft' ? 'desc' : 'asc'
}

export function activeFilterCount(filters: Filters): number {
  let count = 0
  if (filters.min != null) count += 1
  if (filters.max != null) count += 1
  if (filters.beds.length) count += 1
  if (filters.baths != null) count += 1
  if (filters.sqft != null) count += 1
  if (filters.by) count += 1
  if (filters.region !== 'all') count += 1
  if (filters.props.length) count += 1
  if (filters.q.trim()) count += 1
  if (filters.lat != null && filters.lng != null) count += 1
  return count
}

export function money(value: number): string {
  return value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export function moneyPerFoot(value: number): string {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!match) return '—'
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (date.getTime() <= today.getTime()) return 'Now'
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

export function bedsLabel(beds: number | null): string {
  if (beds == null) return '—'
  if (beds === 0) return 'Studio'
  return String(beds)
}

export function bedsPhrase(beds: number | null): string {
  if (beds == null) return 'Beds unknown'
  if (beds === 0) return 'Studio'
  return `${beds} bed${beds === 1 ? '' : 's'}`
}

export function relativeTime(iso: string, now = Date.now()): string {
  const then = Date.parse(iso)
  if (!Number.isFinite(then)) return ''
  const minutes = Math.max(0, Math.round((now - then) / 60000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  return `${Math.round(hours / 24)} days ago`
}

export function dirLabel(sort: SortKey, dir: SortDir): string {
  if (sort === 'available') return dir === 'asc' ? 'Soonest first' : 'Latest first'
  if (sort === 'property') return dir === 'asc' ? 'A to Z' : 'Z to A'
  if (sort === 'distance') return dir === 'asc' ? 'Nearest first' : 'Farthest first'
  if (sort === 'beds' || sort === 'sqft') return dir === 'asc' ? 'Smallest first' : 'Largest first'
  return dir === 'asc' ? 'Low to high' : 'High to low'
}

function hasLocation(filters: Filters): boolean {
  return filters.lat != null && filters.lng != null
}

export function withMetrics(unit: UnitRecord, filters: Filters): ListedUnit {
  const distance =
    hasLocation(filters) && unit.lat != null && unit.lng != null
      ? milesBetween(filters.lat as number, filters.lng as number, unit.lat, unit.lng)
      : null
  return {
    ...unit,
    distance,
    pricePerSqft: unit.sqft ? unit.rent / unit.sqft : null,
  }
}

function bedBucket(beds: number | null): number | null {
  if (beds == null) return null
  return beds >= 3 ? 3 : beds
}

export function matches(unit: ListedUnit, filters: Filters): boolean {
  if (filters.min != null && unit.rent < filters.min) return false
  if (filters.max != null && unit.rent > filters.max) return false
  if (filters.beds.length) {
    const bucket = bedBucket(unit.beds)
    if (bucket == null || !filters.beds.includes(bucket)) return false
  }
  if (filters.baths != null && (unit.baths == null || unit.baths < filters.baths)) return false
  if (filters.sqft != null && (unit.sqft == null || unit.sqft < filters.sqft)) return false
  if (filters.by && (!unit.availableDate || unit.availableDate > filters.by)) return false
  if (filters.region !== 'all' && unit.region !== filters.region) return false
  if (filters.props.length && !filters.props.includes(unit.slug)) return false
  if (hasLocation(filters) && (unit.distance == null || unit.distance > filters.radius + 0.001)) return false
  const terms = filters.q.toLowerCase().split(/[^a-z0-9.]+/).filter((term) => term.length > 1 || /\d/.test(term))
  if (terms.length) {
    const haystack = [
      unit.propertyName,
      unit.address,
      unit.city,
      unit.unit,
      unit.floorPlan,
      unit.floorplanDescription,
      unit.description,
    ]
      .join(' ')
      .toLowerCase()
    if (!terms.every((term) => haystack.includes(term))) return false
  }
  return true
}

function sortValue(unit: ListedUnit, key: SortKey): number | string | null {
  switch (key) {
    case 'rent':
      return unit.rent
    case 'ppsf':
      return unit.pricePerSqft
    case 'beds':
      return unit.beds
    case 'sqft':
      return unit.sqft
    case 'available':
      return unit.availableDate || null
    case 'distance':
      return unit.distance
    case 'property':
      return unit.propertyName.toLowerCase()
  }
}

function compareValues(left: number | string | null, right: number | string | null, dir: SortDir): number {
  if (left == null && right == null) return 0
  if (left == null) return 1
  if (right == null) return -1
  const sign = dir === 'asc' ? 1 : -1
  if (left < right) return -1 * sign
  if (left > right) return 1 * sign
  return 0
}

export function applyQuery(units: UnitRecord[], filters: Filters): ListedUnit[] {
  const listed = units.map((unit) => withMetrics(unit, filters)).filter((unit) => matches(unit, filters))
  const secondary = filters.then && filters.then !== filters.sort ? filters.then : null
  listed.sort((left, right) => {
    const primary = compareValues(sortValue(left, filters.sort), sortValue(right, filters.sort), filters.dir)
    if (primary) return primary
    if (secondary) {
      const next = compareValues(sortValue(left, secondary), sortValue(right, secondary), 'asc')
      if (next) return next
    }
    const byProperty = left.propertyName.localeCompare(right.propertyName)
    if (byProperty) return byProperty
    return left.unit.localeCompare(right.unit, undefined, { numeric: true })
  })
  return listed
}

export function countsByProperty(units: UnitRecord[], filters: Filters): Map<string, number> {
  const matched = applyQuery(units, { ...filters, props: [] })
  const counts = new Map<string, number>()
  for (const unit of matched) counts.set(unit.slug, (counts.get(unit.slug) || 0) + 1)
  return counts
}

export function summarize(units: ListedUnit[]) {
  const rents = units.map((unit) => unit.rent).sort((left, right) => left - right)
  const mid = Math.floor(rents.length / 2)
  const median =
    rents.length === 0 ? null : rents.length % 2 ? rents[mid] : Math.round((rents[mid - 1] + rents[mid]) / 2)
  const cheapest = (pred: (unit: ListedUnit) => boolean) => {
    let best: number | null = null
    for (const unit of units) {
      if (!pred(unit)) continue
      if (best == null || unit.rent < best) best = unit.rent
    }
    return best
  }
  return {
    count: units.length,
    properties: new Set(units.map((unit) => unit.slug)).size,
    median,
    studio: cheapest((unit) => unit.beds === 0),
    one: cheapest((unit) => unit.beds === 1),
    two: cheapest((unit) => unit.beds === 2),
    three: cheapest((unit) => unit.beds != null && unit.beds >= 3),
  }
}

export function unitKey(unit: { slug: string; unitId: string }): string {
  return `${unit.slug}:${unit.unitId}`
}

function csvCell(value: string | number | null | undefined): string {
  if (value == null) return ''
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv(units: ListedUnit[]): string {
  const header = [
    'Property',
    'Address',
    'City',
    'State',
    'Zip',
    'Region',
    'Unit',
    'Floor plan',
    'Beds',
    'Baths',
    'Sq Ft',
    'Rent',
    '$/Sq Ft',
    'Available',
    'Move in by',
    'Distance (mi)',
    'Description',
    'Apply',
    'Property page',
  ]
  const lines = [header.join(',')]
  for (const unit of units) {
    lines.push(
      [
        unit.propertyName,
        unit.address,
        unit.city,
        unit.state,
        unit.zip,
        unit.region === 'city' ? 'Philadelphia' : 'Suburbs',
        unit.unit,
        unit.floorPlan,
        unit.beds == null ? '' : unit.beds === 0 ? 'Studio' : unit.beds,
        unit.baths ?? '',
        unit.sqft ?? '',
        unit.rent,
        unit.pricePerSqft == null ? '' : unit.pricePerSqft.toFixed(2),
        unit.availableDate,
        unit.maxMoveIn ?? '',
        unit.distance == null ? '' : unit.distance.toFixed(2),
        unit.description,
        unit.applyUrl,
        unit.galmanUrl,
      ]
        .map(csvCell)
        .join(',')
    )
  }
  return lines.join('\n')
}

export function toClientText(units: ListedUnit[], filters: Filters): string {
  const lines: string[] = ['Available Galman apartments']
  if (filters.lat != null && filters.lng != null) {
    lines.push(filters.near ? `Near ${filters.near} · within ${filters.radius} miles` : `Within ${filters.radius} miles of the pin`)
  }
  const bits: string[] = []
  if (filters.beds.length) {
    bits.push(
      filters.beds
        .map((bed) => (bed === 0 ? 'studio' : bed === 3 ? '3+ bedrooms' : `${bed} bedroom${bed === 1 ? '' : 's'}`))
        .join(' or ')
    )
  }
  if (filters.min != null) bits.push(`at least ${money(filters.min)}`)
  if (filters.max != null) bits.push(`up to ${money(filters.max)}`)
  if (filters.baths != null) bits.push(`${filters.baths}+ baths`)
  if (filters.sqft != null) bits.push(`${filters.sqft.toLocaleString()}+ sq ft`)
  if (filters.by) bits.push(`available by ${formatDate(filters.by)}`)
  if (filters.q.trim()) bits.push(`matching "${filters.q.trim()}"`)
  if (bits.length) lines.push(bits.join(' · '))
  lines.push(`${units.length} unit${units.length === 1 ? '' : 's'}`, '')

  const groups: ListedUnit[][] = []
  const index = new Map<string, ListedUnit[]>()
  for (const unit of units) {
    const existing = index.get(unit.slug)
    if (existing) existing.push(unit)
    else {
      const group = [unit]
      index.set(unit.slug, group)
      groups.push(group)
    }
  }

  for (const group of groups) {
    const first = group[0]
    const cityLine = [first.city, first.state].filter(Boolean).join(', ')
    const place = [first.address, [cityLine, first.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ')
    const distance = first.distance == null ? '' : ` · ${first.distance.toFixed(1)} mi`
    lines.push(`${first.propertyName}${distance}`)
    if (place) lines.push(place)
    for (const unit of group) {
      const size = [
        bedsPhrase(unit.beds),
        unit.baths != null ? `${unit.baths} bath${unit.baths === 1 ? '' : 's'}` : '',
        unit.sqft ? `${unit.sqft.toLocaleString()} sq ft` : '',
      ]
        .filter(Boolean)
        .join(' · ')
      lines.push(`• ${unit.unit || 'Unit'} · ${size} · ${money(unit.rent)} · available ${formatDate(unit.availableDate)}`)
      if (unit.description) lines.push(`  ${unit.description}`)
    }
    lines.push(first.galmanUrl, '')
  }

  lines.push('Rents and dates come from On-Site and can change.')
  return lines.join('\n').trim()
}

export function todayIso(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}
