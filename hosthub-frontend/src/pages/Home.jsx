import { useEffect, useState } from 'react'
import api from '../api/axios'
import HotelCard from '../components/HotelCard'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import ErrorBanner from '../components/ErrorBanner'

const todayStr = () => new Date().toISOString().split('T')[0]
const tomorrowStr = () => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

const COMMON_AMENITIES = ['WiFi', 'Pool', 'AC', 'Parking', 'Breakfast']

export default function Home() {
  const [form, setForm] = useState({
    city: '',
    startDate: todayStr(),
    endDate: tomorrowStr(),
    roomsCount: 1,
    minPrice: '',
    maxPrice: '',
    sortBy: 'PRICE_ASC',
    amenities: [],
  })

  const [cities, setCities] = useState([])
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searched, setSearched] = useState(false)

  // Fetch active cities on mount for suggestions
  useEffect(() => {
    api.get('/hotels/cities')
      .then((res) => {
        if (Array.isArray(res.data)) {
          setCities(res.data)
        }
      })
      .catch(() => {})
  }, [])

  const handleAmenityToggle = (amenity) => {
    setForm((prev) => {
      const exists = prev.amenities.includes(amenity)
      const next = exists
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity]
      return { ...prev, amenities: next }
    })
  }

  const runSearch = async (pageNumber = 0) => {
    setError(null)
    setLoading(true)
    setSearched(true)
    try {
      const payload = {
        city: form.city.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        roomsCount: Number(form.roomsCount),
        minPrice: form.minPrice ? Number(form.minPrice) : null,
        maxPrice: form.maxPrice ? Number(form.maxPrice) : null,
        amenities: form.amenities.length > 0 ? form.amenities : null,
        sortBy: form.sortBy,
        page: pageNumber,
        size: 8,
      }
      const res = await api.post('/hotels/search', payload)
      setPage(res.data)
    } catch (err) {
      setError(err)
      setPage(null)
    } finally {
      setLoading(false)
    }
  }

  const submit = (e) => {
    e.preventDefault()
    runSearch(0)
  }

  return (
    <div>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-brass font-mono mb-3">Est. for the discerning traveller</p>
        <h1 className="font-display text-5xl md:text-6xl text-ivory leading-[1.05] max-w-2xl">
          Stay, <span className="italic text-brass-light">sorted.</span>
        </h1>
        <p className="text-muted mt-3 max-w-lg">
          Search live inventory across our partner properties, lock in a rate, and check in without the front-desk queue.
        </p>
      </section>

      {/* Search & Filter Form */}
      <section className="max-w-6xl mx-auto px-6">
        <form
          onSubmit={submit}
          className="bg-surface border border-brass/15 rounded-xl p-5 md:p-6 space-y-4"
        >
          {/* Main search bar row */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-muted">City</label>
              <input
                required
                list="city-options"
                placeholder="Mumbai, Goa, Jaipur…"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="mt-1 w-full bg-surface-raised border border-brass/10 rounded-md px-3 py-2 text-ivory focus:outline-none focus:border-brass text-sm"
              />
              <datalist id="city-options">
                {cities.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted">Check-in</label>
              <input
                type="date"
                required
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="mt-1 w-full bg-surface-raised border border-brass/10 rounded-md px-3 py-2 text-ivory focus:outline-none focus:border-brass font-mono text-sm"
              />
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest text-muted">Check-out</label>
              <input
                type="date"
                required
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="mt-1 w-full bg-surface-raised border border-brass/10 rounded-md px-3 py-2 text-ivory focus:outline-none focus:border-brass font-mono text-sm"
              />
            </div>

            <div className="flex gap-2.5 items-end">
              <div className="flex-1">
                <label className="text-[10px] uppercase tracking-widest text-muted">Rooms</label>
                <input
                  type="number"
                  min={1}
                  value={form.roomsCount}
                  onChange={(e) => setForm({ ...form, roomsCount: e.target.value })}
                  className="mt-1 w-full bg-surface-raised border border-brass/10 rounded-md px-3 py-2 text-ivory focus:outline-none focus:border-brass font-mono text-sm"
                />
              </div>
              <button
                type="submit"
                className="h-[38px] px-5 bg-brass text-ink font-medium rounded-md hover:bg-brass-light transition-colors text-sm"
              >
                Search
              </button>
            </div>
          </div>

          {/* Advanced filters: Price range, Sort by, Amenities */}
          <div className="pt-3 border-t border-brass/10 flex flex-wrap items-center justify-between gap-4 text-xs">
            {/* Price filters */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-muted font-mono">Price (₹):</span>
              <input
                type="number"
                min="0"
                placeholder="Min"
                value={form.minPrice}
                onChange={(e) => setForm({ ...form, minPrice: e.target.value })}
                className="w-20 bg-surface-raised border border-brass/10 rounded px-2 py-1 text-ivory font-mono focus:outline-none focus:border-brass"
              />
              <span className="text-muted">–</span>
              <input
                type="number"
                min="0"
                placeholder="Max"
                value={form.maxPrice}
                onChange={(e) => setForm({ ...form, maxPrice: e.target.value })}
                className="w-20 bg-surface-raised border border-brass/10 rounded px-2 py-1 text-ivory font-mono focus:outline-none focus:border-brass"
              />
            </div>

            {/* Sort by dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-muted font-mono">Sort By:</span>
              <select
                value={form.sortBy}
                onChange={(e) => setForm({ ...form, sortBy: e.target.value })}
                className="bg-surface-raised border border-brass/10 rounded px-2 py-1 text-ivory focus:outline-none focus:border-brass text-xs cursor-pointer"
              >
                <option value="PRICE_ASC">Price: Low to High</option>
                <option value="PRICE_DESC">Price: High to Low</option>
                <option value="RATING_DESC">Rating: High to Low</option>
                <option value="NAME_ASC">Name: A-Z</option>
              </select>
            </div>

            {/* Amenities Checkboxes */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[10px] uppercase tracking-wider text-muted font-mono">Amenities:</span>
              {COMMON_AMENITIES.map((amenity) => {
                const checked = form.amenities.includes(amenity)
                return (
                  <label
                    key={amenity}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border cursor-pointer select-none transition-colors ${
                      checked
                        ? 'border-brass bg-brass/10 text-brass-light'
                        : 'border-brass/15 text-muted hover:border-brass/30'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleAmenityToggle(amenity)}
                      className="sr-only"
                    />
                    <span>{amenity}</span>
                  </label>
                )
              })}
            </div>
          </div>
        </form>
      </section>

      {/* Results */}
      <section className="max-w-6xl mx-auto px-6 py-8">
        {error && <div className="mb-6"><ErrorBanner error={error} /></div>}
        {loading && <Spinner label="Checking availability" />}

        {!loading && searched && page && page.content?.length === 0 && (
          <EmptyState
            title="No properties found"
            subtitle="Try adjusting your filters, widening your date range, or removing selected amenities."
          />
        )}

        {!loading && page?.content?.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted uppercase tracking-widest font-mono">
                {page.totalElements} propert{page.totalElements === 1 ? 'y' : 'ies'} found
              </p>
              {page.totalPages > 1 && (
                <span className="text-xs text-muted font-mono">
                  Page {page.number + 1} of {page.totalPages}
                </span>
              )}
            </div>

            {page.content.map((hp) => (
              <HotelCard key={hp.hotel.id} hotelPriceDto={hp} searchParams={form} />
            ))}

            {/* Pagination Controls */}
            {page.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-6">
                <button
                  type="button"
                  disabled={page.number === 0}
                  onClick={() => runSearch(page.number - 1)}
                  className="px-3.5 py-1.5 text-xs font-mono rounded border border-brass/20 text-ivory hover:border-brass disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>

                <div className="flex gap-1.5">
                  {Array.from({ length: page.totalPages }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => runSearch(i)}
                      className={`h-7 w-7 rounded text-xs font-mono transition-colors ${
                        page.number === i
                          ? 'bg-brass text-ink font-semibold'
                          : 'text-muted border border-brass/15 hover:border-brass/40'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={page.number >= page.totalPages - 1}
                  onClick={() => runSearch(page.number + 1)}
                  className="px-3.5 py-1.5 text-xs font-mono rounded border border-brass/20 text-ivory hover:border-brass disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        )}

        {!searched && (
          <EmptyState
            title="Your search starts here"
            subtitle="Pick a city and your dates above to see live prices and availability."
          />
        )}
      </section>
    </div>
  )
}
