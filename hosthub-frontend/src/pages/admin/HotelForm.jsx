import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api/axios'
import Spinner from '../../components/Spinner'
import ErrorBanner from '../../components/ErrorBanner'
import { getPhotoUrl } from '../../util/imageUrl'
import {
  UploadCloud,
  Trash2,
  Building2,
  MapPin,
  Mail,
  Phone,
  Sparkles,
  ArrowLeft
} from 'lucide-react'

const emptyForm = {
  name: '',
  city: '',
  photoText: '',
  amenitiesText: '',
  contactInfo: { address: '', phoneNumber: '', email: '', location: '' },
}

export default function HotelForm() {
  const { hotelId } = useParams()
  const isEdit = !!hotelId
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
      .get(`/admin/hotels/${hotelId}`)
      .then((res) => {
        const h = res.data
        const currentPhotos = h.photo || h.photos || []
        setPhotos(currentPhotos)
        setForm({
          name: h.name,
          city: h.city,
          photoText: currentPhotos.join(', '),
          amenitiesText: (h.amenities || []).join(', '),
          contactInfo: h.contactInfo || emptyForm.contactInfo,
        })
      })
      .catch(setError)
      .finally(() => setLoading(false))
  }, [hotelId])

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
      const res = await api.post(`/admin/hotels/${hotelId}/photos`, formData, {
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
      const res = await api.delete(`/admin/hotels/${hotelId}/photos`, {
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
      name: form.name,
      city: form.city,
      photo: combinedPhotos,
      amenities: form.amenitiesText.split(',').map((s) => s.trim()).filter(Boolean),
      contactInfo: form.contactInfo,
    }
    try {
      if (isEdit) {
        await api.put(`/admin/hotels/${hotelId}`, payload)
      } else {
        await api.post('/admin/hotels', payload)
      }
      navigate('/admin')
    } catch (err) {
      setError(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner label="Loading property details" />

  return (
    <div className="max-w-3xl space-y-6">
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
            {isEdit ? 'Edit Boutique Property' : 'List New Property'}
          </h1>
          <p className="text-xs text-zinc-500">
            Provide property profile details, contact information, and upload high-res images.
          </p>
        </div>
      </div>

      {error && <ErrorBanner error={error} />}

      <form onSubmit={submit} className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 text-xs">
        {/* Basic Property Info */}
        <div className="space-y-4">
          <h3 className="font-display text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-2 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-brand" />
            General Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">
                Hotel Name
              </label>
              <input
                required
                placeholder="e.g. The Grand Azure Palace"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">
                City / Location
              </label>
              <input
                required
                placeholder="e.g. Goa"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="input text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">
              Curated Amenities (Comma-Separated)
            </label>
            <input
              placeholder="WiFi, Pool, AC, Parking, Breakfast, Spa"
              value={form.amenitiesText}
              onChange={(e) => setForm({ ...form, amenitiesText: e.target.value })}
              className="input text-xs"
            />
          </div>
        </div>

        {/* Photo Gallery & Upload Dropzone */}
        <div className="space-y-4 pt-2">
          <h3 className="font-display text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand" />
            Property Images
          </h3>

          {isEdit ? (
            <div className="space-y-3">
              {/* Upload Dropzone */}
              <label className="border-2 border-dashed border-zinc-200 hover:border-brand rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer bg-stone-50/50 hover:bg-brand-50/30 transition-all text-center">
                <UploadCloud className="w-8 h-8 text-brand" />
                <div>
                  <span className="font-semibold text-zinc-800 text-xs">Click to upload photos</span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">JPEG, PNG, WebP up to 5MB each</p>
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

              {uploading && <p className="text-xs text-brand font-mono">Uploading photos to disk…</p>}

              {/* Thumbnail Grid */}
              {photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {photos.map((url, idx) => (
                    <div
                      key={idx}
                      className="group relative aspect-video rounded-xl overflow-hidden bg-stone-100 border border-zinc-200 shadow-sm"
                    >
                      <img src={getPhotoUrl(url)} alt={`Hotel ${idx}`} className="w-full h-full object-cover" />
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
                * Real multi-file image uploading is unlocked immediately after creating the property profile.
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

        {/* Contact Information */}
        <div className="space-y-4 pt-2">
          <h3 className="font-display text-sm font-bold text-zinc-900 border-b border-zinc-100 pb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand" />
            Contact & Address
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">
                Full Street Address
              </label>
              <input
                required
                placeholder="123 Ocean Drive, Candolim"
                value={form.contactInfo.address}
                onChange={(e) => setForm({ ...form, contactInfo: { ...form.contactInfo, address: e.target.value } })}
                className="input text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">
                Contact Phone
              </label>
              <input
                required
                placeholder="+91 98765 43210"
                value={form.contactInfo.phoneNumber}
                onChange={(e) => setForm({ ...form, contactInfo: { ...form.contactInfo, phoneNumber: e.target.value } })}
                className="input text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">
                Concierge Email
              </label>
              <input
                type="email"
                required
                placeholder="concierge@hotel.com"
                value={form.contactInfo.email}
                onChange={(e) => setForm({ ...form, contactInfo: { ...form.contactInfo, email: e.target.value } })}
                className="input text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">
                Map Location / Coordinates
              </label>
              <input
                placeholder="15.5173° N, 73.7663° E"
                value={form.contactInfo.location}
                onChange={(e) => setForm({ ...form, contactInfo: { ...form.contactInfo, location: e.target.value } })}
                className="input text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-6 border-t border-zinc-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="btn-secondary text-xs px-4 py-2.5 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary text-xs px-6 py-2.5 rounded-xl"
          >
            {saving ? 'Saving property…' : isEdit ? 'Save Changes' : 'Create Property Profile'}
          </button>
        </div>
      </form>
    </div>
  )
}
