import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../api/axios'
import Spinner from '../../components/Spinner'
import ErrorBanner from '../../components/ErrorBanner'

const monthAgo = () => {
  const d = new Date()
  d.setMonth(d.getMonth() - 1)
  return d.toISOString().split('T')[0]
}
const todayStr = () => new Date().toISOString().split('T')[0]

export default function AdminReports() {
  const { hotelId } = useParams()
  const [range, setRange] = useState({ startDate: monthAgo(), endDate: todayStr() })
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = () => {
    setLoading(true)
    setError(null)
    api
      .get(`/admin/hotels/${hotelId}/reports`, { params: range })
      .then((res) => setReport(res.data))
      .catch(setError)
      .finally(() => setLoading(false))
  }

  useEffect(load, [hotelId])

  return (
    <div>
      <h1 className="font-display text-3xl text-ivory mb-6">Revenue report</h1>

      <div className="flex flex-wrap items-end gap-3 mb-8">
        <div>
          <label className="text-[10px] uppercase tracking-widest text-muted">From</label>
          <input type="date" value={range.startDate} onChange={(e) => setRange({ ...range, startDate: e.target.value })} className="input mt-1" />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-muted">To</label>
          <input type="date" value={range.endDate} onChange={(e) => setRange({ ...range, endDate: e.target.value })} className="input mt-1" />
        </div>
        <button onClick={load} className="bg-brass text-ink font-medium px-5 py-2.5 rounded-md hover:bg-brass-light">
          Update report
        </button>
      </div>

      {error && <ErrorBanner error={error} />}
      {loading && <Spinner label="Crunching numbers" />}

      {!loading && report && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Confirmed bookings" value={report.bookingCount} />
          <StatCard label="Total revenue" value={`₹${Number(report.totalRevenue).toLocaleString('en-IN')}`} />
          <StatCard label="Avg. revenue / booking" value={`₹${Number(report.avgRevenue).toLocaleString('en-IN')}`} />
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="bg-surface border border-brass/15 rounded-xl p-6">
      <p className="text-[10px] uppercase tracking-widest text-muted">{label}</p>
      <p className="font-display text-3xl text-brass-light mt-2">{value}</p>
    </div>
  )
}
