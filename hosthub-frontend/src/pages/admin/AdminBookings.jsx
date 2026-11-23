import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../api/axios'
import KeyCard from '../../components/KeyCard'
import Spinner from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'
import ErrorBanner from '../../components/ErrorBanner'

export default function AdminBookings() {
  const { hotelId } = useParams()
  const [bookings, setBookings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    api.get(`/admin/hotels/${hotelId}/bookings`).then((res) => setBookings(res.data)).catch(setError).finally(() => setLoading(false))
  }, [hotelId])

  if (loading) return <Spinner label="Loading bookings" />

  return (
    <div>
      <h1 className="font-display text-3xl text-ivory mb-6">Bookings</h1>
      {error && <div className="mb-5"><ErrorBanner error={error} /></div>}
      {bookings?.length === 0 && <EmptyState title="No bookings yet" subtitle="Bookings for this property will appear here." />}
      <div className="space-y-5">
        {bookings?.map((b) => <KeyCard key={b.id} booking={b} />)}
      </div>
    </div>
  )
}
