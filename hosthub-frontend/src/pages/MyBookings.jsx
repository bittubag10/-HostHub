import { useEffect, useState } from 'react'
import api from '../api/axios'
import KeyCard from '../components/KeyCard'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import ErrorBanner from '../components/ErrorBanner'
import { Link } from 'react-router-dom'
import {
  Star,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  X,
  CreditCard,
  ArrowRight
} from 'lucide-react'

const CANCELLABLE = ['RESERVED', 'GUESTS_ADDED', 'PAYMENT_PENDING']

export default function MyBookings() {
  const [bookings, setBookings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)

  // Cancel Confirmation Modal state
  const [confirmCancelId, setConfirmCancelId] = useState(null)

  // Review states
  const [reviewingBookingId, setReviewingBookingId] = useState(null)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [reviewSubmitting, setReviewSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState(null)
  const [reviewedBookingIds, setReviewedBookingIds] = useState(new Set())

  const load = () => {
    setLoading(true)
    api
      .get('/users/myBookings')
      .then((res) => setBookings(res.data))
      .catch(setError)
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const cancel = async (id) => {
    setBusyId(id)
    setConfirmCancelId(null)
    try {
      await api.post(`/bookings/${id}/cancel`)
      load()
    } catch (err) {
      setError(err)
    } finally {
      setBusyId(null)
    }
  }

  const submitReview = async (e, booking) => {
    e.preventDefault()
    setReviewSubmitting(true)
    setReviewError(null)
    try {
      await api.post(`/hotels/${booking.hotel.id}/reviews`, {
        bookingId: booking.id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      })
      setReviewedBookingIds((prev) => new Set([...prev, booking.id]))
      setReviewingBookingId(null)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to submit review'
      setReviewError(msg)
    } finally {
      setReviewSubmitting(false)
    }
  }

  if (loading) return <Spinner label="Retrieving your boutique reservations" />

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-zinc-900 tracking-tight">
          My Bookings & Stays
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Review upcoming stays, manage reservations, and share verified reviews.
        </p>
      </div>

      {error && <ErrorBanner error={error} />}

      {bookings?.length === 0 && (
        <EmptyState
          title="No reservations found"
          subtitle="You haven't reserved any boutique properties yet. Explore our curated portfolio to find your next stay."
          action={
            <Link to="/" className="btn-primary text-xs px-5 py-2.5 rounded-xl">
              Explore Destinations
            </Link>
          }
        />
      )}

      <div className="space-y-6">
        {bookings?.map((b) => (
          <KeyCard key={b.id} booking={b}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Left action links */}
              <div className="flex items-center gap-3">
                {CANCELLABLE.includes(b.bookingStatus) && (
                  <button
                    onClick={() => setConfirmCancelId(b.id)}
                    disabled={busyId === b.id}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors"
                  >
                    Cancel hold
                  </button>
                )}

                {['RESERVED', 'GUESTS_ADDED'].includes(b.bookingStatus) && (
                  <Link
                    to={`/bookings/${b.id}/guests`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                  >
                    Complete reservation details
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}

                {b.bookingStatus === 'EXPIRED' && (
                  <span className="text-xs text-zinc-400 italic font-mono">
                    Hold expired & room released
                  </span>
                )}
              </div>

              {/* Right Review trigger */}
              {b.bookingStatus === 'CONFIRMED' && (
                <div>
                  {reviewedBookingIds.has(b.id) ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Review Submitted
                    </span>
                  ) : reviewingBookingId === b.id ? null : (
                    <button
                      onClick={() => {
                        setReviewingBookingId(b.id)
                        setReviewForm({ rating: 5, comment: '' })
                        setReviewError(null)
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:text-brand-800 transition-colors bg-brand-50 px-3 py-1.5 rounded-full border border-brand-200/60"
                    >
                      <Star className="w-3.5 h-3.5 fill-brand text-brand" />
                      Write a Guest Review
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Sleek Inline Review Drawer */}
            {reviewingBookingId === b.id && (
              <form
                onSubmit={(e) => submitReview(e, b)}
                className="mt-4 bg-stone-50 border border-zinc-200 rounded-2xl p-5 space-y-4 animate-in fade-in duration-150"
              >
                <div className="flex items-center justify-between border-b border-zinc-200/60 pb-3">
                  <div>
                    <h4 className="font-display text-sm font-bold text-zinc-900">
                      Rate your stay at {b.hotel?.name}
                    </h4>
                    <p className="text-[11px] text-zinc-500">
                      Your verified review will be displayed publicly on this hotel's profile.
                    </p>
                  </div>

                  <div className="flex gap-1 text-xl">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        className={`transition-colors p-0.5 ${
                          star <= reviewForm.rating
                            ? 'text-amber-400'
                            : 'text-zinc-300 hover:text-zinc-400'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  rows={3}
                  maxLength={1000}
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  placeholder="Share details of your experience, staff hospitality, and room comfort..."
                  className="w-full bg-white border border-zinc-200 rounded-xl p-3 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand shadow-sm"
                />

                {reviewError && (
                  <p className="text-xs text-rose-600 font-medium">{reviewError}</p>
                )}

                <div className="flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setReviewingBookingId(null)
                      setReviewError(null)
                    }}
                    className="btn-secondary text-xs px-3.5 py-1.5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="btn-primary text-xs px-4 py-1.5 rounded-lg"
                  >
                    {reviewSubmitting ? 'Submitting…' : 'Publish Review'}
                  </button>
                </div>
              </form>
            )}
          </KeyCard>
        ))}
      </div>

      {/* Cancel Confirmation Modal */}
      {confirmCancelId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-zinc-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-display text-lg font-bold text-zinc-900">
                Cancel this reservation?
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                Your temporary inventory hold will be released immediately and made available to other travelers.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmCancelId(null)}
                className="btn-secondary text-xs flex-1 py-2"
              >
                Keep Reservation
              </button>
              <button
                type="button"
                onClick={() => cancel(confirmCancelId)}
                className="bg-rose-600 text-white font-medium text-xs px-4 py-2 rounded-lg hover:bg-rose-700 flex-1 transition-colors"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
