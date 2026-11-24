import { applyQuery, defaultFilters, filtersFromSearchParams, summarize, type Filters } from '@/lib/galman/query'
import type { UnitRecord } from '@/lib/galman/types'

function unit(overrides: Partial<UnitRecord>): UnitRecord {
  return {
    unitId: '1',
    propertyId: '1',
    unit: 'A1',
    rent: 1500,
    beds: 1,
    baths: 1,
    sqft: 700,
    floorPlan: '1 Bed',
    floorplanDescription: '1 bed, 1 bath, 700 Sq. Ft.',
    availableDate: '2026-12-01',
    maxMoveIn: null,
    description: 'In-unit washer/dryer',
    applyUrl: 'https://example.com',
    slug: 'plymouth-flats',
    propertyName: 'Plymouth Flats',
    address: '349 Chilton Ct',
    city: 'Plymouth Meeting',
    state: 'PA',
    zip: '19462',
    region: 'suburbs',
    lat: 40.1118,
    lng: -75.3241,
    galmanUrl: 'https://galmangroup.com/property/plymouth-flats/',
    ...overrides,
  }
}

const units = [
  unit({ unitId: '1', unit: 'A1', rent: 1800, beds: 1, sqft: 700 }),
  unit({
    unitId: '2',
    unit: 'B2',
    rent: 2400,
    beds: 2,
    baths: 2,
    sqft: 1000,
    slug: 'north-lane-apartments',
    propertyName: 'North Lane Apartments',
    city: 'Conshohocken',
    lat: 40.0917,
    lng: -75.2964,
    description: 'Patio',
    availableDate: '2026-11-01',
  }),
  unit({
    unitId: '3',
    unit: 'S1',
    rent: 1300,
    beds: 0,
    sqft: 420,
    region: 'city',
    slug: 'algon-flats',
    propertyName: 'Algon Flats',
    city: 'Philadelphia',
    lat: 40.05,
    lng: -75.05,
    availableDate: '2027-03-01',
  }),
]

const filters = (overrides: Partial<Filters> = {}): Filters => ({ ...defaultFilters, ...overrides })

describe('filtersFromSearchParams', () => {
  it('does not treat a missing bedroom filter as studio', () => {
    expect(filtersFromSearchParams(new URLSearchParams()).beds).toEqual([])
    expect(filtersFromSearchParams(new URLSearchParams('beds=0,2')).beds).toEqual([0, 2])
  })
})

describe('applyQuery', () => {
  it('filters by price, bedrooms, keyword, and radius', () => {
    const priced = applyQuery(units, filters({ max: 2000, beds: [1] }))
    expect(priced.map((unit) => unit.unit)).toEqual(['A1'])

    const washer = applyQuery(units, filters({ q: 'washer/dryer' }))
    expect(washer.map((unit) => unit.unit).sort()).toEqual(['A1', 'S1'])

    const near = applyQuery(units, filters({ lat: 40.1118, lng: -75.3241, radius: 1, near: 'Plymouth Meeting' }))
    expect(near.map((unit) => unit.unit)).toEqual(['A1'])
    expect(near[0].distance).not.toBeNull()
    expect(near[0].distance as number).toBeLessThan(0.2)
  })

  it('sorts by price per foot with missing values last', () => {
    const withUnknown = [...units, unit({ unitId: '4', unit: 'Z9', rent: 900, sqft: null, beds: 1 })]
    const sorted = applyQuery(withUnknown, filters({ sort: 'ppsf', dir: 'asc' }))
    expect(sorted.at(-1)?.unit).toBe('Z9')
    expect(sorted[0].pricePerSqft).toBeLessThan(sorted[1].pricePerSqft as number)
  })

  it('summarizes the median and the cheapest unit of each size', () => {
    const summary = summarize(applyQuery(units, filters()))
    expect(summary.count).toBe(3)
    expect(summary.properties).toBe(3)
    expect(summary.median).toBe(1800)
    expect(summary.studio).toBe(1300)
    expect(summary.one).toBe(1800)
    expect(summary.two).toBe(2400)
    expect(summary.three).toBeNull()
  })
})
