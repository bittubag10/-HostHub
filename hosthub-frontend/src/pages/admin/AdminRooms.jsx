import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../../api/axios'
import Spinner from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'
import ErrorBanner from '../../components/ErrorBanner'

export default function AdminRooms() {
  const { hotelId } = useParams()
  const [rooms, setRooms] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const load = () => {
    setLoading(true)
    api.get(`/admin/hotels/${hotelId}/rooms`).then((res) => setRooms(res.data)).catch(setError).finally(() => setLoading(false))
  }
  useEffect(load, [hotelId])

  const remove = async (roomId) => {
    if (!confirm('Delete this room type?')) return
    setBusyId(roomId)
    try {
      await api.delete(`/admin/hotels/${hotelId}/rooms/${roomId}`)
      load()
    } catch (err) {
      setError(err)
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <Spinner label="Loading rooms" />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl text-ivory">Rooms</h1>
        <Link to={`/admin/hotels/${hotelId}/rooms/new`} className="bg-brass text-ink font-medium px-4 py-2 rounded-md text-sm hover:bg-brass-light">
          Add room type
        </Link>
      </div>
      {error && <div className="mb-5"><ErrorBanner error={error} /></div>}

      {rooms?.length === 0 && <EmptyState title="No rooms yet" subtitle="Add a room type to open this property for bookings." />}

      <div className="space-y-3">
        {rooms?.map((r) => (
          <div key={r.id} className="bg-surface border border-brass/10 rounded-lg p-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg text-ivory">{r.type}</h3>
              <p className="text-sm text-muted font-mono">₹{Number(r.basePrice).toLocaleString('en-IN')} · sleeps {r.capacity} · {r.totalCount} rooms</p>
            </div>
            <div className="flex gap-4 text-sm">
              <Link to={`/admin/inventory/${r.id}`} className="text-brass-light hover:underline">Inventory</Link>
              <Link to={`/admin/hotels/${hotelId}/rooms/${r.id}/edit`} className="text-muted hover:text-ivory">Edit</Link>
              <button disabled={busyId === r.id} onClick={() => remove(r.id)} className="text-danger hover:underline disabled:opacity-50">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
