import { parse, type HTMLElement } from 'node-html-parser'
import type { ParsedUnit } from '@/lib/galman/types'

function clean(value: string | undefined | null): string {
  return (value || '').replace(/\s+/g, ' ').trim()
}

function parseBeds(description: string, floorPlan: string, internalBeds: string): number | null {
  const fromDescription = description.match(/(\d+(?:\.\d+)?)\s*beds?/i)
  if (fromDescription) return Math.round(Number(fromDescription[1]))
  const fromPlan = floorPlan.match(/(\d+(?:\.\d+)?)\s*(?:bed(?:room)?s?|br)\b/i)
  if (fromPlan) return Math.round(Number(fromPlan[1]))
  if (/studio|efficiency/i.test(`${description} ${floorPlan}`)) return 0
  if (internalBeds) {
    const beds = Number(internalBeds)
    if (Number.isFinite(beds)) return Math.round(beds)
  }
  return null
}

function parseBaths(description: string): number | null {
  const match = description.match(/(\d+(?:\.\d+)?)\s*baths?/i)
  if (match) return Number(match[1])
  if (/bath/i.test(description)) return 1
  return null
}

function parseSqft(description: string): number | null {
  const match = description.match(/([\d,]+)\s*sq\.?\s*ft/i)
  if (!match) return null
  const sqft = Number(match[1].replace(/,/g, ''))
  return Number.isFinite(sqft) ? sqft : null
}

function rowUnit(
  row: HTMLElement,
  propertyId: string,
  floorPlan: string,
  internalBeds: string
): ParsedUnit | null {
  const unitId = row.getAttribute('data-unit-id') || ''
  if (!unitId) return null
  const rent = Number(clean(row.querySelector('.internal_rent')?.text).replace(/,/g, ''))
  if (!Number.isFinite(rent) || rent <= 0) return null
  const floorplanDescription = clean(row.getAttribute('data-floorplan-description'))
  return {
    unitId,
    propertyId,
    unit: clean(row.getAttribute('data-apartment-number')),
    rent,
    beds: parseBeds(floorplanDescription, floorPlan, internalBeds),
    baths: parseBaths(floorplanDescription),
    sqft: parseSqft(floorplanDescription),
    floorPlan,
    floorplanDescription,
    availableDate: row.getAttribute('data-internal-available-date') || '',
    maxMoveIn: row.getAttribute('data-max-move-in-date') || null,
    description: clean(row.querySelector('.description_column')?.text),
    applyUrl: `https://www.on-site.com/web/online_app/choose_unit?goal=6&attr=x20&property_id=${propertyId}#unit_${unitId}`,
  }
}

export function parseUnits(html: string, propertyId: string): ParsedUnit[] {
  const root = parse(html)
  const seen = new Set<string>()
  const units: ParsedUnit[] = []

  const take = (row: HTMLElement, floorPlan: string, internalBeds: string) => {
    const unit = rowUnit(row, propertyId, floorPlan, internalBeds)
    if (!unit || seen.has(unit.unitId)) return
    seen.add(unit.unitId)
    units.push(unit)
  }

  for (const section of root.querySelectorAll('.style_section')) {
    const floorPlan = clean(section.querySelector('.floor_plan_name')?.text)
    const internalBeds = clean(section.querySelector('.internal_beds')?.text)
    for (const row of section.querySelectorAll('tr.unit_display')) {
      take(row, floorPlan, internalBeds)
    }
  }

  for (const row of root.querySelectorAll('tr.unit_display')) {
    take(row, '', '')
  }

  return units
}

export function propertyNameFromPage(html: string): string | null {
  const name = clean(parse(html).querySelector('#propertyName')?.text)
  return name || null
}
