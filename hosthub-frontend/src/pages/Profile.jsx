import { useState } from 'react'
import api from '../api/axios'
import ErrorBanner from '../components/ErrorBanner'

export default function Profile() {
  const [form, setForm] = useState({ name: '', dateOfBirth: '', gender: 'MALE' })
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setSaved(false)
    setSaving(true)
    try {
      await api.put('/users/profile', form)
      setSaved(true)
    } catch (err) {
      setError(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <h1 className="font-display text-3xl text-ivory mb-8">Your profile</h1>
      <form onSubmit={submit} className="space-y-4">
        {error && <ErrorBanner error={error} />}
        {saved && (
          <div className="border border-success/40 bg-success/10 rounded-md px-4 py-3 text-sm text-ivory">
            Profile updated.
          </div>
        )}
        <div>
          <label className="text-xs uppercase tracking-wide text-muted">Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="mt-1 w-full bg-surface border border-brass/15 rounded-md px-4 py-2.5 text-ivory focus:outline-none focus:border-brass"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-muted">Date of birth</label>
          <input
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
            className="mt-1 w-full bg-surface border border-brass/15 rounded-md px-4 py-2.5 text-ivory focus:outline-none focus:border-brass"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-muted">Gender</label>
          <select
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
            className="mt-1 w-full bg-surface border border-brass/15 rounded-md px-4 py-2.5 text-ivory focus:outline-none focus:border-brass"
          >
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <button
          disabled={saving}
          className="w-full bg-brass text-ink font-medium rounded-md py-2.5 hover:bg-brass-light transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}
