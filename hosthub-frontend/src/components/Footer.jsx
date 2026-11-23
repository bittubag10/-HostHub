import { Link } from 'react-router-dom'
import { Hotel, ShieldCheck, Heart, Sparkles, MapPin, Mail, Phone } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white pt-16 pb-12 mt-20 text-zinc-600">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand Intro */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand text-white flex items-center justify-center shadow-sm">
                <Hotel className="w-4 h-4" />
              </div>
              <span className="font-display text-xl font-bold text-zinc-900 tracking-tight">
                Host<span className="text-brand">Hub</span>
              </span>
            </Link>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Curated luxury boutique stays, transparent dynamic pricing, and verified guest experiences.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
              <ShieldCheck className="w-4 h-4 text-brand" />
              <span>Verified Boutique Partners</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider text-zinc-900 font-semibold font-mono">
              Explore Destinations
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-brand transition-colors">Goa Beachfront Villas</Link></li>
              <li><Link to="/" className="hover:text-brand transition-colors">Mumbai Urban Escapes</Link></li>
              <li><Link to="/" className="hover:text-brand transition-colors">Jaipur Heritage Palaces</Link></li>
              <li><Link to="/" className="hover:text-brand transition-colors">Bengaluru Garden Suites</Link></li>
            </ul>
          </div>

          {/* Hospitality Management */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider text-zinc-900 font-semibold font-mono">
              Hoteliers & Managers
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/admin" className="hover:text-brand transition-colors">Manager Studio</Link></li>
              <li><Link to="/signup" className="hover:text-brand transition-colors">List Your Hotel</Link></li>
              <li><span className="text-zinc-400">Dynamic Pricing Engine</span></li>
              <li><span className="text-zinc-400">Pessimistic Lock Inventory</span></li>
            </ul>
          </div>

          {/* Platform Tech Badges */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider text-zinc-900 font-semibold font-mono">
              Architecture & Trust
            </h4>
            <div className="flex flex-wrap gap-2">
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-stone-100 text-zinc-700 border border-zinc-200">
                Spring Boot 3
              </span>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-stone-100 text-zinc-700 border border-zinc-200">
                PostgreSQL
              </span>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-stone-100 text-zinc-700 border border-zinc-200">
                Stripe Payments
              </span>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-stone-100 text-zinc-700 border border-zinc-200">
                Idempotent APIs
              </span>
            </div>
            <p className="text-xs text-zinc-400 pt-2">
              All bookings protected by atomic inventory reservation and 256-bit encryption.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <p>© {new Date().getFullYear()} HostHub Inc. Handcrafted for modern hospitality.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-zinc-600 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-zinc-600 cursor-pointer">Terms of Service</span>
            <span className="hover:text-zinc-600 cursor-pointer">Support</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
