const EARTH_MILES = 3958.7613

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

export function milesBetween(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2
  return EARTH_MILES * 2 * Math.asin(Math.min(1, Math.sqrt(a)))
}
