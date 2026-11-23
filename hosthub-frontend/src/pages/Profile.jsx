import { useState } from 'react'
import api from '../api/axios'
import ErrorBanner from '../components/ErrorBanner'
import { User, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '../store/auth'

export default function Profile() {
  const user = useAuthStore((s) => s.user)
  const [form, setForm] = useState({
    name: user?.name || '',
    dateOfBirth: '',
    gender: 'MALE',
  })
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
    <div className="max-w-lg mx-auto px-6 py-14 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-zinc-900 tracking-tight">
          Account Profile
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Manage your personal guest identity and account preferences.
        </p>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-card space-y-6">
        <div className="flex items-center gap-4 border-b border-zinc-100 pb-5">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand flex items-center justify-center font-bold text-xl border border-brand-200">
            {form.name ? form.name[0].toUpperCase() : 'U'}
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-zinc-900">{form.name || 'Guest User'}</h3>
            <p className="text-xs text-zinc-500">{user?.email}</p>
          </div>
        </div>

        {error && <ErrorBanner error={error} />}

        {saved && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Profile details updated successfully.</span>
          </div>
        )}

        <form onSubmit={submit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">
              Full Name
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input text-xs"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
              className="input text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">
              Gender
            </label>
            <select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              className="input text-xs cursor-pointer"
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full text-xs py-2.5 rounded-xl mt-2"
          >
            {saving ? 'Saving changes…' : 'Save Profile Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
