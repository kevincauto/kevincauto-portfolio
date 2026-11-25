import { descriptionHasInUnitLaundry, laundryLabel, unitHasInUnitLaundry } from '@/lib/galman/laundry'

describe('descriptionHasInUnitLaundry', () => {
  it('recognizes in-unit wording and ignores dishwashers and shared laundry rooms', () => {
    expect(descriptionHasInUnitLaundry('Upgrade with Washer & Dryer')).toBe(true)
    expect(descriptionHasInUnitLaundry('washer/dryer in unit')).toBe(true)
    expect(descriptionHasInUnitLaundry('Luxury with Washer Dryer & Breakfast Bar')).toBe(true)
    expect(descriptionHasInUnitLaundry('W/D, Upgraded')).toBe(true)
    expect(descriptionHasInUnitLaundry('in-home laundry room')).toBe(true)
    expect(descriptionHasInUnitLaundry('Dishwasher and Microwave')).toBe(false)
    expect(descriptionHasInUnitLaundry('Ground Floor Laundry Room')).toBe(false)
    expect(descriptionHasInUnitLaundry('on-site laundry facilities')).toBe(false)
  })

  it('uses the property rule before the description', () => {
    expect(unitHasInUnitLaundry('all', '')).toBe(true)
    expect(unitHasInUnitLaundry('none', 'Washer & Dryer')).toBe(false)
    expect(unitHasInUnitLaundry('unit', 'washer and dryer')).toBe(true)
    expect(unitHasInUnitLaundry('unit', 'Classic apartment')).toBe(false)
    expect(laundryLabel(false, true)).toBe('On site')
    expect(laundryLabel(true, true)).toBe('In unit')
    expect(laundryLabel(false, false)).toBe('—')
  })
})