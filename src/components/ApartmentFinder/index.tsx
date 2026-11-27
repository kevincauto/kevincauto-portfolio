'use client'

import dynamic from 'next/dynamic'
import { Fragment, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { laundryLabel } from '@/lib/galman/laundry'
import { unitSpecial } from '@/lib/galman/specials'
import { onsiteListingUrl } from '@/lib/onsite/listingUrl'
import type { PropertyRecord, UnitsResponse } from '@/lib/galman/types'
import {
  activeFilterCount,
  applyQuery,
  bedsLabel,
  countsByProperty,
  defaultDir,
  defaultFilters,
  dirLabel,
  filtersFromSearchParams,
  filtersToQuery,
  formatDate,
  money,
  relativeTime,
  summarize,
  todayIso,
  toClientText,
  toCsv,
  unitKey,
  type Filters,
  type ListedUnit,
  type SortKey,
} from '@/lib/galman/query'
import styles from './ApartmentFinder.module.css'

const PropertyMap = dynamic(() => import('./PropertyMap'), {
  ssr: false,
  loading: () => <div className={styles.mapFallback}>Loading map…</div>,
})

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'rent', label: 'Price' },
  { value: 'net', label: 'Net effective' },
  { value: 'netb', label: 'Net effective / bedroom' },
  { value: 'ppb', label: 'Price / bedroom' },
  { value: 'beds', label: 'Bedrooms' },
  { value: 'sqft', label: 'Square feet' },
  { value: 'available', label: 'Available date' },
  { value: 'distance', label: 'Distance' },
  { value: 'property', label: 'Property' },
]

