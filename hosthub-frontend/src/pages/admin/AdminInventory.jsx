import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../api/axios'
import Spinner from '../../components/Spinner'
import EmptyState from '../../components/EmptyState'
import ErrorBanner from '../../components/ErrorBanner'

const todayStr = () => new Date().toISOString().split('T')[0]

export default function AdminInventory() {
  const { roomId } = useParams()
  const [inventory, setInventory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({ startDate: todayStr(), endDate: '', surgeFactor: 1, closed: false })

  const load = () => {
    setLoading(true)
    api.get(`/admin/inventory/rooms/${roomId}`).then((res) => setInventory(res.data)).catch(setError).finally(() => setLoading(false))
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

  if (loading) return <Spinner label="Loading inventory" />

  return (
    <div>
      <h1 className="font-display text-3xl text-ivory mb-6">Inventory & pricing</h1>
      {error && <div className="mb-5"><ErrorBanner error={error} /></div>}

      <form onSubmit={submit} className="bg-surface border border-brass/15 rounded-xl p-5 grid grid-cols-2 md:grid-cols-5 gap-3 items-end mb-8">
        <div>
          <label className="text-[10px] uppercase tracking-widest text-muted">From</label>
          <input type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="input mt-1" />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-muted">To</label>
          <input type="date" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="input mt-1" />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-muted">Surge factor</label>
          <input type="number" step="0.01" min="1.00" required value={form.surgeFactor} onChange={(e) => setForm({ ...form, surgeFactor: e.target.value })} className="input mt-1" />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={form.closed} onChange={(e) => setForm({ ...form, closed: e.target.checked })} className="accent-brass" />
          Closed for booking
        </label>
        <button disabled={saving} className="bg-brass text-ink font-medium px-5 py-2.5 rounded-md hover:bg-brass-light disabled:opacity-50">
          {saving ? 'Updating…' : 'Update range'}
        </button>
      </form>
      {saved && <p className="text-success text-sm mb-6">Inventory updated for the selected range.</p>}

      {inventory?.length === 0 && <EmptyState title="No inventory records" subtitle="Update a date range above to generate availability." />}

      {inventory?.length > 0 && (
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm font-mono border-collapse">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-muted border-b border-brass/10">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2 pr-4">Booked</th>
                <th className="py-2 pr-4">Reserved</th>
                <th className="py-2 pr-4">Surge</th>
                <th className="py-2 pr-4">Price</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((inv) => (
                <tr key={inv.id} className="border-b border-brass/5 text-ivory">
                  <td className="py-2 pr-4">{new Date(inv.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                  <td className="py-2 pr-4">{inv.totalCount}</td>
                  <td className="py-2 pr-4">{inv.bookCount}</td>
                  <td className="py-2 pr-4">{inv.reservedCount}</td>
                  <td className="py-2 pr-4">{inv.surgeFactor}x</td>
                  <td className="py-2 pr-4 text-brass-light">₹{Number(inv.price).toLocaleString('en-IN')}</td>
                  <td className="py-2 pr-4">
                    {inv.closed ? <span className="text-danger">Closed</span> : <span className="text-success">Open</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
