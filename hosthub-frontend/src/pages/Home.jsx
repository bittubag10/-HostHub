import { useState } from 'react'
import api from '../api/axios'
import HotelCard from '../components/HotelCard'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import ErrorBanner from '../components/ErrorBanner'

const todayStr = () => new Date().toISOString().split('T')[0]

export default function Home() {
  const [form, setForm] = useState({
    city: '',
    startDate: todayStr(),
    endDate: '',
    roomsCount: 1,
  })
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searched, setSearched] = useState(false)

  const runSearch = async (pageNumber = 0) => {
    setError(null)
    setLoading(true)
    setSearched(true)
    try {
      const payload = {
        city: form.city,
        startDate: form.startDate,
        endDate: form.endDate,
        roomsCount: Number(form.roomsCount),
        page: pageNumber,
        size: 8,
      }
      const res = await api.get('/hotels/search', { data: payload })
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
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-10">
        <p className="text-xs uppercase tracking-[0.3em] text-brass font-mono mb-3">Est. for the discerning traveller</p>
        <h1 className="font-display text-5xl md:text-6xl text-ivory leading-[1.05] max-w-2xl">
          Stay, <span className="italic text-brass-light">sorted.</span>
        </h1>
        <p className="text-muted mt-4 max-w-lg">
          Search live inventory across our partner properties, lock in a rate, and check in without the front-desk queue.
        </p>
      </section>

      {/* Search form styled like a ticket counter */}
      <section className="max-w-6xl mx-auto px-6">
        <form
          onSubmit={submit}
          className="bg-surface border border-brass/15 rounded-xl p-5 md:p-6 grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
        >
          <div className="md:col-span-2">
            <label className="text-[10px] uppercase tracking-widest text-muted">City</label>
            <input
              required
              placeholder="Mumbai, Goa, Jaipur…"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="mt-1 w-full bg-surface-raised border border-brass/10 rounded-md px-3 py-2.5 text-ivory focus:outline-none focus:border-brass"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted">Check-in</label>
            <input
              type="date"
              required
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="mt-1 w-full bg-surface-raised border border-brass/10 rounded-md px-3 py-2.5 text-ivory focus:outline-none focus:border-brass font-mono text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted">Check-out</label>
            <input
              type="date"
              required
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className="mt-1 w-full bg-surface-raised border border-brass/10 rounded-md px-3 py-2.5 text-ivory focus:outline-none focus:border-brass font-mono text-sm"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] uppercase tracking-widest text-muted">Rooms</label>
              <input
                type="number"
                min={1}
                value={form.roomsCount}
                onChange={(e) => setForm({ ...form, roomsCount: e.target.value })}
                className="mt-1 w-full bg-surface-raised border border-brass/10 rounded-md px-3 py-2.5 text-ivory focus:outline-none focus:border-brass font-mono text-sm"
              />
            </div>
            <button className="self-end h-[42px] px-5 bg-brass text-ink font-medium rounded-md hover:bg-brass-light transition-colors">
              Search
            </button>
          </div>
        </form>
      </section>

      {/* Results */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        {error && <div className="mb-6"><ErrorBanner error={error} /></div>}
        {loading && <Spinner label="Checking availability" />}

        {!loading && searched && page && page.content?.length === 0 && (
          <EmptyState title="No rooms for those dates" subtitle="Try a different city or widen your date range." />
        )}

        {!loading && page?.content?.length > 0 && (
          <div className="space-y-4">
            <p className="text-xs text-muted uppercase tracking-widest font-mono">
              {page.totalElements} propert{page.totalElements === 1 ? 'y' : 'ies'} found
            </p>
            {page.content.map((hp) => (
              <HotelCard key={hp.hotel.id} hotelPriceDto={hp} searchParams={form} />
            ))}

            {page.totalPages > 1 && (
              <div className="flex gap-2 justify-center pt-4">
                {Array.from({ length: page.totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => runSearch(i)}
                    className={`h-8 w-8 rounded-full text-xs font-mono ${
                      page.number === i ? 'bg-brass text-ink' : 'text-muted border border-brass/15 hover:border-brass/40'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
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
