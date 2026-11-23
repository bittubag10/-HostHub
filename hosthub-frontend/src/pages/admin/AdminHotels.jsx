import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/axios'
import Spinner from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'
import ErrorBanner from '../../components/ErrorBanner'
import { getPhotoUrl } from '../../util/imageUrl'
import {
  Building2,
  Plus,
  Bed,
  Calendar,
  BarChart3,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Sparkles
} from 'lucide-react'

export default function AdminHotels() {
  const [hotels, setHotels] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)

  const load = () => {
    setLoading(true)
    api
      .get('/admin/hotels')
      .then((res) => setHotels(res.data))
      .catch(setError)
      .finally(() => setLoading(false))
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
    if (!confirm('Are you sure you want to delete this property? This action is permanent.')) return
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

  if (loading) return <Spinner label="Loading your boutique properties" />

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-zinc-900 tracking-tight">
            Properties Portfolio
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage your boutique hotels, suites, and direct rates.
          </p>
        </div>

        <Link to="/admin/hotels/new" className="btn-primary text-xs px-4 py-2.5 rounded-xl">
          <Plus className="w-4 h-4" />
          <span>Add Property</span>
        </Link>
      </div>

      {error && <ErrorBanner error={error} />}

      {hotels?.length === 0 && (
        <EmptyState
          title="No properties listed yet"
          subtitle="Add your first boutique hotel to initialize inventory and start receiving bookings."
          action={
            <Link to="/admin/hotels/new" className="btn-primary text-xs px-5 py-2.5 rounded-xl">
              Add New Property
            </Link>
          }
        />
      )}

      <div className="space-y-4">
        {hotels?.map((h) => {
          const rawPhoto = h.photo?.[0] || h.photos?.[0]
          const photo = getPhotoUrl(rawPhoto)

          return (
            <div
              key={h.id}
              className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm hover:shadow-card hover:border-zinc-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-zinc-200">
                  {photo ? (
                    <img src={photo} alt={h.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-400">
                      <Building2 className="w-6 h-6" />
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-display text-lg font-bold text-zinc-900">
                      {h.name}
                    </h3>
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider font-mono px-2 py-0.5 rounded-full border ${
                        h.active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {h.active ? 'Active' : 'Draft / Inactive'}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-brand" />
                    {h.city} {h.contactInfo?.address && `· ${h.contactInfo.address}`}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 text-xs w-full sm:w-auto justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
                <Link
                  to={`/admin/hotels/${h.id}/rooms`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 text-zinc-700 hover:text-zinc-900 font-medium border border-zinc-200/80 transition-colors"
                >
                  <Bed className="w-3.5 h-3.5 text-brand" />
                  Rooms
                </Link>

                <Link
                  to={`/admin/hotels/${h.id}/bookings`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 text-zinc-700 hover:text-zinc-900 font-medium border border-zinc-200/80 transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5 text-brand" />
                  Bookings
                </Link>

                <Link
                  to={`/admin/hotels/${h.id}/reports`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 text-zinc-700 hover:text-zinc-900 font-medium border border-zinc-200/80 transition-colors"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-brand" />
                  Reports
                </Link>

                <Link
                  to={`/admin/hotels/${h.id}/edit`}
                  className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-stone-100 transition-colors"
                  title="Edit details"
                >
                  <Edit className="w-4 h-4" />
                </Link>

                {!h.active && (
                  <button
                    disabled={busyId === h.id}
                    onClick={() => activate(h.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand text-white font-medium hover:bg-brand-800 transition-colors disabled:opacity-50"
                  >
                    Activate
                  </button>
                )}

                <button
                  disabled={busyId === h.id}
                  onClick={() => remove(h.id)}
                  className="p-2 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Delete hotel"
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
