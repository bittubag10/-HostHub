import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api/axios'
import Spinner from '../../components/Spinner'
import ErrorBanner from '../../components/ErrorBanner'
import { getPhotoUrl } from '../../util/imageUrl'
import {
  UploadCloud,
  Trash2,
  Bed,
  ArrowLeft,
  Sparkles,
  Users,
  Layers,
  IndianRupee
} from 'lucide-react'

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
    api
      .get(`/admin/hotels/${hotelId}/rooms/${roomId}`)
      .then((res) => {
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
      })
      .catch(setError)
      .finally(() => setLoading(false))
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

  if (loading) return <Spinner label="Loading room details" />

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(`/admin/hotels/${hotelId}/rooms`)}
          className="p-2 rounded-xl border border-zinc-200 bg-white hover:bg-stone-50 text-zinc-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-900">
            {isEdit ? 'Edit Room / Suite Category' : 'Add New Room Category'}
          </h1>
          <p className="text-xs text-zinc-500">
            Set capacity limits, baseline nightly rates, and upload room interior photos.
          </p>
        </div>
      </div>

      {error && <ErrorBanner error={error} />}

      <form onSubmit={submit} className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 text-xs">
        {/* Room Specifications */}
        <div className="space-y-4">
          <h3 className="font-display text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-2 flex items-center gap-2">
            <Bed className="w-4 h-4 text-brand" />
            Suite Configuration
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">
                Room / Suite Title
              </label>
              <input
                required
                placeholder="e.g. Deluxe Ocean View Suite"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="input text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">
                Base Nightly Price (INR ₹)
              </label>
              <input
                type="number"
                min="0"
                step="50"
                required
                placeholder="e.g. 4500"
                value={form.basePrice}
                onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                className="input text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">
                Guest Capacity (Sleeps)
              </label>
              <input
                type="number"
                min={1}
                required
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                className="input text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">
                Total Units of This Category
              </label>
              <input
                type="number"
                min={1}
                required
                value={form.totalCount}
                onChange={(e) => setForm({ ...form, totalCount: e.target.value })}
                className="input text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">
              Room Amenities (Comma-Separated)
            </label>
            <input
              placeholder="King Bed, Balcony, Sea View, Mini Bar, Bathtub"
              value={form.amenitiesText}
              onChange={(e) => setForm({ ...form, amenitiesText: e.target.value })}
              className="input text-xs"
            />
          </div>
        </div>

        {/* Room Photo Upload Dropzone */}
        <div className="space-y-4 pt-2">
          <h3 className="font-display text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand" />
            Room Photos
          </h3>

          {isEdit ? (
            <div className="space-y-3">
              <label className="border-2 border-dashed border-zinc-200 hover:border-brand rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer bg-stone-50/50 hover:bg-brand-50/30 transition-all text-center">
                <UploadCloud className="w-8 h-8 text-brand" />
                <div>
                  <span className="font-semibold text-zinc-800 text-xs">Click to upload suite photos</span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">JPEG, PNG, WebP up to 5MB</p>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>

              {uploading && <p className="text-xs text-brand font-mono">Uploading room images…</p>}

              {photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {photos.map((url, idx) => (
                    <div
                      key={idx}
                      className="group relative aspect-video rounded-xl overflow-hidden bg-stone-100 border border-zinc-200 shadow-sm"
                    >
                      <img src={getPhotoUrl(url)} alt={`Room ${idx}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(url)}
                        className="absolute top-1.5 right-1.5 p-1 rounded-md bg-white/90 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100 shadow-sm"
                        title="Delete photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-[11px] text-zinc-400 italic mb-2">
                * High-resolution image uploading is enabled right after saving the room category.
              </p>
              <input
                placeholder="Initial Photo URLs (comma-separated, optional)"
                value={form.photoText}
                onChange={(e) => setForm({ ...form, photoText: e.target.value })}
                className="input text-xs"
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-6 border-t border-zinc-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate(`/admin/hotels/${hotelId}/rooms`)}
            className="btn-secondary text-xs px-4 py-2.5 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary text-xs px-6 py-2.5 rounded-xl"
          >
            {saving ? 'Saving…' : isEdit ? 'Save Room Changes' : 'Create Room Category'}
          </button>
        </div>
      </form>
    </div>
  )
}
