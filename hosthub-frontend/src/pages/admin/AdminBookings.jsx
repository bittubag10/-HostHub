import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import KeyCard from '../../components/KeyCard'
import Spinner from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'
import ErrorBanner from '../../components/ErrorBanner'
import { Calendar, ArrowLeft } from 'lucide-react'

export default function AdminBookings() {
  const { hotelId } = useParams()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    api
      .get(`/admin/hotels/${hotelId}/bookings`)
      .then((res) => setBookings(res.data))
      .catch(setError)
      .finally(() => setLoading(false))
  }, [hotelId])

  if (loading) return <Spinner label="Loading property reservations" />

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="p-2 rounded-xl border border-zinc-200 bg-white hover:bg-stone-50 text-zinc-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-900">
            Property Reservations
          </h1>
          <p className="text-xs text-zinc-500">
            All guest reservations, active holds, and completed stays.
          </p>
        </div>
      </div>

      {error && <ErrorBanner error={error} />}

      {bookings?.length === 0 && (
        <EmptyState
          title="No bookings recorded yet"
          subtitle="Guest reservations for this boutique hotel will display here in real time."
        />
      )}

      <div className="space-y-4">
        {bookings?.map((b) => (
          <KeyCard key={b.id} booking={b} />
        ))}
      </div>
    </div>
  )
}
