import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, AlertCircle, ArrowRight, Calendar, Sparkles } from 'lucide-react'

export default function PaymentResult({ status }) {
  const [params] = useSearchParams()
  const bookingId = params.get('bookingId')
  const isSuccess = status === 'success'

  return (
    <div className="max-w-lg mx-auto px-6 py-20">
      <div className="bg-white border border-zinc-200 rounded-3xl p-8 sm:p-10 shadow-card text-center space-y-6">
        <div
          className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
            isSuccess
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              : 'bg-rose-50 text-rose-600 border border-rose-200'
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 className="w-8 h-8" />
          ) : (
            <AlertCircle className="w-8 h-8" />
          )}
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold text-zinc-400 font-mono tracking-wider">
            Stripe Checkout Response
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-zinc-900 mt-1">
            {isSuccess ? 'Reservation Confirmed!' : 'Payment Incomplete'}
          </h1>
          <p className="text-sm text-zinc-600 mt-2 leading-relaxed">
            {isSuccess
              ? 'Your payment was successfully authorized. An async email receipt is being dispatched and your room hold is converted to a confirmed reservation.'
              : 'The checkout session was cancelled or declined. Your temporary room hold will expire safely unless payment is re-attempted.'}
          </p>
        </div>

        {bookingId && (
          <div className="inline-block px-3 py-1 bg-stone-100 rounded-lg text-xs font-mono text-zinc-600 border border-zinc-200">
            Booking Reference #{bookingId}
          </div>
        )}

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/my-bookings"
            className="btn-primary text-xs px-6 py-2.5 rounded-xl w-full sm:w-auto"
          >
            <Calendar className="w-4 h-4" />
            <span>Go to My Bookings</span>
          </Link>
          <Link
            to="/"
            className="btn-secondary text-xs px-5 py-2.5 rounded-xl w-full sm:w-auto"
          >
            <span>Back to Discovery</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
