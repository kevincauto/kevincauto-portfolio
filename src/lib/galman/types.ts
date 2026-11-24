export type Region = 'city' | 'suburbs'

export type GalmanProperty = {
  slug: string
  name: string
  region: Region
  onsiteIds: string[]
  lat: number | null
  lng: number | null
  address: string
  city: string
  state: string
  zip: string
  url: string
}

export type ParsedUnit = {
  unitId: string
  propertyId: string
  unit: string
  rent: number
  beds: number | null
  baths: number | null
  sqft: number | null
  floorPlan: string
  floorplanDescription: string
  availableDate: string
  maxMoveIn: string | null
  description: string
  applyUrl: string
}

export type UnitRecord = ParsedUnit & {
  slug: string
  propertyName: string
  address: string
  city: string
  state: string
  zip: string
  region: Region
  lat: number | null
  lng: number | null
  galmanUrl: string
}

export type PropertyRecord = {
  slug: string
  name: string
  region: Region
  address: string
  city: string
  state: string
  zip: string
  lat: number | null
  lng: number | null
  url: string
  ok: boolean
  error?: string
  unitCount: number
}

export type UnitsResponse = {
  fetchedAt: string
  units: UnitRecord[]
  properties: PropertyRecord[]
}
