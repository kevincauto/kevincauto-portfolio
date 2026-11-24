import { readFileSync } from 'node:fs'
import path from 'node:path'
import { parseUnits, propertyNameFromPage } from '@/lib/onsite/parseUnits'

const html = readFileSync(path.join(__dirname, 'fixtures/onsite-sample.html'), 'utf8')

describe('parseUnits', () => {
  const units = parseUnits(html, '649091')

  it('reads the property name', () => {
    expect(propertyNameFromPage(html)).toBe('Plymouth Flats')
  })

  it('parses studios and one-bedrooms, including half baths and comma sqft', () => {
    expect(units).toHaveLength(2)
    expect(units[0]).toMatchObject({
      unitId: '100',
      unit: 'L-12',
      rent: 1465,
      beds: 0,
      baths: 1,
      sqft: 421,
      floorPlan: 'Studio Upg Medium',
      availableDate: '2026-11-23',
      maxMoveIn: '2026-12-20',
      description: 'Renovated studio with quartz counters. Hardwood floors.',
      applyUrl: 'https://www.on-site.com/web/online_app/choose_unit?goal=6&attr=x20&property_id=649091#unit_100',
    })
    expect(units[1]).toMatchObject({
      unitId: '200',
      unit: 'A218',
      rent: 1749,
      beds: 1,
      baths: 1.5,
      sqft: 1100,
      floorPlan: '1 Bed Lux',
      description: 'In-unit washer/dryer. Second floor.',
    })
  })

  it('keeps the first row when the same unit id is repeated', () => {
    expect(units.filter((unit) => unit.unitId === '200')).toHaveLength(1)
    expect(units[1].rent).toBe(1749)
  })
})
