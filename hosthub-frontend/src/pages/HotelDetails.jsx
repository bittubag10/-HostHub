import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'
import Spinner from '../components/Spinner'
import ErrorBanner from '../components/ErrorBanner'
import { useAuthStore } from '../store/auth'

const todayStr = () => new Date().toISOString().split('T')[0]

export default function HotelDetails() {
  const { hotelId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const [info, setInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [booking, setBooking] = useState(false)

  const initial = location.state?.searchParams
  const [dates, setDates] = useState({
    checkInDate: initial?.startDate || todayStr(),
    checkOutDate: initial?.endDate || '',
    roomCount: initial?.roomsCount || 1,
  })

  useEffect(() => {
    let active = true
    setLoading(true)
    api
      .get(`/hotels/${hotelId}/info`)
      .then((res) => active && setInfo(res.data))
      .catch((err) => active && setError(err))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [hotelId])

  const startBooking = async (room) => {
    if (!user) {
      navigate('/login', { state: { from: location } })
      return
    }
    if (!dates.checkOutDate) {
      setError({ message: 'Please choose a check-out date first.' })
      return
    }
    setError(null)
    setBooking(true)
    try {
      const res = await api.post('/bookings/init', {
        hotelId: Number(hotelId),
        roomId: room.id,
        checkInDate: dates.checkInDate,
        checkOutDate: dates.checkOutDate,
        roomCount: Number(dates.roomCount),
      })
      navigate(`/bookings/${res.data.id}/guests`)
    } catch (err) {
      setError(err)
    } finally {
      setBooking(false)
    }
  }

  if (loading) return <Spinner label="Loading hotel" />
  if (error && !info) return <div className="max-w-3xl mx-auto px-6 py-10"><ErrorBanner error={error} /></div>
  if (!info) return null

  const { hotel, rooms } = info

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="grid md:grid-cols-2 gap-2 rounded-xl overflow-hidden mb-8 h-72">
        {(hotel.photo || []).slice(0, 2).map((p, i) => (
          <img key={i} src={p} alt={hotel.name} className="w-full h-full object-cover" />
        ))}
        {(!hotel.photo || hotel.photo.length === 0) && (
          <div className="col-span-2 bg-surface flex items-center justify-center text-muted">No photos available</div>
        )}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 mb-2">
        <div>
          <h1 className="font-display text-3xl text-ivory">{hotel.name}</h1>
          <p className="text-muted">{hotel.city} · {hotel.contactInfo?.address}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(hotel.amenities || []).map((a) => (
            <span key={a} className="text-[10px] uppercase tracking-wide text-brass-light/80 border border-brass/20 rounded-full px-2.5 py-1">
              {a}
            </span>
          ))}
        </div>
      </div>

      {error && <div className="my-4"><ErrorBanner error={error} /></div>}

      {/* Date/room bar */}
      <div className="bg-surface border border-brass/15 rounded-xl p-4 grid grid-cols-3 gap-3 my-6 max-w-lg font-mono text-sm">
        <div>
          <label className="text-[9px] text-muted uppercase tracking-wider">Check-in</label>
          <input
            type="date"
            value={dates.checkInDate}
            onChange={(e) => setDates({ ...dates, checkInDate: e.target.value })}
            className="mt-1 w-full bg-surface-raised border border-brass/10 rounded px-2 py-1.5 text-ivory"
          />
        </div>
        <div>
          <label className="text-[9px] text-muted uppercase tracking-wider">Check-out</label>
          <input
            type="date"
            value={dates.checkOutDate}
            onChange={(e) => setDates({ ...dates, checkOutDate: e.target.value })}
            className="mt-1 w-full bg-surface-raised border border-brass/10 rounded px-2 py-1.5 text-ivory"
          />
        </div>
        <div>
          <label className="text-[9px] text-muted uppercase tracking-wider">Rooms</label>
          <input
            type="number"
            min={1}
            value={dates.roomCount}
            onChange={(e) => setDates({ ...dates, roomCount: e.target.value })}
            className="mt-1 w-full bg-surface-raised border border-brass/10 rounded px-2 py-1.5 text-ivory"
          />
        </div>
      </div>

      <h2 className="font-display text-2xl text-ivory mb-4">Rooms</h2>
      <div className="space-y-4">
        {rooms.map((room) => (
          <div key={room.id} className="flex gap-5 bg-surface/60 border border-brass/10 rounded-lg p-4">
            <div className="w-36 h-28 shrink-0 rounded-md overflow-hidden bg-surface-raised">
              {room.photo?.[0] ? (
                <img src={room.photo[0]} alt={room.type} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted text-xs">No photo</div>
              )}
            </div>
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-display text-lg text-ivory">{room.type}</h3>
                <p className="text-xs text-muted">Sleeps {room.capacity}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(room.amenities || []).slice(0, 4).map((a) => (
                    <span key={a} className="text-[10px] text-muted border border-brass/10 rounded-full px-2 py-0.5">{a}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-end justify-between mt-3">
                <span className="font-mono text-lg text-brass-light">₹{Number(room.basePrice).toLocaleString('en-IN')} <span className="text-xs text-muted">/ night</span></span>
                <button
                  onClick={() => startBooking(room)}
                  disabled={booking}
                  className="bg-brass text-ink text-sm font-medium px-5 py-2 rounded-md hover:bg-brass-light transition-colors disabled:opacity-50"
                >
                  {booking ? 'Booking…' : 'Book this room'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
