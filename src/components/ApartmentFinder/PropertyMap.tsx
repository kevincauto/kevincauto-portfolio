'use client'

import { useEffect } from 'react'
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import styles from './ApartmentFinder.module.css'
import { money } from '@/lib/galman/query'

export type MapProperty = {
  slug: string
  name: string
  address: string
  city: string
  lat: number
  lng: number
  count: number
  minRent: number
  url: string
}

type PropertyMapProps = {
  properties: MapProperty[]
  center: { lat: number; lng: number } | null
  radiusMiles: number
  highlightSlug: string | null
  activeSlugs: string[]
  onPickCenter: (lat: number, lng: number) => void
  onSelectProperty: (slug: string) => void
  theme: 'dark' | 'light'
}

const centerIcon = L.divIcon({
  className: 'finder-center-icon',
  html: '<span class="finder-center-dot"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

function pinIcon(property: MapProperty, hot: boolean, active: boolean) {
  const classes = ['finder-pin', hot ? 'finder-pin-hot' : '', active ? 'finder-pin-on' : ''].filter(Boolean).join(' ')
  return L.divIcon({
    className: 'finder-pin-wrap',
    html: `<div class="${classes}"><b>${property.count}</b><span>${money(property.minRent)}</span></div>`,
    iconSize: [24, 28],
    iconAnchor: [12, 28],
  })
}

function Frame({
  signature,
  positions,
  center,
  radiusMiles,
}: {
  signature: string
  positions: [number, number][]
  center: { lat: number; lng: number } | null
  radiusMiles: number
}) {
  const map = useMap()
  useEffect(() => {
    if (center) {
      map.fitBounds(L.latLng(center.lat, center.lng).toBounds(radiusMiles * 1609.344 * 2), { padding: [28, 28] })
      return
    }
    if (positions.length === 1) {
      map.setView(positions[0], 14)
      return
    }
    if (positions.length > 1) {
      map.fitBounds(L.latLngBounds(positions), { padding: [36, 36], maxZoom: 12 })
    }
    // Refit only when the search itself changes, not when a row hover rebuilds the pin list.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, signature])
  return null
}

function MapClick({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng)
    },
  })
  return null
}

export default function PropertyMap({
  properties,
  center,
  radiusMiles,
  highlightSlug,
  activeSlugs,
  onPickCenter,
  onSelectProperty,
  theme,
}: PropertyMapProps) {
  const positions = properties.map((property) => [property.lat, property.lng] as [number, number])
  const signature = [
    properties.map((property) => property.slug).join(','),
    center ? `${center.lat.toFixed(4)},${center.lng.toFixed(4)},${radiusMiles}` : '',
  ].join('|')

  return (
    <MapContainer
      center={[40.0, -75.16]}
      zoom={10}
      className={styles.mapCanvas}
      scrollWheelZoom
      zoomControl
    >
      {theme === 'dark' ? (
        <>
          <TileLayer
            key="dark-base"
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>, HERE, Garmin, &copy; OpenStreetMap contributors'
            url="https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          />
          <TileLayer
            key="dark-labels"
            url="https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
          />
        </>
      ) : (
        <TileLayer
          key="light"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      )}
      <Frame signature={signature} positions={positions} center={center} radiusMiles={radiusMiles} />
      <MapClick onPick={onPickCenter} />
      {center && (
        <>
          <Circle
            center={[center.lat, center.lng]}
            radius={radiusMiles * 1609.344}
            pathOptions={{
              color: theme === 'dark' ? '#e8a29c' : '#8c1d18',
              weight: 1.5,
              fillColor: theme === 'dark' ? '#e8a29c' : '#8c1d18',
              fillOpacity: theme === 'dark' ? 0.12 : 0.08,
            }}
          />
          <Marker position={[center.lat, center.lng]} icon={centerIcon} interactive={false} />
        </>
      )}
      {properties.map((property) => {
        const active = activeSlugs.includes(property.slug)
        return (
          <Marker
            key={property.slug}
            position={[property.lat, property.lng]}
            icon={pinIcon(property, highlightSlug === property.slug, active)}
            zIndexOffset={highlightSlug === property.slug || active ? 500 : 0}
            eventHandlers={{
              click: (event) => {
                if (event.originalEvent) L.DomEvent.stopPropagation(event.originalEvent)
                onSelectProperty(property.slug)
              },
            }}
          >
            <Popup>
              <div className={styles.popup}>
                <strong>{property.name}</strong>
                <p>
                  {property.count} available · from {money(property.minRent)}
                </p>
                <p>{[property.address, property.city].filter(Boolean).join(', ')}</p>
                <button type="button" onClick={() => onSelectProperty(property.slug)}>
                  {active ? 'Show all properties' : 'Only this property'}
                </button>
                <a href={property.url} target="_blank" rel="noreferrer">
                  Galman page
                </a>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
