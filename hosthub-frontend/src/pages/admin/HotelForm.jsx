import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api/axios'
import Spinner from '../../components/Spinner'
import ErrorBanner from '../../components/ErrorBanner'

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
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isEdit) return
    api.get(`/admin/hotels/${hotelId}`).then((res) => {
      const h = res.data
      setForm({
        name: h.name,
        city: h.city,
        photoText: (h.photo || []).join(', '),
        amenitiesText: (h.amenities || []).join(', '),
        contactInfo: h.contactInfo || emptyForm.contactInfo,
      })
    }).catch(setError).finally(() => setLoading(false))
  }, [hotelId])

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const payload = {
      name: form.name,
      city: form.city,
      photo: form.photoText.split(',').map((s) => s.trim()).filter(Boolean),
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
        <Field label="Photo URLs (comma separated)">
          <input value={form.photoText} onChange={(e) => setForm({ ...form, photoText: e.target.value })} className="input" placeholder="https://..., https://..." />
        </Field>
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
