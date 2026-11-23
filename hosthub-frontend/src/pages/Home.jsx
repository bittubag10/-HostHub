import { useEffect, useState } from 'react'
import api from '../api/axios'
import HotelCard from '../components/HotelCard'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import ErrorBanner from '../components/ErrorBanner'
import {
  Search,
  MapPin,
  Calendar,
  Users,
  SlidersHorizontal,
  ArrowUpDown,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Wifi,
  Waves,
  Car,
  Coffee,
  Wind
} from 'lucide-react'

const todayStr = () => new Date().toISOString().split('T')[0]
const tomorrowStr = () => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

const AMENITY_CONFIG = [
  { name: 'WiFi', icon: Wifi },
  { name: 'Pool', icon: Waves },
  { name: 'AC', icon: Wind },
  { name: 'Parking', icon: Car },
  { name: 'Breakfast', icon: Coffee },
]

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
  const [showFilters, setShowFilters] = useState(true)

  // Fetch active cities on mount for suggestions
  useEffect(() => {
    api
      .get('/hotels/cities')
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
    <div className="space-y-12 pb-16">
      {/* Editorial Hero Section */}
      <section className="relative pt-16 pb-12 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_25rem_at_top,theme(colors.teal.100),transparent)] opacity-60" />

        <div className="max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200/60 text-brand text-xs font-semibold tracking-wide uppercase font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            Curated Independent Boutique Stays
          </div>

          <h1 className="font-display text-4xl sm:text-6xl font-extrabold text-zinc-900 tracking-tight leading-[1.1]">
            Find your sanctuary,{' '}
            <span className="text-brand italic font-serif">stay inspired.</span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-600 max-w-2xl mx-auto font-normal">
            Direct reservation into verified boutique properties with live inventory locking and zero hidden fees.
          </p>
        </div>

        {/* Floating Search Pill Bar */}
        <div className="max-w-5xl mx-auto mt-10">
          <form
            onSubmit={submit}
            className="bg-white rounded-3xl sm:rounded-full p-2.5 sm:p-2 border border-zinc-200 shadow-floating flex flex-col sm:flex-row items-stretch sm:items-center gap-2 transition-all hover:border-zinc-300"
          >
            {/* City Segment */}
            <div className="flex-1 flex items-center gap-3 px-4 py-2 hover:bg-stone-50 rounded-full transition-colors text-left">
              <MapPin className="w-5 h-5 text-brand shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500 font-mono">
                  Destination
                </label>
                <input
                  required
                  list="city-options"
                  placeholder="Where to? (e.g. Goa, Mumbai)"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full bg-transparent text-sm font-medium text-zinc-900 placeholder-zinc-400 focus:outline-none truncate"
                />
                <datalist id="city-options">
                  {cities.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="hidden sm:block w-px h-8 bg-zinc-200" />

            {/* Check-In Segment */}
            <div className="flex-1 flex items-center gap-3 px-4 py-2 hover:bg-stone-50 rounded-full transition-colors text-left">
              <Calendar className="w-5 h-5 text-brand shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500 font-mono">
                  Check-In
                </label>
                <input
                  type="date"
                  required
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full bg-transparent text-sm font-medium text-zinc-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="hidden sm:block w-px h-8 bg-zinc-200" />

            {/* Check-Out Segment */}
            <div className="flex-1 flex items-center gap-3 px-4 py-2 hover:bg-stone-50 rounded-full transition-colors text-left">
              <Calendar className="w-5 h-5 text-brand shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500 font-mono">
                  Check-Out
                </label>
                <input
                  type="date"
                  required
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full bg-transparent text-sm font-medium text-zinc-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="hidden sm:block w-px h-8 bg-zinc-200" />

            {/* Rooms Segment */}
            <div className="w-32 flex items-center gap-2.5 px-4 py-2 hover:bg-stone-50 rounded-full transition-colors text-left">
              <Users className="w-5 h-5 text-brand shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="block text-[10px] uppercase font-bold tracking-wider text-zinc-500 font-mono">
                  Rooms
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={form.roomsCount}
                  onChange={(e) => setForm({ ...form, roomsCount: e.target.value })}
                  className="w-full bg-transparent text-sm font-medium text-zinc-900 focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Search Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="bg-brand text-white px-7 py-3.5 rounded-full font-semibold text-sm hover:bg-brand-800 transition-all shadow-md shadow-brand/25 flex items-center justify-center gap-2 shrink-0 active:scale-95"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </button>
          </form>
        </div>
      </section>

      {/* Horizontal Filter Bar */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
          {/* Amenity Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs uppercase font-bold text-zinc-400 font-mono tracking-wider mr-1">
              Amenities:
            </span>
            {AMENITY_CONFIG.map(({ name, icon: Icon }) => {
              const checked = form.amenities.includes(name)
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleAmenityToggle(name)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    checked
                      ? 'bg-brand text-white border-brand shadow-sm shadow-brand/20'
                      : 'bg-stone-50 text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:text-zinc-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {name}
                </button>
              )
            })}
          </div>

          {/* Price Range & Sorting */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Price Inputs */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-600">
              <span className="text-[10px] uppercase font-bold text-zinc-400 font-mono tracking-wider">
                Price (₹):
              </span>
              <input
                type="number"
                min="0"
                placeholder="Min"
                value={form.minPrice}
                onChange={(e) => setForm({ ...form, minPrice: e.target.value })}
                className="w-20 bg-stone-50 border border-zinc-200 rounded-lg px-2.5 py-1 text-xs font-mono text-zinc-800 focus:outline-none focus:border-brand"
              />
              <span className="text-zinc-400">–</span>
              <input
                type="number"
                min="0"
                placeholder="Max"
                value={form.maxPrice}
                onChange={(e) => setForm({ ...form, maxPrice: e.target.value })}
                className="w-20 bg-stone-50 border border-zinc-200 rounded-lg px-2.5 py-1 text-xs font-mono text-zinc-800 focus:outline-none focus:border-brand"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
              <select
                value={form.sortBy}
                onChange={(e) => setForm({ ...form, sortBy: e.target.value })}
                className="bg-stone-50 border border-zinc-200 rounded-lg px-2.5 py-1 text-xs font-medium text-zinc-700 focus:outline-none focus:border-brand cursor-pointer"
              >
                <option value="PRICE_ASC">Price: Low to High</option>
                <option value="PRICE_DESC">Price: High to Low</option>
                <option value="RATING_DESC">Rating: High to Low</option>
                <option value="NAME_ASC">Name: A-Z</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="max-w-7xl mx-auto px-6">
        {error && (
          <div className="mb-6">
            <ErrorBanner error={error} />
          </div>
        )}

        {loading && <Spinner label="Checking real-time boutique availability" />}

        {!loading && searched && page && page.content?.length === 0 && (
          <EmptyState
            title="No boutique stays available"
            subtitle={`We couldn't find available rooms matching your dates in ${form.city || 'this area'}. Try adjusting dates or filters.`}
          />
        )}

        {!loading && page && page.content?.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold text-zinc-900">
                Stays in {form.city || 'All Destinations'}{' '}
                <span className="text-sm font-normal text-zinc-500 font-mono">
                  ({page.totalElements} properties found)
                </span>
              </h2>
            </div>

            {/* Grid of Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {page.content.map((dto) => (
                <HotelCard
                  key={dto.hotel.id}
                  hotelPriceDto={dto}
                  searchParams={{
                    city: form.city,
                    startDate: form.startDate,
                    endDate: form.endDate,
                    roomsCount: form.roomsCount,
                  }}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {page.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-8 text-sm">
                <button
                  onClick={() => runSearch(page.number - 1)}
                  disabled={page.first}
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <span className="text-zinc-500 text-xs font-mono">
                  Page {page.number + 1} of {page.totalPages}
                </span>
                <button
                  onClick={() => runSearch(page.number + 1)}
                  disabled={page.last}
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Featured Showcase on Initial Load */}
        {!searched && !loading && (
          <div className="text-center py-12 border-t border-zinc-200 mt-12">
            <h3 className="font-display text-xl font-bold text-zinc-800">
              Begin your boutique journey
            </h3>
            <p className="text-sm text-zinc-500 max-w-md mx-auto mt-1">
              Select your destination and dates above to inspect authentic room photos, verified guest reviews, and direct rates.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
