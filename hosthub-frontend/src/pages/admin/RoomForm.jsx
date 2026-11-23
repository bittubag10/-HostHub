import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api/axios'
import Spinner from '../../components/Spinner'
import ErrorBanner from '../../components/ErrorBanner'

const emptyForm = { type: '', basePrice: '', photoText: '', amenitiesText: '', totalCount: 1, capacity: 2 }

export default function RoomForm() {
  const { hotelId, roomId } = useParams()
  const isEdit = !!roomId
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isEdit) return
    api.get(`/admin/hotels/${hotelId}/rooms/${roomId}`).then((res) => {
      const r = res.data
      setForm({
        type: r.type,
        basePrice: r.basePrice,
        photoText: (r.photo || []).join(', '),
        amenitiesText: (r.amenities || []).join(', '),
        totalCount: r.totalCount,
        capacity: r.capacity,
      })
    }).catch(setError).finally(() => setLoading(false))
  }, [hotelId, roomId])

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const payload = {
      type: form.type,
      basePrice: Number(form.basePrice),
      photo: form.photoText.split(',').map((s) => s.trim()).filter(Boolean),
      amenities: form.amenitiesText.split(',').map((s) => s.trim()).filter(Boolean),
      totalCount: Number(form.totalCount),
      capacity: Number(form.capacity),
    }
    try {
      if (isEdit) {
        await api.put(`/admin/hotels/${hotelId}/rooms/${roomId}`, payload)
      } else {
        await api.post(`/admin/hotels/${hotelId}/rooms`, payload)
      }
      navigate(`/admin/hotels/${hotelId}/rooms`)
    } catch (err) {
      setError(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner label="Loading room" />

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl text-ivory mb-6">{isEdit ? 'Edit room type' : 'Add room type'}</h1>
      <form onSubmit={submit} className="space-y-4">
        {error && <ErrorBanner error={error} />}
        <div>
          <label className="text-[10px] uppercase tracking-widest text-muted">Room type name</label>
          <input required value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input mt-1" placeholder="Deluxe, Suite…" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted">Base price / night</label>
            <input required type="number" step="0.01" min="0.01" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} className="input mt-1" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-muted">Capacity (guests)</label>
            <input required type="number" min={1} max={10} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="input mt-1" />
          </div>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-muted">Total rooms of this type</label>
          <input required type="number" min={1} value={form.totalCount} onChange={(e) => setForm({ ...form, totalCount: e.target.value })} className="input mt-1" />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-muted">Photo URLs (comma separated)</label>
          <input value={form.photoText} onChange={(e) => setForm({ ...form, photoText: e.target.value })} className="input mt-1" />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-muted">Amenities (comma separated)</label>
          <input value={form.amenitiesText} onChange={(e) => setForm({ ...form, amenitiesText: e.target.value })} className="input mt-1" />
        </div>
        <button disabled={saving} className="bg-brass text-ink font-medium px-6 py-2.5 rounded-md hover:bg-brass-light disabled:opacity-50">
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add room'}
        </button>
      </form>
    </div>
  )
}
