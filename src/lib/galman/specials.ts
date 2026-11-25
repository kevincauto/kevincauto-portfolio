const SPECIAL = /special\s+(.+?)\s*savings!\s*([\s\S]*)$/i

const NUMBER_WORDS: Record<string, string> = {
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9',
  ten: '10',
  eleven: '11',
  twelve: '12',
}

function countWord(value: string): string {
  return NUMBER_WORDS[value.toLowerCase()] || value
}

function months(value: string): string {
  const count = countWord(value)
  return `${count} month${count === '1' ? '' : 's'}`
}

function formatOffer(chunk: string): string {
  const text = chunk.trim().replace(/[.!]+$/g, '')
  const parking = text.match(/^(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+months?\s+free\s+parking$/i)
  if (parking) return `${months(parking[1])} free parking`
  const free = text.match(/^(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+months?\s+free(?:\s+rent)?$/i)
  if (free) return `${months(free[1])} free`
  const off = text.match(/^(\$[\d,]+)\s+off\s+first\s+month(?:\s+rent)?$/i)
  if (off) return `${off[1]} off first month`
  const reduced = text.match(/^rent\s+(?:dropped|reduced)\s+to\s+(\$[\d,]+)$/i)
  if (reduced) return `Reduced to ${reduced[1]}`
  const was = text.match(/^rent\s+dropped\s+from\s+(\$[\d,]+)$/i)
  if (was) return `Was ${was[1]}`
  return text
}

const COUNT = '(\\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)'

export const LEASE_MONTHS = 12

export function rentConcession(description: string): { freeMonths: number; dollarsOff: number } | null {
  const match = description.match(SPECIAL)
  if (!match) return null
  const offer = match[2].replace(/\s+/g, ' ').trim().replace(/[.!]+$/g, '')
  if (!offer) return null
  let freeMonths = 0
  let dollarsOff = 0
  for (const chunk of offer.split(/\s+(?:and|&)\s+/i)) {
    const text = chunk.trim().replace(/[.!]+$/g, '')
    if (/free\s+parking/i.test(text)) continue
    const free = text.match(new RegExp(`^${COUNT}\\s+months?\\s+free(?:\\s+rent)?$`, 'i'))
    if (free) {
      freeMonths += Number(countWord(free[1]))
      continue
    }
    const off = text.match(/^\$([\d,]+)\s+off\s+first\s+month(?:\s+rent)?$/i)
    if (off) dollarsOff += Number(off[1].replace(/,/g, ''))
  }
  if (!freeMonths && !dollarsOff) return null
  return { freeMonths, dollarsOff }
}

export function netEffectiveRent(rent: number, description: string): number | null {
  const concession = rentConcession(description)
  if (!concession) return null
  const paidMonths = LEASE_MONTHS - concession.freeMonths
  if (paidMonths <= 0) return null
  return (rent * paidMonths - concession.dollarsOff) / LEASE_MONTHS
}

export function unitSpecial(description: string): { label: string; detail: string } | null {
  const match = description.match(SPECIAL)
  if (!match) return null
  const name = match[1].replace(/\s+/g, ' ').trim()
  const offer = match[2].replace(/\s+/g, ' ').trim()
  const detail = `special ${name} Savings!${offer ? ` ${offer}` : ''}`.replace(/\s+/g, ' ').trim()
  if (!offer) return { label: `${name} savings`, detail }
  const label = offer
    .replace(/[.!]+$/g, '')
    .split(/\s+(?:and|&)\s+/i)
    .map(formatOffer)
    .filter(Boolean)
    .join(' · ')
  return { label: label || `${name} savings`, detail }
}
