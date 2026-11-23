import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api/axios'
import Spinner from '../../components/Spinner'
import ErrorBanner from '../../components/ErrorBanner'
import { getPhotoUrl } from '../../util/imageUrl'

const emptyForm = { type: '', basePrice: '', photoText: '', amenitiesText: '', totalCount: 1, capacity: 2 }

export default function RoomForm() {
  const { hotelId, roomId } = useParams()
  const isEdit = !!roomId
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isEdit) return
    api.get(`/admin/hotels/${hotelId}/rooms/${roomId}`).then((res) => {
      const r = res.data
      const currentPhotos = r.photo || r.photos || []
      setPhotos(currentPhotos)
      setForm({
        type: r.type,
        basePrice: r.basePrice,
        photoText: currentPhotos.join(', '),
        amenitiesText: (r.amenities || []).join(', '),
        totalCount: r.totalCount,
        capacity: r.capacity,
      })
    }).catch(setError).finally(() => setLoading(false))
  }, [hotelId, roomId])

  const handleFileUpload = async (e) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const formData = new FormData()
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i])
    }
    setUploading(true)
    setError(null)
    try {
      const res = await api.post(`/admin/hotels/${hotelId}/rooms/${roomId}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const updatedPhotos = res.data.photo || res.data.photos || []
      setPhotos(updatedPhotos)
      setForm((prev) => ({ ...prev, photoText: updatedPhotos.join(', ') }))
    } catch (err) {
      setError(err)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleDeletePhoto = async (photoUrl) => {
    setUploading(true)
    setError(null)
    try {
      const res = await api.delete(`/admin/hotels/${hotelId}/rooms/${roomId}/photos`, {
        params: { photoUrl },
      })
      const updatedPhotos = res.data.photo || res.data.photos || []
      setPhotos(updatedPhotos)
      setForm((prev) => ({ ...prev, photoText: updatedPhotos.join(', ') }))
    } catch (err) {
      setError(err)
    } finally {
      setUploading(false)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const manualUrls = form.photoText.split(',').map((s) => s.trim()).filter(Boolean)
    const combinedPhotos = Array.from(new Set([...photos, ...manualUrls]))
    const payload = {
      type: form.type,
      basePrice: Number(form.basePrice),
      photo: combinedPhotos,
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

        {/* Real photo management section for rooms */}
        <div>
          <label className="text-[10px] uppercase tracking-widest text-muted">Photos</label>
          {isEdit ? (
            <div className="mt-2 space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="block w-full text-xs text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-surface-raised file:text-brass-light hover:file:bg-surface cursor-pointer"
                />
                {uploading && <span className="text-xs text-brass-light animate-pulse">Uploading…</span>}
              </div>

              {photos.length > 0 && (
                <div className="grid grid-cols-4 gap-2.5 pt-1">
                  {photos.map((p, idx) => (
                    <div key={idx} className="relative group w-full h-20 rounded bg-surface-raised overflow-hidden border border-brass/15">
                      <img src={getPhotoUrl(p)} alt={`room-${idx}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(p)}
                        disabled={uploading}
                        className="absolute top-1 right-1 bg-ink/80 text-rose-400 hover:text-rose-200 text-xs rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete photo"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted mt-1">Save this room type first, then upload local photo files here.</p>
          )}

          <div className="mt-3">
            <span className="text-[10px] uppercase tracking-wider text-muted">Or enter Photo URLs (comma separated)</span>
            <input value={form.photoText} onChange={(e) => setForm({ ...form, photoText: e.target.value })} className="input mt-1" placeholder="https://..., /uploads/..." />
          </div>
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
