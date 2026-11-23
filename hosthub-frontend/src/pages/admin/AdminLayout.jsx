import { NavLink, Outlet } from 'react-router-dom'

export default function AdminLayout() {
  const linkClass = ({ isActive }) =>
    `block px-3 py-2 rounded-md text-sm transition-colors ${
      isActive ? 'bg-brass/15 text-brass-light' : 'text-muted hover:text-ivory'
    }`

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8">
      <aside className="md:sticky md:top-24 h-fit">
        <p className="text-[10px] uppercase tracking-widest text-brass font-mono mb-3">Manager Console</p>
        <nav className="space-y-1">
          <NavLink to="/admin" end className={linkClass}>Properties</NavLink>
          <NavLink to="/admin/hotels/new" className={linkClass}>Add property</NavLink>
        </nav>
      </aside>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
