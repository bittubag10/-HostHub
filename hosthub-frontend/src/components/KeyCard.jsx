import { getPhotoUrl } from '../util/imageUrl'
import { Calendar, MapPin, Hotel, CreditCard } from 'lucide-react'

const STATUS_CONFIG = {
  CONFIRMED: {
    label: 'Confirmed',
    style: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  PAYMENT_PENDING: {
    label: 'Payment Pending',
    style: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  GUESTS_ADDED: {
    label: 'Hold Reserved',
    style: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  RESERVED: {
    label: 'Hold Reserved',
    style: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  CANCELED: {
    label: 'Cancelled',
    style: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  EXPIRED: {
    label: 'Expired',
    style: 'bg-stone-100 text-zinc-500 border-zinc-200',
  },
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function KeyCard({ booking, children }) {
  const status = booking.bookingStatus
  const statusConf = STATUS_CONFIG[status] || {
    label: status?.replace('_', ' '),
    style: 'bg-stone-100 text-zinc-600 border-zinc-200',
  }

  const rawPhoto = booking.hotel?.photo?.[0] || booking.hotel?.photos?.[0]
  const hotelPhoto = getPhotoUrl(rawPhoto)

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-card transition-all hover:border-zinc-300">
      <div className="p-5 sm:p-6">
        {/* Top Header Row */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {hotelPhoto ? (
              <img
                src={hotelPhoto}
                alt={booking.hotel?.name || 'Hotel'}
                className="w-16 h-16 rounded-xl object-cover border border-zinc-200 shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-stone-100 text-zinc-400 flex items-center justify-center shrink-0">
                <Hotel className="w-6 h-6" />
              </div>
            )}

            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 font-mono tracking-wider">
                Booking Reference #{booking.id}
              </span>
              <h3 className="font-display text-xl font-bold text-zinc-900 mt-0.5">
                {booking.hotel?.name || 'Hotel'}
              </h3>
              <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-brand" />
                {booking.hotel?.city || 'India'}
                {booking.room?.type && <span className="font-mono text-zinc-400">· {booking.room.type}</span>}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span
              className={`inline-block text-xs font-semibold px-3 py-1 rounded-full border ${statusConf.style}`}
            >
              {statusConf.label}
            </span>
            {booking.amount && (
              <p className="font-display text-lg font-bold text-zinc-900 mt-2 font-mono">
                ₹{Number(booking.amount).toLocaleString('en-IN')}
              </p>
            )}
          </div>
        </div>

        {/* Dates & Details Grid */}
        <div className="grid grid-cols-3 gap-3 bg-stone-50 border border-zinc-200/60 rounded-xl p-3.5 mt-5 font-mono text-xs">
          <div>
            <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Check-in</p>
            <p className="font-medium text-zinc-800 mt-0.5">{fmtDate(booking.checkInDate)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Check-out</p>
            <p className="font-medium text-zinc-800 mt-0.5">{fmtDate(booking.checkOutDate)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Rooms</p>
            <p className="font-medium text-zinc-800 mt-0.5">{booking.roomsCount} {booking.roomsCount === 1 ? 'room' : 'rooms'}</p>
          </div>
        </div>

        {children && <div className="mt-4 pt-4 border-t border-zinc-100">{children}</div>}
      </div>
    </div>
  )
}
