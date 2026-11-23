import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api/axios'
import Spinner from '../../components/Spinner'
import ErrorBanner from '../../components/ErrorBanner'
import { getPhotoUrl } from '../../util/imageUrl'

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
    api.get(`/admin/hotels/${hotelId}`).then((res) => {
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
    }).catch(setError).finally(() => setLoading(false))
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

  if (loading) return <Spinner label="Loading property" />

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl text-ivory mb-6">{isEdit ? 'Edit property' : 'Add a property'}</h1>
      <form onSubmit={submit} className="space-y-4">
        {error && <ErrorBanner error={error} />}
        <Field label="Property name">
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
        </Field>
        <Field label="City">
          <input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input" />
        </Field>

        {/* Real photo management section */}
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
                      <img src={getPhotoUrl(p)} alt={`hotel-${idx}`} className="w-full h-full object-cover" />
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
            <p className="text-xs text-muted mt-1">Save this property first, then upload local photo files here.</p>
          )}

          <div className="mt-3">
            <span className="text-[10px] uppercase tracking-wider text-muted">Or enter Photo URLs (comma separated)</span>
            <input value={form.photoText} onChange={(e) => setForm({ ...form, photoText: e.target.value })} className="input mt-1" placeholder="https://..., /uploads/..." />
          </div>
        </div>

        <Field label="Amenities (comma separated)">
          <input value={form.amenitiesText} onChange={(e) => setForm({ ...form, amenitiesText: e.target.value })} className="input" placeholder="WiFi, Pool, Breakfast" />
        </Field>

        <p className="text-xs uppercase tracking-widest text-brass font-mono pt-2">Contact info</p>
        <Field label="Address">
          <input required value={form.contactInfo.address} onChange={(e) => setForm({ ...form, contactInfo: { ...form.contactInfo, address: e.target.value } })} className="input" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone (10 digits)">
            <input required pattern="[0-9]{10}" value={form.contactInfo.phoneNumber} onChange={(e) => setForm({ ...form, contactInfo: { ...form.contactInfo, phoneNumber: e.target.value } })} className="input" />
          </Field>
          <Field label="Contact email">
            <input required type="email" value={form.contactInfo.email} onChange={(e) => setForm({ ...form, contactInfo: { ...form.contactInfo, email: e.target.value } })} className="input" />
          </Field>
        </div>
        <Field label="Location link / coordinates">
          <input required value={form.contactInfo.location} onChange={(e) => setForm({ ...form, contactInfo: { ...form.contactInfo, location: e.target.value } })} className="input" />
        </Field>

        <button disabled={saving} className="bg-brass text-ink font-medium px-6 py-2.5 rounded-md hover:bg-brass-light disabled:opacity-50">
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create property'}
        </button>
      </form>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-widest text-muted">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  )
}
