import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import Spinner from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'
import ErrorBanner from '../../components/ErrorBanner'
import { getPhotoUrl } from '../../util/imageUrl'
import {
  Bed,
  Plus,
  ArrowLeft,
  Calendar,
  Edit,
  Trash2,
  Users,
  Layers
} from 'lucide-react'

export default function AdminRooms() {
  const { hotelId } = useParams()
  const navigate = useNavigate()
  const [rooms, setRooms] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const load = () => {
    setLoading(true)
    api
      .get(`/admin/hotels/${hotelId}/rooms`)
      .then((res) => setRooms(res.data))
      .catch(setError)
      .finally(() => setLoading(false))
  }
  useEffect(load, [hotelId])

  const remove = async (roomId) => {
    if (!confirm('Are you sure you want to delete this room type? This will also remove associated inventory.')) return
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

  if (loading) return <Spinner label="Loading suite & room configurations" />

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
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
              Rooms & Suite Types
            </h1>
            <p className="text-xs text-zinc-500">
              Configure suite categories, capacities, and base rates.
            </p>
          </div>
        </div>

        <Link
          to={`/admin/hotels/${hotelId}/rooms/new`}
          className="btn-primary text-xs px-4 py-2.5 rounded-xl"
        >
          <Plus className="w-4 h-4" />
          <span>Add Room Type</span>
        </Link>
      </div>

      {error && <ErrorBanner error={error} />}

      {rooms?.length === 0 && (
        <EmptyState
          title="No room types configured"
          subtitle="Add your first room category (e.g. Deluxe Suite) to enable bookings."
          action={
            <Link
              to={`/admin/hotels/${hotelId}/rooms/new`}
              className="btn-primary text-xs px-5 py-2.5 rounded-xl"
            >
              Add Room Type
            </Link>
          }
        />
      )}

      <div className="space-y-3">
        {rooms?.map((r) => {
          const roomPhoto = r.photo?.[0] || r.photos?.[0]
          return (
            <div
              key={r.id}
              className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-card hover:border-zinc-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-zinc-200">
                  {roomPhoto ? (
                    <img src={getPhotoUrl(roomPhoto)} alt={r.type} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-400">
                      <Bed className="w-6 h-6" />
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-display text-lg font-bold text-zinc-900">
                    {r.type}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 font-mono mt-0.5">
                    <span className="font-bold text-zinc-800">₹{Number(r.basePrice).toLocaleString('en-IN')} / night</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-brand" />
                      Sleeps {r.capacity}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3 text-brand" />
                      {r.totalCount} rooms total
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 text-xs w-full sm:w-auto justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
                <Link
                  to={`/admin/inventory/${r.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 text-zinc-700 hover:text-zinc-900 font-medium border border-zinc-200/80 transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5 text-brand" />
                  Inventory & Surge
                </Link>

                <Link
                  to={`/admin/hotels/${hotelId}/rooms/${r.id}/edit`}
                  className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-stone-100 transition-colors"
                  title="Edit room"
                >
                  <Edit className="w-4 h-4" />
                </Link>

                <button
                  disabled={busyId === r.id}
                  onClick={() => remove(r.id)}
                  className="p-2 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Delete room"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
