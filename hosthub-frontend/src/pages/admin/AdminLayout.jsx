import { NavLink, Outlet } from 'react-router-dom'
import { Building2, Plus, Compass, BarChart3, ShieldCheck } from 'lucide-react'

export default function AdminLayout() {
  const linkClass = ({ isActive }) =>
    `flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
      isActive
        ? 'bg-brand text-white shadow-sm shadow-brand/20'
        : 'text-zinc-600 hover:text-zinc-900 hover:bg-stone-100'
    }`

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-8 items-start">
      {/* Sidebar Navigation */}
      <aside className="bg-white border border-zinc-200 rounded-3xl p-5 shadow-sm md:sticky md:top-24 space-y-6">
        <div>
          <span className="text-[10px] uppercase font-bold text-zinc-400 font-mono tracking-wider">
            Hotelier Hub
          </span>
          <h2 className="font-display text-lg font-bold text-zinc-900 flex items-center gap-2 mt-0.5">
            <Building2 className="w-5 h-5 text-brand" />
            Manager Studio
          </h2>
        </div>

        <nav className="space-y-1">
          <NavLink to="/admin" end className={linkClass}>
            <Building2 className="w-4 h-4" />
            <span>Properties Portfolio</span>
          </NavLink>
          <NavLink to="/admin/hotels/new" className={linkClass}>
            <Plus className="w-4 h-4" />
            <span>Add New Property</span>
          </NavLink>
        </nav>

        <div className="pt-4 border-t border-zinc-100 space-y-2">
          <NavLink
            to="/"
            className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <Compass className="w-4 h-4" />
            <span>Switch to Guest View</span>
          </NavLink>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
