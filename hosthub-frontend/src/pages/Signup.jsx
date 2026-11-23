import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import ErrorBanner from '../components/ErrorBanner'

export default function Signup() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    gender: 'MALE',
    dateOfBirth: '',
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await api.post('/auth/signup', form)
      setDone(true)
      setTimeout(() => navigate('/login'), 1200)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-20">
      <p className="text-xs uppercase tracking-[0.3em] text-brass mb-2 font-mono">Get started</p>
      <h1 className="font-display text-3xl text-ivory mb-8">Create your account</h1>

      {done ? (
        <div className="border border-success/40 bg-success/10 rounded-md px-4 py-3 text-ivory text-sm">
          Account created. Taking you to sign in…
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && <ErrorBanner error={error} />}
          <div>
            <label className="text-xs uppercase tracking-wide text-muted">Full name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full bg-surface border border-brass/15 rounded-md px-4 py-2.5 text-ivory focus:outline-none focus:border-brass"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-muted">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 w-full bg-surface border border-brass/15 rounded-md px-4 py-2.5 text-ivory focus:outline-none focus:border-brass"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wide text-muted">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="mt-1 w-full bg-surface border border-brass/15 rounded-md px-4 py-2.5 text-ivory focus:outline-none focus:border-brass"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
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
            <div>
              <label className="text-xs uppercase tracking-wide text-muted">Date of birth</label>
              <input
                type="date"
                required
                value={form.dateOfBirth}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                className="mt-1 w-full bg-surface border border-brass/15 rounded-md px-4 py-2.5 text-ivory focus:outline-none focus:border-brass"
              />
            </div>
          </div>
          <button
            disabled={loading}
            className="w-full bg-brass text-ink font-medium rounded-md py-2.5 hover:bg-brass-light transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </form>
      )}

      <p className="text-sm text-muted mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-brass-light hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
