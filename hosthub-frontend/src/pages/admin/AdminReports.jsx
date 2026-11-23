import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../api/axios'
import Spinner from '../../components/Spinner'
import ErrorBanner from '../../components/ErrorBanner'

const daysAgo = (days) => {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}
const todayStr = () => new Date().toISOString().split('T')[0]

export default function AdminReports() {
  const { hotelId } = useParams()
  const [range, setRange] = useState({ startDate: daysAgo(30), endDate: todayStr() })
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

  const maxDailyRevenue = Math.max(
    1,
    ...(report?.dailyRevenueBreakdown || []).map((d) => Number(d.revenue || 0))
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-ivory">Revenue & Occupancy Analytics</h1>
        <p className="text-sm text-muted mt-1">Detailed performance metrics and daily revenue tracking</p>
      </div>

      {/* Date Range Picker */}
      <div className="bg-surface border border-brass/15 rounded-xl p-4 flex flex-wrap items-end gap-4">
        <div>
          <label className="text-[10px] uppercase tracking-widest text-muted">From</label>
          <input
            type="date"
            value={range.startDate}
            onChange={(e) => setRange({ ...range, startDate: e.target.value })}
            className="input mt-1 block"
          />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-widest text-muted">To</label>
          <input
            type="date"
            value={range.endDate}
            onChange={(e) => setRange({ ...range, endDate: e.target.value })}
            className="input mt-1 block"
          />
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="bg-brass text-ink font-medium px-5 py-2.5 rounded-md hover:bg-brass-light transition-colors disabled:opacity-50"
        >
          {loading ? 'Crunching…' : 'Generate Report'}
        </button>
      </div>

      {error && <ErrorBanner error={error} />}
      {loading && <Spinner label="Crunching numbers" />}

      {!loading && report && (
        <div className="space-y-8">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard
              label="Total Revenue"
              value={`₹${Math.round(Number(report.totalRevenue || 0)).toLocaleString('en-IN')}`}
              highlight
            />
            <StatCard
              label="Confirmed Bookings"
              value={report.confirmedBookingsCount ?? report.bookingCount ?? 0}
            />
            <StatCard
              label="Canceled / Expired"
              value={report.canceledBookingsCount ?? 0}
            />
            <StatCard
              label="Avg Booking Value"
              value={`₹${Math.round(Number(report.averageBookingValue ?? report.avgRevenue ?? 0)).toLocaleString('en-IN')}`}
            />
            <StatCard
              label="Occupancy Rate"
              value={`${report.occupancyRate ?? 0}%`}
              badge={report.occupancyRate >= 80 ? 'High' : report.occupancyRate > 0 ? 'Normal' : 'Empty'}
            />
          </div>

          {/* Daily Revenue Breakdown */}
          {report.dailyRevenueBreakdown && report.dailyRevenueBreakdown.length > 0 && (
            <div className="bg-surface border border-brass/15 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl text-ivory">Daily Revenue Breakdown</h2>
                <span className="text-xs text-muted font-mono">
                  {report.dailyRevenueBreakdown.length} days analyzed
                </span>
              </div>

              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-sm font-mono border-collapse">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-wider text-muted border-b border-brass/10">
                      <th className="py-2.5 pr-4">Date</th>
                      <th className="py-2.5 pr-4">Bookings</th>
                      <th className="py-2.5 pr-4 text-right">Revenue</th>
                      <th className="py-2.5 pl-6 w-1/3">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.dailyRevenueBreakdown.map((day) => {
                      const rev = Number(day.revenue || 0)
                      const pct = Math.round((rev / maxDailyRevenue) * 100)
                      return (
                        <tr key={day.date} className="border-b border-brass/5 text-ivory hover:bg-brass/5">
                          <td className="py-2 pr-4">{day.date}</td>
                          <td className="py-2 pr-4 text-muted">{day.bookingsCount}</td>
                          <td className="py-2 pr-4 text-right text-brass-light font-medium">
                            ₹{rev.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2 pl-6">
                            <div className="w-full bg-surface-raised h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-brass h-full rounded-full transition-all duration-300"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, highlight, badge }) {
  return (
    <div className={`bg-surface border rounded-xl p-5 flex flex-col justify-between ${highlight ? 'border-brass/40 shadow-sm shadow-brass/10' : 'border-brass/15'}`}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest text-muted">{label}</p>
        {badge && (
          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-brass/15 text-brass-light font-mono">
            {badge}
          </span>
        )}
      </div>
      <p className={`font-display text-2xl mt-3 ${highlight ? 'text-brass-light font-semibold' : 'text-ivory'}`}>
        {value}
      </p>
    </div>
  )
}
