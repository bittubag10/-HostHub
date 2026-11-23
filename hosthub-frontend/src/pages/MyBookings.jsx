import { useEffect, useState } from 'react'
import api from '../api/axios'
import KeyCard from '../components/KeyCard'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'
import ErrorBanner from '../components/ErrorBanner'
import { Link } from 'react-router-dom'

const CANCELLABLE = ['RESERVED', 'GUESTS_ADDED', 'PAYMENT_PENDING']

export default function MyBookings() {
  const [bookings, setBookings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busyId, setBusyId] = useState(null)

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

  if (loading) return <Spinner label="Fetching your stays" />

  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <h1 className="font-display text-3xl text-ivory mb-8">My Bookings</h1>
      {error && <div className="mb-5"><ErrorBanner error={error} /></div>}

      {bookings?.length === 0 && (
        <EmptyState
          title="No bookings yet"
          subtitle="Once you book a stay, your confirmation ticket shows up here."
          action={
            <Link to="/" className="bg-brass text-ink font-medium px-5 py-2 rounded-md">
              Find a place to stay
            </Link>
          }
        />
      )}

      <div className="space-y-5">
        {bookings?.map((b) => (
          <KeyCard key={b.id} booking={b}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-3">
                {CANCELLABLE.includes(b.bookingStatus) && (
                  <button
                    onClick={() => cancel(b.id)}
                    disabled={busyId === b.id}
                    className="text-danger text-xs hover:underline disabled:opacity-50"
                  >
                    {busyId === b.id ? 'Cancelling…' : 'Cancel booking'}
                  </button>
                )}
                {['RESERVED', 'GUESTS_ADDED'].includes(b.bookingStatus) && (
                  <Link to={`/bookings/${b.id}/guests`} className="text-brass-light text-xs hover:underline">
                    Continue booking
                  </Link>
                )}
              </div>

              {b.bookingStatus === 'CONFIRMED' && (
                <div>
                  {reviewedBookingIds.has(b.id) ? (
                    <span className="text-xs text-success font-medium">✓ Review submitted</span>
                  ) : reviewingBookingId === b.id ? null : (
                    <button
                      onClick={() => {
                        setReviewingBookingId(b.id)
                        setReviewForm({ rating: 5, comment: '' })
                        setReviewError(null)
                      }}
                      className="text-brass-light text-xs hover:underline flex items-center gap-1"
                    >
                      ★ Write a Review
                    </button>
                  )}
                </div>
              )}
            </div>

            {reviewingBookingId === b.id && (
              <form onSubmit={(e) => submitReview(e, b)} className="mt-4 bg-surface-raised/60 border border-brass/20 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-ivory">Rate your stay at {b.hotel?.name}:</span>
                  <div className="flex gap-1 text-lg">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                        className={`transition-colors ${star <= reviewForm.rating ? 'text-brass-light' : 'text-muted/30'}`}
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
                  placeholder="Share details of your experience (optional)..."
                  className="w-full bg-surface border border-brass/15 rounded p-2 text-xs text-ivory placeholder-muted focus:outline-none focus:border-brass"
                />
                {reviewError && <p className="text-xs text-danger">{reviewError}</p>}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setReviewingBookingId(null)
                      setReviewError(null)
                    }}
                    className="px-3 py-1 rounded text-xs text-muted hover:text-ivory"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="px-3 py-1 bg-brass text-ink font-medium rounded text-xs hover:bg-brass-light disabled:opacity-50"
                  >
                    {reviewSubmitting ? 'Submitting…' : 'Submit Review'}
                  </button>
                </div>
              </form>
            )}
          </KeyCard>
        ))}
      </div>
    </div>
  )
}
