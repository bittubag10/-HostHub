import { useEffect, useState } from 'react'
import api from '../api/axios'
import KeyCard from '../components/KeyCard'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import ErrorBanner from '../components/ErrorBanner'
import { Link } from 'react-router-dom'

const CANCELLABLE = ['RESERVED', 'GUESTS_ADDED', 'PAYMENT_PENDING']

export default function MyBookings() {
  const [bookings, setBookings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const load = () => {
    setLoading(true)
    api
      .get('/users/myBookings')
      .then((res) => setBookings(res.data))
      .catch(setError)
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const cancel = async (id) => {
    setBusyId(id)
    try {
      await api.post(`/bookings/${id}/cancel`)
      load()
    } catch (err) {
      setError(err)
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <Spinner label="Fetching your stays" />

  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <h1 className="font-display text-3xl text-ivory mb-8">My Bookings</h1>
      {error && <div className="mb-5"><ErrorBanner error={error} /></div>}

      {bookings?.length === 0 && (
        <EmptyState
          title="No bookings yet"
          subtitle="Once you book a stay, your confirmation ticket shows up here."
          action={
            <Link to="/" className="bg-brass text-ink font-medium px-5 py-2 rounded-md">
              Find a place to stay
            </Link>
          }
        />
      )}

      <div className="space-y-5">
        {bookings?.map((b) => (
          <KeyCard key={b.id} booking={b}>
            <div className="flex gap-3">
              {CANCELLABLE.includes(b.bookingStatus) && (
                <button
                  onClick={() => cancel(b.id)}
                  disabled={busyId === b.id}
                  className="text-danger text-xs hover:underline disabled:opacity-50"
                >
                  {busyId === b.id ? 'Cancelling…' : 'Cancel booking'}
                </button>
              )}
              {['RESERVED', 'GUESTS_ADDED'].includes(b.bookingStatus) && (
                <Link to={`/bookings/${b.id}/guests`} className="text-brass-light text-xs hover:underline">
                  Continue booking
                </Link>
              )}
            </div>
          </KeyCard>
        ))}
      </div>
    </div>
  )
}
