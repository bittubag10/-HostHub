import { Link, useSearchParams } from 'react-router-dom'

export default function PaymentResult({ status }) {
  const [params] = useSearchParams()
  const bookingId = params.get('bookingId')
  const isSuccess = status === 'success'

  return (
    <div className="max-w-md mx-auto px-6 py-24 text-center">
      <div className={`h-14 w-14 rounded-full mx-auto flex items-center justify-center border ${
        isSuccess ? 'border-success text-success' : 'border-danger text-danger'
      }`}>
        <span className="text-2xl">{isSuccess ? '✓' : '✕'}</span>
      </div>
      <h1 className="font-display text-2xl text-ivory mt-5">
        {isSuccess ? 'Payment received' : 'Payment not completed'}
      </h1>
      <p className="text-muted text-sm mt-2">
        {isSuccess
          ? 'Stripe has confirmed your payment. Your booking status will update within a few seconds once our webhook processes it.'
          : 'The checkout was cancelled or failed. Your booking has not been charged — you can retry payment from My Bookings.'}
      </p>
      {bookingId && <p className="text-xs text-muted font-mono mt-3">Booking #{bookingId}</p>}
      <Link
        to="/my-bookings"
        className="inline-block mt-6 bg-brass text-ink font-medium px-5 py-2.5 rounded-md hover:bg-brass-light transition-colors"
      >
        View my bookings
      </Link>
    </div>
  )
}
