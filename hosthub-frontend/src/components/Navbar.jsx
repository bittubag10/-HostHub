import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import api from '../api/axios'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const linkClass = ({ isActive }) =>
    `text-sm tracking-wide transition-colors ${
      isActive ? 'text-brass-light' : 'text-muted hover:text-ivory'
    }`

  return (
    <header className="sticky top-0 z-40 border-b border-brass/15 bg-ink/90 backdrop-blur">
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display text-xl text-ivory tracking-tight">HostHub</span>
          <span className="h-1.5 w-1.5 rounded-full bg-brass" />
        </Link>

        <div className="hidden md:flex items-center gap-7">
          <NavLink to="/" end className={linkClass}>Search</NavLink>
          {user && <NavLink to="/my-bookings" className={linkClass}>My Bookings</NavLink>}
          {user && <NavLink to="/profile" className={linkClass}>Profile</NavLink>}
          {user?.isHotelManager && <NavLink to="/admin" className={linkClass}>Manager Console</NavLink>}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <button
              onClick={handleLogout}
              className="text-sm border border-brass/30 text-ivory px-4 py-1.5 rounded-full hover:border-brass hover:text-brass-light transition-colors"
            >
              Sign out
            </button>
          ) : (
            <>
              <Link to="/login" className="text-sm text-muted hover:text-ivory">Sign in</Link>
              <Link
                to="/signup"
                className="text-sm bg-brass text-ink font-medium px-4 py-1.5 rounded-full hover:bg-brass-light transition-colors"
              >
                Join
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
