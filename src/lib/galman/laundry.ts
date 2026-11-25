export type LaundryPolicy = 'all' | 'unit' | 'none'

const IN_UNIT =
  /in[-\s](?:unit|home).{0,50}(?:washer|dryer|laundry)|(?:washer|dryer).{0,30}in[-\s](?:unit|home)|washers?\s*(?:&|and|\/)\s*dryers?|washer\s+dryers?|\bw\/d\b|stack(?:able)?\s+washers?/i

export function descriptionHasInUnitLaundry(description: string): boolean {
  const text = description.replace(/dish\s*washers?/gi, ' ')
  return IN_UNIT.test(text)
}

export function unitHasInUnitLaundry(policy: LaundryPolicy, description: string): boolean {
  if (policy === 'all') return true
  if (policy === 'none') return false
  return descriptionHasInUnitLaundry(description)
}

export function laundryLabel(inUnit: boolean, shared: boolean): string {
  if (inUnit) return 'In unit'
  if (shared) return 'On site'
  return '—'
}