const BED_OPTIONS = [
  { value: 0, label: 'Studio' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3+' },
]

type Suggestion = { label: string; lat: number; lng: number }

function locationPatch(current: Filters, lat: number, lng: number, near: string): Filters {
  const firstPin = current.lat == null
  return {
    ...current,
    lat,
    lng,
    near,
    sort: firstPin && current.sort === 'rent' ? 'distance' : current.sort,
    dir: firstPin && current.sort === 'rent' ? 'asc' : current.dir,
  }
}

export default function ApartmentFinder() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [filters, setFilters] = useState<Filters>(() => filtersFromSearchParams(new URLSearchParams(searchParams.toString())))
  const [data, setData] = useState<UnitsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [hoverSlug, setHoverSlug] = useState<string | null>(null)
  const [showMap, setShowMap] = useState(false)
  const [openRows, setOpenRows] = useState<Set<string>>(new Set())
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [placeQuery, setPlaceQuery] = useState(filters.near)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [placeFocused, setPlaceFocused] = useState(false)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [propertyQuery, setPropertyQuery] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useLayoutEffect(() => {
    const saved = window.localStorage.getItem('re-theme')
    if (saved === 'light' || saved === 'dark') setTheme(saved)
  }, [])

  useLayoutEffect(() => {
    document.documentElement.dataset.reTheme = theme
    document.body.classList.toggle(styles.reBody, theme === 'dark')
  }, [theme])

  useLayoutEffect(() => {
    return () => {
      delete document.documentElement.dataset.reTheme
      document.body.classList.remove(styles.reBody)
    }
  }, [])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    window.localStorage.setItem('re-theme', next)
  }

  const pageClass = theme === 'light' ? `${styles.page} ${styles.light}` : styles.page

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 2800)
    return () => window.clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const query = filtersToQuery(filters)
      const next = query ? `${pathname}?${query}` : pathname
      if (`${window.location.pathname}${window.location.search}` !== next) {
        router.replace(next, { scroll: false })
      }
    }, 200)
    return () => window.clearTimeout(timer)
  }, [filters, pathname, router])

  useEffect(() => {
    let cancelled = false
    async function load(fresh: boolean) {
      if (fresh) setRefreshing(true)
      else setLoading(true)
      setError(null)
      try {
        const response = await fetch(fresh ? '/api/re/units?fresh=1' : '/api/re/units', { cache: 'no-store' })
        const body = await response.json()
        if (!response.ok) throw new Error(body?.error || 'Could not load availability')
        if (!cancelled) setData(body)
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Could not load availability')
      } finally {
        if (!cancelled) {
          setLoading(false)
          setRefreshing(false)
        }
      }
    }
    load(false)
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!placeFocused || placeQuery.trim().length < 3 || placeQuery.trim() === filters.near) {
      setSuggestions([])
      return
    }
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/re/geocode?q=${encodeURIComponent(placeQuery.trim())}`)
        const body = await response.json()
        setSuggestions(body.results || [])
        setSuggestOpen(true)
        setGeoError(body.error || null)
      } catch {
        setGeoError('Address search is unavailable right now.')
      }
    }, 400)
    return () => window.clearTimeout(timer)
  }, [placeQuery, placeFocused, filters.near])

  const visible = useMemo(() => (data ? applyQuery(data.units, filters) : []), [data, filters])
  const summary = useMemo(() => summarize(visible), [visible])
  const propertyCounts = useMemo(() => (data ? countsByProperty(data.units, filters) : new Map<string, number>()), [data, filters])

  const mapProperties = useMemo(() => {
    const groups = new Map<string, ListedUnit[]>()
    for (const unit of visible) {
      if (unit.lat == null || unit.lng == null) continue
      const group = groups.get(unit.slug) || []
      group.push(unit)
      groups.set(unit.slug, group)
    }
    return [...groups.values()].map((group) => ({
      slug: group[0].slug,
      name: group[0].propertyName,
      address: group[0].address,
      city: group[0].city,
      lat: group[0].lat as number,
      lng: group[0].lng as number,
      count: group.length,
      minRent: Math.min(...group.map((unit) => unit.rent)),
      url: group[0].galmanUrl,
      onsiteUrl: onsiteListingUrl(group[0].propertyId),
    }))
  }, [visible])

  const chosen = useMemo(() => {
    const picked = visible.filter((unit) => selected.has(unitKey(unit)))
    return picked.length ? picked : visible
  }, [visible, selected])
  const usingSelection = chosen !== visible && chosen.length > 0 && chosen.length !== visible.length

  async function refresh() {
    setRefreshing(true)
    setError(null)
    try {
      const response = await fetch('/api/re/units?fresh=1', { cache: 'no-store' })
      const body = await response.json()
      if (!response.ok) throw new Error(body?.error || 'Could not refresh availability')
      setData(body)
      setNotice('Availability refreshed')
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : 'Could not refresh availability')
    } finally {
      setRefreshing(false)
    }
  }

  async function copyText(text: string, message: string) {
    try {
      await navigator.clipboard.writeText(text)
      setNotice(message)
    } catch {
      setNotice('Could not copy. Your browser blocked clipboard access.')
    }
  }

  function exportCsv() {
    const stamp = new Date().toISOString().slice(0, 10)
    const blob = new Blob([toCsv(chosen)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `galman-availability-${stamp}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  function shareSearch() {
    const query = filtersToQuery(filters)
    const url = `${window.location.origin}${pathname}${query ? `?${query}` : ''}`
    void copyText(url, 'Search link copied')
  }

  function toggleBed(bed: number) {
    setFilters((current) => ({
      ...current,
      beds: current.beds.includes(bed) ? current.beds.filter((value) => value !== bed) : [...current.beds, bed].sort(),
    }))
  }

  function toggleFavorites() {
    setFilters((current) => ({
      ...current,
      favorites: !current.favorites,
      props: current.favorites ? current.props : [],
    }))
  }

  function toggleProperty(slug: string) {
    setFilters((current) => ({
      ...current,
      favorites: false,
      props: current.favorites ? [slug] : current.props.includes(slug) ? current.props.filter((value) => value !== slug) : [...current.props, slug],
    }))
  }

  function focusProperty(slug: string) {
    setFilters((current) => ({
      ...current,
      favorites: false,
      props: !current.favorites && current.props.length === 1 && current.props[0] === slug ? [] : [slug],
    }))
  }

  function sortBy(sort: SortKey) {
    setFilters((current) =>
      current.sort === sort ? { ...current, dir: current.dir === 'asc' ? 'desc' : 'asc' } : { ...current, sort, dir: defaultDir(sort) }
    )
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setGeoError('This browser cannot share your location.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFilters((current) => locationPatch(current, position.coords.latitude, position.coords.longitude, 'My location'))
        setPlaceQuery('My location')
        setGeoError(null)
      },
      () => setGeoError('Location permission was blocked.'),
      { enableHighAccuracy: false, timeout: 8000 }
    )
  }

  function clearLocation() {
    setFilters((current) => ({
      ...current,
      lat: null,
      lng: null,
      near: '',
      sort: current.sort === 'distance' ? 'rent' : current.sort,
      dir: current.sort === 'distance' ? 'asc' : current.dir,
    }))
    setPlaceQuery('')
    setSuggestions([])
  }

  function resetFilters() {
    setFilters(defaultFilters)
    setPlaceQuery('')
    setPropertyQuery('')
    setSelected(new Set())
  }

  const allVisibleSelected = visible.length > 0 && visible.every((unit) => selected.has(unitKey(unit)))

  function toggleAll() {
    setSelected((current) => {
      const next = new Set(current)
      if (allVisibleSelected) visible.forEach((unit) => next.delete(unitKey(unit)))
      else visible.forEach((unit) => next.add(unitKey(unit)))
      return next
    })
  }

  function toggleRow(key: string) {
    setOpenRows((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function toggleUnit(key: string) {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  if (loading && !data) {
    return (
      <div className={pageClass}>
        <div className={styles.loadingPanel}>
          <p className={styles.kicker}>Galman Group · Pennsylvania</p>
          <h1>Checking availability</h1>
          <p>Pulling live units from On-Site for every Philadelphia and suburban property.</p>
          <div className={styles.pulse} />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className={pageClass}>
        <div className={styles.error}>
          <p>{error || 'Could not load availability.'}</p>
          <button type="button" className={styles.button} onClick={() => window.location.reload()}>
            Try again
          </button>
        </div>
      </div>
    )
  }

  const failed = data.properties.filter((property) => !property.ok)
  const propertyQueryText = propertyQuery.trim().toLowerCase()
  const properties = data.properties
    .filter((property) => property.ok)
    .filter((property) => {
      if (!propertyQueryText) return true
      return `${property.name} ${property.city} ${property.address}`.toLowerCase().includes(propertyQueryText)
    })
  const located = filters.lat != null && filters.lng != null
  const filterCount = activeFilterCount(filters)

  return (
    <div className={pageClass}>
      <div className={styles.shell}>
        <header className={styles.top}>
          <div>
            <p className={styles.kicker}>Galman Group · Pennsylvania</p>
            <h1>Available apartments</h1>
            <p className={styles.lede}>
              Every open unit in Philadelphia and the suburbs, sorted the way you actually search.
              Updated {relativeTime(data.fetchedAt, now)}.
            </p>
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.button} onClick={toggleTheme}>
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
            <button type="button" className={`${styles.button} ${styles.mobileFilters}`} onClick={() => setFiltersOpen((open) => !open)}>
              Filters{filterCount ? ` (${filterCount})` : ''}
            </button>
            <button type="button" className={styles.button} onClick={shareSearch}>
              Copy search link
            </button>
            <button type="button" className={styles.button} onClick={exportCsv} disabled={!chosen.length}>
              Export CSV
            </button>
            <button
              type="button"
              className={styles.button}
              disabled={!chosen.length}
              onClick={() => copyText(toClientText(chosen, filters), usingSelection ? `Copied ${chosen.length} selected` : 'List copied')}
            >
              {usingSelection ? `Copy ${chosen.length} for client` : 'Copy list for client'}
            </button>
            <button type="button" className={`${styles.button} ${styles.buttonPrimary}`} onClick={refresh} disabled={refreshing}>
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </header>

        {notice && <p className={styles.notice}>{notice}</p>}
        {error && <p className={styles.banner}>{error}</p>}
        {failed.length > 0 && (
          <p className={styles.banner}>
            {failed.length === 1 ? '1 property' : `${failed.length} properties`} did not load:{' '}
            {failed.map((property) => property.name).join(', ')}. Refresh to try them again.
          </p>
        )}

        <div className={styles.workspace}>
          <aside className={`${styles.filters} ${filtersOpen ? styles.filtersOpen : ''}`}>
            <div className={styles.filterHead}>
              <h2>Search</h2>
              <button type="button" className={styles.linkish} onClick={resetFilters}>
                Reset
              </button>
            </div>

            <div className={styles.group}>
              <label htmlFor="near">Location</label>
              <div className={styles.suggest}>
                <input
                  id="near"
                  className={styles.input}
                  placeholder="Address, city, or ZIP"
                  value={placeQuery}
                  onFocus={() => setPlaceFocused(true)}
                  onBlur={() => {
                    setPlaceFocused(false)
                    window.setTimeout(() => setSuggestOpen(false), 180)
                  }}
                  onChange={(event) => {
                    setPlaceQuery(event.target.value)
                    setPlaceFocused(true)
                    setSuggestOpen(true)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && suggestions[0]) {
                      event.preventDefault()
                      const place = suggestions[0]
                      setFilters((current) => locationPatch(current, place.lat, place.lng, place.label))
                      setPlaceQuery(place.label)
                      setSuggestOpen(false)
                    }
                  }}
                />
                {suggestOpen && suggestions.length > 0 && (
                  <div className={styles.suggestList}>
                    {suggestions.map((place) => (
                      <button
                        type="button"
                        key={`${place.lat},${place.lng}`}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setFilters((current) => locationPatch(current, place.lat, place.lng, place.label))
                          setPlaceQuery(place.label)
                          setSuggestOpen(false)
                        }}
                      >
                        {place.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className={styles.inlineActions}>
                <button type="button" className={styles.linkish} onClick={useMyLocation}>
                  Use my location
                </button>
                {located && (
                  <button type="button" className={styles.linkish} onClick={clearLocation}>
                    Clear location
                  </button>
                )}
              </div>
              {geoError && <p className={styles.hint}>{geoError}</p>}
            </div>

            <div className={styles.group}>
              <div className={styles.sliderMeta}>
                <span className={styles.label}>Radius</span>
                <span>{filters.radius} mi</span>
              </div>
              <input
                className={styles.slider}
                type="range"
                min={0.5}
                max={25}
                step={0.5}
                value={filters.radius}
                aria-label="Search radius in miles"
                disabled={!located}
                onChange={(event) => setFilters((current) => ({ ...current, radius: Number(event.target.value) }))}
              />
              <div className={styles.presets}>
                {[1, 3, 5, 10, 15].map((miles) => (
                  <button
                    type="button"
                    key={miles}
                    aria-pressed={filters.radius === miles}
                    disabled={!located}
                    onClick={() => setFilters((current) => ({ ...current, radius: miles }))}
                  >
                    {miles} mi
                  </button>
                ))}
              </div>
              <p className={styles.hint}>
                {located ? 'Straight-line distance. Click the map to move the pin.' : 'Set a location to filter by distance.'}
              </p>
            </div>

            <div className={styles.group}>
              <span className={styles.label}>Rent</span>
              <div className={styles.row2}>
                <input
                  className={styles.input}
                  type="number"
                  min={0}
                  inputMode="numeric"
                  placeholder="Min"
                  aria-label="Minimum rent"
                  value={filters.min ?? ''}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, min: event.target.value === '' ? null : Number(event.target.value) }))
                  }
                />
                <input
                  className={styles.input}
                  type="number"
                  min={0}
                  inputMode="numeric"
                  placeholder="Max"
                  aria-label="Maximum rent"
                  value={filters.max ?? ''}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, max: event.target.value === '' ? null : Number(event.target.value) }))
                  }
                />
              </div>
            </div>

            <div className={styles.group}>
              <span className={styles.label}>Bedrooms</span>
              <div className={styles.segment}>
                {BED_OPTIONS.map((option) => (
                  <button
                    type="button"
                    key={option.value}
                    aria-pressed={filters.beds.includes(option.value)}
                    onClick={() => toggleBed(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.group}>
              <button
                type="button"
                className={filters.favorites ? styles.textOn : styles.linkish}
                aria-pressed={filters.favorites}
                onClick={toggleFavorites}
              >
                Favorites
              </button>
              <button
                type="button"
                className={filters.laundry ? styles.textOn : styles.linkish}
                aria-pressed={filters.laundry}
                onClick={() => setFilters((current) => ({ ...current, laundry: !current.laundry }))}
              >
                In-unit laundry
              </button>
            </div>

            <div className={styles.row2}>
              <label className={styles.group}>
                <span className={styles.label}>Baths</span>
                <select
                  className={styles.select}
                  value={filters.baths ?? ''}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, baths: event.target.value === '' ? null : Number(event.target.value) }))
                  }
                >
                  <option value="">Any</option>
                  <option value="1">1+</option>
                  <option value="1.5">1.5+</option>
                  <option value="2">2+</option>
                  <option value="2.5">2.5+</option>
                </select>
              </label>
              <label className={styles.group}>
                <span className={styles.label}>Min sq ft</span>
                <input
                  className={styles.input}
                  type="number"
                  min={0}
                  inputMode="numeric"
                  placeholder="Any"
                  value={filters.sqft ?? ''}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, sqft: event.target.value === '' ? null : Number(event.target.value) }))
                  }
                />
              </label>
            </div>

            <div className={styles.group}>
              <label htmlFor="available-by" className={styles.label}>
                Available by
              </label>
              <input
                id="available-by"
                className={styles.input}
                type="date"
                value={filters.by}
                onChange={(event) => setFilters((current) => ({ ...current, by: event.target.value }))}
              />
              <button
                type="button"
                className={filters.by === todayIso() ? styles.textOn : styles.linkish}
                onClick={() => setFilters((current) => ({ ...current, by: current.by === todayIso() ? '' : todayIso() }))}
              >
                Available now
              </button>
            </div>

            <div className={styles.group}>
              <span className={styles.label}>Region</span>
              <div className={styles.segment}>
                {(
                  [
                    ['all', 'All'],
                    ['city', 'Philly'],
                    ['suburbs', 'Suburbs'],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    type="button"
                    key={value}
                    aria-pressed={filters.region === value}
                    onClick={() => setFilters((current) => ({ ...current, region: value }))}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.group}>
              <label htmlFor="keyword" className={styles.label}>
                Keyword
              </label>
              <input
                id="keyword"
                className={styles.input}
                placeholder="washer, patio, den…"
                value={filters.q}
                onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
              />
            </div>

            <div className={styles.group}>
              <label htmlFor="property-find" className={styles.label}>
                Properties
              </label>
              <input
                id="property-find"
                className={styles.input}
                placeholder="Filter the list"
                value={propertyQuery}
                onChange={(event) => setPropertyQuery(event.target.value)}
              />
              <div className={styles.propertyList}>
                <PropertyGroup
                  title="Philadelphia"
                  properties={properties.filter((property) => property.region === 'city')}
                  counts={propertyCounts}
                  selected={filters.props}
                  onToggle={toggleProperty}
                />
                <PropertyGroup
                  title="Suburbs"
                  properties={properties.filter((property) => property.region === 'suburbs')}
                  counts={propertyCounts}
                  selected={filters.props}
                  onToggle={toggleProperty}
                />
              </div>
            </div>
          </aside>

          <section className={styles.main}>
            <div className={styles.stats}>
              <Stat label="Units" value={String(summary.count)} />
              <Stat label="Properties" value={String(summary.properties)} />
              <Stat label="Median rent" value={summary.median == null ? '—' : money(summary.median)} />
              <Stat label="Studio from" value={summary.studio == null ? '—' : money(summary.studio)} />
              <Stat label="1 bed from" value={summary.one == null ? '—' : money(summary.one)} />
              <Stat label="2 bed from" value={summary.two == null ? '—' : money(summary.two)} />
            </div>

            {showMap && (
              <div className={styles.mapFrame}>
                <PropertyMap
                  properties={mapProperties}
                  center={located ? { lat: filters.lat as number, lng: filters.lng as number } : null}
                  radiusMiles={filters.radius}
                  highlightSlug={hoverSlug}
                  activeSlugs={filters.props}
                  onPickCenter={(lat, lng) => {
                    setFilters((current) => locationPatch(current, lat, lng, 'Dropped pin'))
                    setPlaceQuery('Dropped pin')
                  }}
                  onSelectProperty={focusProperty}
                  theme={theme}
                />
              </div>
            )}

            <div className={styles.toolbar}>
              <div className={styles.toolbarLeft}>
                <button type="button" className={styles.button} aria-pressed={showMap} onClick={() => setShowMap((open) => !open)}>
                  {showMap ? 'Hide map' : 'Show map'}
                </button>
                <button type="button" className={styles.button} aria-pressed={filters.favorites} onClick={toggleFavorites}>
                  Favorites
                </button>
                <button
                  type="button"
                  className={styles.button}
                  aria-pressed={filters.laundry}
                  onClick={() => setFilters((current) => ({ ...current, laundry: !current.laundry }))}
                >
                  In-unit laundry
                </button>
                <strong>
                  {summary.count} unit{summary.count === 1 ? '' : 's'}
                </strong>
                <span className={styles.hint}>at {summary.properties} properties</span>
                {summary.three != null && <span className={styles.hint}>3+ from {money(summary.three)}</span>}
              </div>
              <div className={styles.toolbarRight}>
                <label className={styles.sortLabel}>
                  Sort
                  <select
                    className={styles.select}
                    value={filters.sort}
                    onChange={(event) => {
                      const sort = event.target.value as SortKey
                      setFilters((current) => ({ ...current, sort, dir: current.sort === sort ? current.dir : defaultDir(sort) }))
                    }}
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="button" className={styles.button} onClick={() => setFilters((current) => ({ ...current, dir: current.dir === 'asc' ? 'desc' : 'asc' }))}>
                  {dirLabel(filters.sort, filters.dir)}
                </button>
                <label className={styles.sortLabel}>
                  Then
                  <select
                    className={styles.select}
                    value={filters.then}
                    onChange={(event) => setFilters((current) => ({ ...current, then: event.target.value as SortKey | '' }))}
                  >
                    <option value="">None</option>
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className={styles.segment}>
                  <button type="button" aria-pressed={filters.view === 'table'} onClick={() => setFilters((current) => ({ ...current, view: 'table' }))}>
                    Table
                  </button>
                  <button type="button" aria-pressed={filters.view === 'cards'} onClick={() => setFilters((current) => ({ ...current, view: 'cards' }))}>
                    Cards
                  </button>
                </div>
              </div>
            </div>

            <ActiveChips filters={filters} onChange={setFilters} onClearNear={clearLocation} />

            {visible.length === 0 ? (
              <div className={styles.empty}>
                <p>No units match this search.</p>
                <button type="button" className={styles.button} onClick={resetFilters}>
                  Clear filters
                </button>
              </div>
            ) : filters.view === 'table' ? (
              <div className={styles.tableWrap}>
                <table>
                  <thead>
                    <tr>
                      <th />
                      <th>
                        <input className={styles.check} type="checkbox" checked={allVisibleSelected} onChange={toggleAll} aria-label="Select all visible units" />
                      </th>
                      <SortHeader label="Property" sort="property" filters={filters} onSort={sortBy} />
                      <SortHeader label="Beds" sort="beds" filters={filters} onSort={sortBy} />
                      <th>Baths</th>
                      <SortHeader label="Rent" sort="rent" filters={filters} onSort={sortBy} />
                      <SortHeader label="Net" sort="net" filters={filters} onSort={sortBy} />
                      <SortHeader label="Net/bed" sort="netb" filters={filters} onSort={sortBy} />
                      <SortHeader label="$/bed" sort="ppb" filters={filters} onSort={sortBy} />
                      <th>Special</th>
                      <SortHeader label="Available" sort="available" filters={filters} onSort={sortBy} />
                      <th>Laundry</th>
                      <SortHeader label="Sq ft" sort="sqft" filters={filters} onSort={sortBy} />
                      <th>Unit</th>
                      {located && <SortHeader label="Distance" sort="distance" filters={filters} onSort={sortBy} />}
                      <th>On-Site</th>
                      <th>Galman</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((unit) => {
                      const key = unitKey(unit)
                      const available = formatDate(unit.availableDate)
                      const open = openRows.has(key)
                      const columns = located ? 17 : 16
                      const special = unitSpecial(unit.description)
                      const canExpand = Boolean(unit.description || unit.floorPlan)
                      return (
                        <Fragment key={key}>
                          <tr
                            className={hoverSlug === unit.slug ? styles.rowHot : undefined}
                            onMouseEnter={() => setHoverSlug(unit.slug)}
                            onMouseLeave={() => setHoverSlug((current) => (current === unit.slug ? null : current))}
                            onClick={() => {
                              if (canExpand) toggleRow(key)
                            }}
                          >
                            <td>
                              {canExpand ? (
                                <button
                                  type="button"
                                  className={styles.expander}
                                  aria-expanded={open}
                                  aria-label={open ? `Hide description for ${unit.unit}` : `Show description for ${unit.unit}`}
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    toggleRow(key)
                                  }}
                                >
                                  {open ? '▾' : '▸'}
                                </button>
                              ) : null}
                            </td>
                            <td>
                              <input
                                className={styles.check}
                                type="checkbox"
                                checked={selected.has(key)}
                                onClick={(event) => event.stopPropagation()}
                                onChange={() => toggleUnit(key)}
                                aria-label={`Select ${unit.unit} at ${unit.propertyName}`}
                              />
                            </td>
                            <td className={styles.compactCell}>
                              <button
                                type="button"
                                className={styles.propertyButton}
                                onClick={(event) => {
                                  event.stopPropagation()
                                  focusProperty(unit.slug)
                                }}
                              >
                                {unit.propertyName}
                              </button>
                              <span className={styles.city}>{unit.city}</span>
                            </td>
                            <td className={styles.num}>{bedsLabel(unit.beds)}</td>
                            <td className={styles.num}>{unit.baths ?? '—'}</td>
                            <td className={`${styles.num} ${styles.rent}`}>{money(unit.rent)}</td>
                            <td className={`${styles.num} ${styles.rent}`} title={unit.netEffective === unit.rent ? undefined : 'Net effective on a 12-month lease'}>
                              {money(unit.netEffective)}
                            </td>
                            <td className={styles.num} title={unit.netEffective === unit.rent ? undefined : 'Net effective rent per bedroom'}>
                              {money(unit.netPerBedroom)}
                            </td>
                            <td className={styles.num}>{unit.pricePerBedroom == null ? '—' : money(unit.pricePerBedroom)}</td>
                            <td className={special ? styles.special : styles.num} title={special?.detail}>
                              {special ? special.label : '—'}
                            </td>
                            <td className={available === 'Now' ? styles.now : styles.num}>{available}</td>
                            <td className={unit.inUnitLaundry ? styles.now : styles.num}>{laundryLabel(unit.inUnitLaundry, unit.sharedLaundry)}</td>
                            <td className={styles.num}>{unit.sqft ? unit.sqft.toLocaleString() : '—'}</td>
                            <td className={styles.unitName}>{unit.unit || 'Unit'}</td>
                            {located && <td className={styles.num}>{unit.distance == null ? '—' : `${unit.distance.toFixed(1)} mi`}</td>}
                            <td>
                              <a
                                className={styles.apply}
                                href={onsiteListingUrl(unit.propertyId)}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={`On-Site page for ${unit.propertyName}`}
                                onClick={(event) => event.stopPropagation()}
                              >
                                Page
                              </a>
                            </td>
                            <td>
                              <a
                                className={styles.apply}
                                href={unit.galmanUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(event) => event.stopPropagation()}
                              >
                                Page
                              </a>
                            </td>
                          </tr>
                          {open && (
                            <tr className={styles.detailRow}>
                              <td colSpan={columns}>
                                <div className={styles.detail}>
                                  <p className={styles.detailMeta}>
                                    {[unit.address, unit.city, unit.state, unit.zip].filter(Boolean).join(', ')}
                                    {unit.floorPlan ? ` · ${unit.floorPlan}` : ''}
                                  </p>
                                  {unit.description ? <p className={styles.detailText}>{unit.description}</p> : null}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <CardList
                units={visible}
                selected={selected}
                located={located}
                onToggle={toggleUnit}
                onFocusProperty={focusProperty}
                onHover={setHoverSlug}
              />
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.stat}>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  )
}

function SortHeader({
  label,
  sort,
  filters,
  onSort,
}: {
  label: string
  sort: SortKey
  filters: Filters
  onSort: (sort: SortKey) => void
}) {
  const active = filters.sort === sort
  return (
    <th aria-sort={active ? (filters.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" onClick={() => onSort(sort)}>
        {label}
        {active ? (filters.dir === 'asc' ? ' ↑' : ' ↓') : ''}
      </button>
    </th>
  )
}

function PropertyGroup({
  title,
  properties,
  counts,
  selected,
  onToggle,
}: {
  title: string
  properties: PropertyRecord[]
  counts: Map<string, number>
  selected: string[]
  onToggle: (slug: string) => void
}) {
  if (!properties.length) return null
  const ordered = [...properties].sort((left, right) => left.name.localeCompare(right.name))
  return (
    <div>
      <div className={styles.regionLabel}>{title}</div>
      {ordered.map((property) => {
        const count = counts.get(property.slug) || 0
        return (
          <label key={property.slug} className={styles.propertyRow}>
            <input className={styles.check} type="checkbox" checked={selected.includes(property.slug)} onChange={() => onToggle(property.slug)} />
            <span>
              {property.name}
              <small>{property.city || property.address}</small>
            </span>
            <em>{count}</em>
          </label>
        )
      })}
    </div>
  )
}

function ActiveChips({
  filters,
  onChange,
  onClearNear,
}: {
  filters: Filters
  onChange: (update: (current: Filters) => Filters) => void
  onClearNear: () => void
}) {
  const chips: { key: string; label: string; clear: () => void }[] = []
  if (filters.lat != null) {
    chips.push({ key: 'near', label: filters.near ? `${filters.near} · ${filters.radius} mi` : `${filters.radius} mi radius`, clear: onClearNear })
  }
  if (filters.beds.length) {
    const label = filters.beds.map((bed) => (bed === 0 ? 'Studio' : bed === 3 ? '3+' : `${bed} bed`)).join(', ')
    chips.push({ key: 'beds', label, clear: () => onChange((current) => ({ ...current, beds: [] })) })
  }
  if (filters.min != null) chips.push({ key: 'min', label: `At least ${money(filters.min)}`, clear: () => onChange((current) => ({ ...current, min: null })) })
  if (filters.max != null) chips.push({ key: 'max', label: `Up to ${money(filters.max)}`, clear: () => onChange((current) => ({ ...current, max: null })) })
  if (filters.baths != null) chips.push({ key: 'baths', label: `${filters.baths}+ baths`, clear: () => onChange((current) => ({ ...current, baths: null })) })
  if (filters.sqft != null) chips.push({ key: 'sqft', label: `${filters.sqft.toLocaleString()}+ sq ft`, clear: () => onChange((current) => ({ ...current, sqft: null })) })
  if (filters.by) chips.push({ key: 'by', label: `By ${formatDate(filters.by) === 'Now' ? 'today' : formatDate(filters.by)}`, clear: () => onChange((current) => ({ ...current, by: '' })) })
  if (filters.region !== 'all') {
    chips.push({
      key: 'region',
      label: filters.region === 'city' ? 'Philadelphia' : 'Suburbs',
      clear: () => onChange((current) => ({ ...current, region: 'all' })),
    })
  }
  if (filters.q.trim()) chips.push({ key: 'q', label: filters.q.trim(), clear: () => onChange((current) => ({ ...current, q: '' })) })
  if (filters.favorites) chips.push({ key: 'favorites', label: 'Favorites', clear: () => onChange((current) => ({ ...current, favorites: false })) })
  if (filters.laundry) chips.push({ key: 'laundry', label: 'In-unit laundry', clear: () => onChange((current) => ({ ...current, laundry: false })) })
  if (filters.props.length) {
    chips.push({
      key: 'props',
      label: filters.props.length === 1 ? '1 property' : `${filters.props.length} properties`,
      clear: () => onChange((current) => ({ ...current, props: [] })),
    })
  }
  if (!chips.length) return null
  return (
    <div className={styles.chips}>
      {chips.map((chip) => (
        <span key={chip.key} className={styles.chip}>
          {chip.label}
          <button type="button" onClick={chip.clear} aria-label={`Remove ${chip.label}`}>
            ×
          </button>
        </span>
      ))}
    </div>
  )
}

function CardList({
  units,
  selected,
  located,
  onToggle,
  onFocusProperty,
  onHover,
}: {
  units: ListedUnit[]
  selected: Set<string>
  located: boolean
  onToggle: (key: string) => void
  onFocusProperty: (slug: string) => void
  onHover: (slug: string | null) => void
}) {
  const groups: ListedUnit[][] = []
  const index = new Map<string, ListedUnit[]>()
  for (const unit of units) {
    const existing = index.get(unit.slug)
    if (existing) existing.push(unit)
    else {
      const group = [unit]
      index.set(unit.slug, group)
      groups.push(group)
    }
  }

  return (
    <div className={styles.cards}>
      {groups.map((group) => {
        const first = group[0]
        return (
          <article
            key={first.slug}
            className={styles.card}
            onMouseEnter={() => onHover(first.slug)}
            onMouseLeave={() => onHover(null)}
          >
            <header className={styles.cardHead}>
              <div>
                <h3>
                  <button type="button" className={styles.propertyButton} onClick={() => onFocusProperty(first.slug)}>
                    {first.propertyName}
                  </button>
                </h3>
                <p>
                  {[first.address, first.city].filter(Boolean).join(', ')}
                  {located && first.distance != null ? ` · ${first.distance.toFixed(1)} mi` : ''}
                </p>
              </div>
              <div className={styles.cardLinks}>
                <a className={styles.apply} href={onsiteListingUrl(first.propertyId)} target="_blank" rel="noreferrer">
                  On-Site
                </a>
                <a className={styles.apply} href={first.galmanUrl} target="_blank" rel="noreferrer">
                  Property page
                </a>
              </div>
            </header>
            {group.map((unit) => {
              const key = unitKey(unit)
              const available = formatDate(unit.availableDate)
              const special = unitSpecial(unit.description)
              return (
                <div key={key} className={styles.cardUnit}>
                  <input className={styles.check} type="checkbox" checked={selected.has(key)} onChange={() => onToggle(key)} aria-label={`Select ${unit.unit}`} />
                  <div>
                    <div className={styles.unitName}>{unit.unit || 'Unit'}</div>
                    {special && <div className={styles.special}>{special.label}</div>}
                    <div className={styles.unitMeta}>
                      {unit.beds == null ? 'Beds unknown' : unit.beds === 0 ? 'Studio' : `${unit.beds} bed${unit.beds === 1 ? '' : 's'}`}
                      {unit.baths != null ? ` · ${unit.baths} bath${unit.baths === 1 ? '' : 's'}` : ''}
                      {unit.sqft ? ` · ${unit.sqft.toLocaleString()} sq ft` : ''}
                      {unit.floorPlan ? ` · ${unit.floorPlan}` : ''}
                      {laundryLabel(unit.inUnitLaundry, unit.sharedLaundry) === '—'
                        ? ''
                        : ` · ${laundryLabel(unit.inUnitLaundry, unit.sharedLaundry)}`}
                    </div>
                    {unit.description && <div className={styles.unitDesc}>{unit.description}</div>}
                  </div>
                  <div>
                    <div className={styles.rent}>{money(unit.rent)}</div>
                    {unit.netEffective !== unit.rent && <div className={styles.unitMeta}>{`${money(unit.netEffective)} net`}</div>}
                    {unit.netEffective !== unit.rent && unit.beds != null && unit.beds > 0 && (
                      <div className={styles.unitMeta}>{`${money(unit.netPerBedroom)} net / bed`}</div>
                    )}
                    {unit.pricePerBedroom != null && <div className={styles.unitMeta}>{`${money(unit.pricePerBedroom)} / bed`}</div>}
                  </div>
                  <div className={available === 'Now' ? styles.now : undefined}>{available}</div>
                </div>
              )
            })}
          </article>
        )
      })}
    </div>
  )
}
