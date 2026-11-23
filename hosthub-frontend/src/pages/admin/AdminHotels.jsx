import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import Spinner from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'
import ErrorBanner from '../../components/ErrorBanner'

export default function AdminHotels() {
  const [hotels, setHotels] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const load = () => {
    setLoading(true)
    api.get('/admin/hotels').then((res) => setHotels(res.data)).catch(setError).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const activate = async (id) => {
    setBusyId(id)
    try {
      await api.patch(`/admin/hotels/${id}/activate`)
      load()
    } catch (err) {
      setError(err)
    } finally {
      setBusyId(null)
    }
  }

  const remove = async (id) => {
    if (!confirm('Delete this property? This cannot be undone.')) return
    setBusyId(id)
    try {
      await api.delete(`/admin/hotels/${id}`)
      load()
    } catch (err) {
      setError(err)
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <Spinner label="Loading properties" />

  return (
    <div>
      <h1 className="font-display text-3xl text-ivory mb-6">Your properties</h1>
      {error && <div className="mb-5"><ErrorBanner error={error} /></div>}

      {hotels?.length === 0 && (
        <EmptyState
          title="No properties yet"
          subtitle="Add your first property to start accepting bookings."
          action={<Link to="/admin/hotels/new" className="bg-brass text-ink font-medium px-5 py-2 rounded-md">Add property</Link>}
        />
      )}

      <div className="space-y-3">
        {hotels?.map((h) => (
          <div key={h.id} className="bg-surface border border-brass/10 rounded-lg p-4 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg text-ivory">{h.name}</h3>
                <span className={`text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-full border ${
                  h.active ? 'border-success/40 text-success' : 'border-danger/40 text-danger'
                }`}>
                  {h.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-sm text-muted">{h.city}</p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link to={`/admin/hotels/${h.id}/rooms`} className="text-brass-light hover:underline">Rooms</Link>
              <Link to={`/admin/hotels/${h.id}/bookings`} className="text-brass-light hover:underline">Bookings</Link>
              <Link to={`/admin/hotels/${h.id}/reports`} className="text-brass-light hover:underline">Reports</Link>
              <Link to={`/admin/hotels/${h.id}/edit`} className="text-muted hover:text-ivory">Edit</Link>
              {!h.active && (
                <button disabled={busyId === h.id} onClick={() => activate(h.id)} className="text-success hover:underline disabled:opacity-50">
                  Activate
                </button>
              )}
              <button disabled={busyId === h.id} onClick={() => remove(h.id)} className="text-danger hover:underline disabled:opacity-50">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
