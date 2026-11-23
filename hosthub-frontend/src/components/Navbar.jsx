import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import {
  Compass,
  Calendar,
  Building2,
  User,
  LogOut,
  ChevronDown,
  Sparkles,
  Hotel
} from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
    navigate('/')
  }

  const linkClass = ({ isActive }) =>
    `inline-flex items-center gap-1.5 text-sm font-medium transition-colors px-3 py-1.5 rounded-full ${
      isActive
        ? 'text-brand bg-brand-50 font-semibold'
        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70'
    }`

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/85 backdrop-blur-md transition-all">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3.5">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-brand text-white flex items-center justify-center shadow-sm shadow-brand/30 group-hover:bg-brand-800 transition-colors">
            <Hotel className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-xl font-bold text-zinc-900 tracking-tight leading-none">
              Host<span className="text-brand">Hub</span>
            </span>
            <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 font-medium">
              Boutique Hospitality
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-1.5">
          <NavLink to="/" end className={linkClass}>
            <Compass className="w-4 h-4" />
            Explore
          </NavLink>
          {user && (
            <NavLink to="/my-bookings" className={linkClass}>
              <Calendar className="w-4 h-4" />
              My Bookings
            </NavLink>
          )}
          {user?.isHotelManager && (
            <NavLink to="/admin" className={linkClass}>
              <Building2 className="w-4 h-4" />
              Manager Studio
            </NavLink>
          )}
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2.5 bg-white border border-zinc-200 rounded-full pl-2 pr-3 py-1.5 hover:shadow-sm hover:border-zinc-300 transition-all text-left"
              >
                <div className="w-7 h-7 rounded-full bg-brand-100 text-brand font-semibold text-xs flex items-center justify-center border border-brand/20">
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div className="hidden sm:block text-xs">
                  <p className="font-medium text-zinc-800 leading-tight truncate max-w-[110px]">
                    {user.name || user.email?.split('@')[0]}
                  </p>
                  {user.isHotelManager && (
                    <span className="text-[9px] uppercase tracking-wider text-brand font-semibold font-mono">
                      Manager
                    </span>
                  )}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-zinc-200 rounded-2xl shadow-floating p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-zinc-100 mb-1">
                    <p className="text-xs font-semibold text-zinc-900 truncate">{user.name}</p>
                    <p className="text-[11px] text-zinc-500 truncate">{user.email}</p>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-zinc-700 hover:text-zinc-900 hover:bg-stone-50 rounded-lg transition-colors"
                  >
                    <User className="w-4 h-4 text-zinc-400" />
                    Account Profile
                  </Link>
                  <Link
                    to="/my-bookings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-zinc-700 hover:text-zinc-900 hover:bg-stone-50 rounded-lg transition-colors"
                  >
                    <Calendar className="w-4 h-4 text-zinc-400" />
                    My Bookings
                  </Link>

                  {user.isHotelManager && (
                    <Link
                      to="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-brand hover:bg-brand-50 rounded-lg transition-colors"
                    >
                      <Building2 className="w-4 h-4 text-brand" />
                      Manager Studio
                    </Link>
                  )}

                  <div className="border-t border-zinc-100 my-1" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900 px-3 py-1.5 transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="btn-primary text-xs py-2 px-4 rounded-full"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Join HostHub
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}
