import { netEffectiveRent, unitSpecial } from '@/lib/galman/specials'

describe('unitSpecial', () => {
  it('pulls concessions out of the special sentence', () => {
    expect(unitSpecial('Luxury apartment special Holiday Savings! One Month FREE Rent!')).toEqual({
      label: '1 month free',
      detail: 'special Holiday Savings! One Month FREE Rent!',
    })
    expect(unitSpecial('special Holiday Savings! Rent Dropped to $1,399 AND One Month FREE!').label).toBe(
      'Reduced to $1,399 · 1 month free'
    )
    expect(unitSpecial('special Holiday Savings! $1,000 Off First Month!').label).toBe('$1,000 off first month')
    expect(unitSpecial('special Holiday Savings! $500 Off First Month and 6 Months Free Parking!').label).toBe(
      '$500 off first month · 6 months free parking'
    )
    expect(unitSpecial('special Holiday Savings! Rent Dropped from $1,599.').label).toBe('Was $1,599')
    expect(unitSpecial('special Clubroom Renovation Savings! One Month FREE & Rent Reduced To $2,199.').label).toBe(
      '1 month free · Reduced to $2,199'
    )
    expect(unitSpecial('Classic style studio. Washer and dryer.')).toBeNull()
  })

  it('spreads one free month or money off the first month across a 12-month lease', () => {
    expect(netEffectiveRent(1735, 'special Holiday Savings! One Month FREE!')).toBeCloseTo((1735 * 11) / 12)
    expect(netEffectiveRent(1600, 'special Holiday Savings! $1,000 Off First Month!')).toBeCloseTo((1600 * 12 - 1000) / 12)
    expect(netEffectiveRent(1800, 'special Holiday Savings! One Month FREE & $500 Off First Month Rent!')).toBeCloseTo(
      (1800 * 11 - 500) / 12
    )
    expect(netEffectiveRent(1399, 'special Holiday Savings! 6 Months FREE Parking!')).toBeNull()
    expect(netEffectiveRent(1499, 'special Holiday Savings! Rent Reduced to $1,499.')).toBeNull()
    expect(netEffectiveRent(1500, 'Washer and dryer')).toBeNull()
  })
})