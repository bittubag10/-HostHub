const STATUS_STYLES = {
  RESERVED: 'text-muted',
  GUESTS_ADDED: 'text-brass-light',
  PAYMENT_PENDING: 'text-brass-light',
  CONFIRMED: 'text-success',
  CANCELED: 'text-danger',
  EXPIRED: 'text-danger',
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function KeyCard({ booking, children }) {
  const status = booking.bookingStatus
  return (
    <div className="keycard rounded-xl flex overflow-hidden shadow-lg shadow-black/30">
      <div className="flex-1 p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted font-mono">Booking #{booking.id}</p>
            <h3 className="font-display text-xl text-ivory mt-1">{booking.hotel?.name || 'Hotel'}</h3>
            <p className="text-sm text-muted">{booking.hotel?.city}</p>
          </div>
          <span className={`text-xs uppercase tracking-wider font-mono ${STATUS_STYLES[status] || 'text-muted'}`}>
            {status?.replace('_', ' ')}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-5 font-mono text-sm">
          <div>
            <p className="text-[10px] text-muted uppercase tracking-wider">Check-in</p>
            <p className="text-ivory">{fmtDate(booking.checkInDate)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted uppercase tracking-wider">Check-out</p>
            <p className="text-ivory">{fmtDate(booking.checkOutDate)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted uppercase tracking-wider">Rooms</p>
            <p className="text-ivory">{booking.roomsCount}</p>
          </div>
        </div>

        {children && <div className="mt-4 pt-4 border-t border-brass/10">{children}</div>}
      </div>

      <div className="keycard-stub w-24 shrink-0 flex flex-col items-center justify-center gap-1 px-2 bg-surface-raised/40">
        <p className="text-[9px] text-muted uppercase tracking-widest [writing-mode:vertical-rl] rotate-180 font-mono">
          {booking.room?.type || 'Room'}
        </p>
      </div>
    </div>
  )
}
