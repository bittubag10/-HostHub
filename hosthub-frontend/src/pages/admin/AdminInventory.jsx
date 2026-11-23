import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import Spinner from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'
import ErrorBanner from '../../components/ErrorBanner'
import {
  Calendar,
  Layers,
  ArrowLeft,
  CheckCircle2,
  TrendingUp,
  Lock,
  Sparkles
} from 'lucide-react'

const todayStr = () => new Date().toISOString().split('T')[0]

export default function AdminInventory() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const [inventory, setInventory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({ startDate: todayStr(), endDate: '', surgeFactor: 1, closed: false })

  const load = () => {
    setLoading(true)
    api
      .get(`/admin/inventory/rooms/${roomId}`)
      .then((res) => setInventory(res.data))
      .catch(setError)
      .finally(() => setLoading(false))
  }
  useEffect(load, [roomId])

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setSaved(false)
    setSaving(true)
    try {
      await api.patch(`/admin/inventory/rooms/${roomId}`, {
        startDate: form.startDate,
        endDate: form.endDate,
        surgeFactor: Number(form.surgeFactor),
        closed: form.closed,
      })
      setSaved(true)
      load()
    } catch (err) {
      setError(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner label="Loading suite inventory records" />

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl border border-zinc-200 bg-white hover:bg-stone-50 text-zinc-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-900">
            Inventory & Surge Pricing Controller
          </h1>
          <p className="text-xs text-zinc-500">
            Bulk-update room availability dates, surge pricing multipliers, and blackout dates.
          </p>
        </div>
      </div>

      {error && <ErrorBanner error={error} />}

      {/* Bulk Controller Card */}
      <form
        onSubmit={submit}
        className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-4"
      >
        <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
          <TrendingUp className="w-4 h-4 text-brand" />
          <h3 className="font-display text-sm font-bold text-zinc-900">
            Bulk Date-Range Adjustment
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 font-mono">
              From Date
            </label>
            <input
              type="date"
              required
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              className="input text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 font-mono">
              To Date
            </label>
            <input
              type="date"
              required
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              className="input text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 font-mono">
              Surge Multiplier (0.5 - 5.0)
            </label>
            <input
              type="number"
              step="0.05"
              min="0.50"
              max="5.00"
              required
              value={form.surgeFactor}
              onChange={(e) => setForm({ ...form, surgeFactor: e.target.value })}
              className="input text-xs font-mono"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 pb-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.closed}
              onChange={(e) => setForm({ ...form, closed: e.target.checked })}
              className="w-4 h-4 rounded text-brand focus:ring-brand border-zinc-300"
            />
            <span>Close for booking</span>
          </label>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary text-xs py-2.5 rounded-xl h-[42px]"
          >
            {saving ? 'Applying…' : 'Apply to Range'}
          </button>
        </div>

        {saved && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Inventory updated and hotel search min-prices synchronized immediately!</span>
          </div>
        )}
      </form>

      {/* Inventory Table */}
      {inventory?.length === 0 && (
        <EmptyState
          title="No inventory records found"
          subtitle="Apply a date range above to generate daily availability rows."
        />
      )}

      {inventory?.length > 0 && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <h3 className="font-display text-sm font-bold text-zinc-900">
              Daily Availability & Pricing Ledger
            </h3>
            <span className="text-xs text-zinc-400 font-mono">
              {inventory.length} days on record
            </span>
          </div>

          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-xs font-mono border-collapse">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-zinc-400 border-b border-zinc-200 pb-2">
                  <th className="py-2.5 pr-4">Date</th>
                  <th className="py-2.5 pr-4">Total</th>
                  <th className="py-2.5 pr-4">Booked</th>
                  <th className="py-2.5 pr-4">Reserved</th>
                  <th className="py-2.5 pr-4">Surge</th>
                  <th className="py-2.5 pr-4">Calculated Price</th>
                  <th className="py-2.5 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((inv) => (
                  <tr key={inv.id} className="border-b border-zinc-100 text-zinc-800 hover:bg-stone-50">
                    <td className="py-2 pr-4 font-semibold">
                      {new Date(inv.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-2 pr-4 text-zinc-600">{inv.totalCount}</td>
                    <td className="py-2 pr-4 text-brand font-medium">{inv.bookCount}</td>
                    <td className="py-2 pr-4 text-amber-600 font-medium">{inv.reservedCount}</td>
                    <td className="py-2 pr-4 text-zinc-700">{inv.surgeFactor}x</td>
                    <td className="py-2 pr-4 font-bold text-zinc-900">
                      ₹{Number(inv.price).toLocaleString('en-IN')}
                    </td>
                    <td className="py-2 pr-4">
                      {inv.closed ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          Closed
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Open
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
