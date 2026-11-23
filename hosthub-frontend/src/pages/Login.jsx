import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuthStore } from '../store/auth'
import ErrorBanner from '../components/ErrorBanner'
import { Hotel, Lock, Mail, ArrowRight } from 'lucide-react'

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
    <div className="max-w-md mx-auto px-6 py-16 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-brand text-white flex items-center justify-center mx-auto shadow-md shadow-brand/20">
          <Hotel className="w-6 h-6" />
        </div>
        <h1 className="font-display text-3xl font-extrabold text-zinc-900 tracking-tight">
          Welcome Back
        </h1>
        <p className="text-sm text-zinc-500">
          Sign in to your HostHub guest or hotelier account
        </p>
      </div>

      <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-card">
        <form onSubmit={submit} className="space-y-4">
          {error && <ErrorBanner error={error} />}

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input pl-10 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input pl-10 text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full text-xs py-3 rounded-xl mt-2 flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Signing in…' : 'Sign in to Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-6 border-t border-zinc-100 mt-6 text-center">
          <p className="text-xs text-zinc-500">
            Don't have an account?{' '}
            <Link to="/signup" className="text-brand font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
