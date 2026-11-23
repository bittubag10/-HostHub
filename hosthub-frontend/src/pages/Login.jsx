import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuthStore } from '../store/auth'
import ErrorBanner from '../components/ErrorBanner'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const setAccessToken = useAuthStore((s) => s.setAccessToken)
  const navigate = useNavigate()
  const location = useLocation()

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await api.post('/auth/login', form)
      setAccessToken(res.data.accessToken)
      navigate(location.state?.from?.pathname || '/', { replace: true })
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-20">
      <p className="text-xs uppercase tracking-[0.3em] text-brass mb-2 font-mono">Welcome back</p>
      <h1 className="font-display text-3xl text-ivory mb-8">Sign in to HostHub</h1>

      <form onSubmit={submit} className="space-y-4">
        {error && <ErrorBanner error={error} />}
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
        <button
          disabled={loading}
          className="w-full bg-brass text-ink font-medium rounded-md py-2.5 hover:bg-brass-light transition-colors disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="text-sm text-muted mt-6">
        New here?{' '}
        <Link to="/signup" className="text-brass-light hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  )
}
