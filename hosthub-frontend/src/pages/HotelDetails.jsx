import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'
import Spinner from '../components/Spinner'
import ErrorBanner from '../components/ErrorBanner'
import { useAuthStore } from '../store/auth'
import { getPhotoUrl } from '../util/imageUrl'
import {
  MapPin,
  Star,
  Sparkles,
  Users,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Wifi,
  Waves,
  Car,
  Coffee,
  Wind,
  Phone,
  Mail,
  CheckCircle2,
  Image as ImageIcon
} from 'lucide-react'

const todayStr = () => new Date().toISOString().split('T')[0]

const AMENITY_ICONS = {
  wifi: Wifi,
  pool: Waves,
  ac: Wind,
  parking: Car,
  breakfast: Coffee,
}

export default function HotelDetails() {
  const { hotelId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const [info, setInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [booking, setBooking] = useState(false)

  // Lightbox Modal state
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  // Review states
  const [reviews, setReviews] = useState([])
  const [reviewPage, setReviewPage] = useState(0)
  const [reviewTotalPages, setReviewTotalPages] = useState(0)
  const [loadingReviews, setLoadingReviews] = useState(false)

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

  useEffect(() => {
    let active = true
    setLoadingReviews(true)
    api
      .get(`/hotels/${hotelId}/reviews?page=${reviewPage}&size=5`)
      .then((res) => {
        if (active && res.data) {
          setReviews(res.data.content || [])
          setReviewTotalPages(res.data.totalPages || 0)
        }
      })
      .catch(() => {})
      .finally(() => active && setLoadingReviews(false))
    return () => {
      active = false
    }
  }, [hotelId, reviewPage])

  const startBooking = async (room) => {
    if (!user) {
      navigate('/login', { state: { from: location } })
      return
    }
    if (!dates.checkOutDate) {
      setError({ message: 'Please select a check-out date first.' })
      return
    }
    setError(null)
    setBooking(true)
    try {
      const idempotencyKey = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

      const res = await api.post(
        '/bookings/init',
        {
          hotelId: Number(hotelId),
          roomId: room.id,
          checkInDate: dates.checkInDate,
          checkOutDate: dates.checkOutDate,
          roomCount: Number(dates.roomCount),
        },
        {
          headers: { 'Idempotency-Key': idempotencyKey },
        }
      )
      navigate(`/bookings/${res.data.id}/guests`)
    } catch (err) {
      setError(err)
    } finally {
      setBooking(false)
    }
  }

  if (loading) return <Spinner label="Loading boutique hotel experience" />
  if (error && !info) return <div className="max-w-4xl mx-auto px-6 py-12"><ErrorBanner error={error} /></div>
  if (!info) return null

  const { hotel, rooms } = info
  const allPhotos = (hotel.photo || hotel.photos || []).map(getPhotoUrl)

  // Calculate nights
  const nights = dates.checkInDate && dates.checkOutDate
    ? Math.max(1, Math.round((new Date(dates.checkOutDate) - new Date(dates.checkInDate)) / (1000 * 60 * 60 * 24)))
    : 1

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header Info */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight">
            {hotel.name}
          </h1>

          <div className="flex items-center gap-3">
            {hotel.reviewCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand text-xs font-semibold">
                <Star className="w-3.5 h-3.5 fill-brand text-brand" />
                <span>{Number(hotel.averageRating || 0).toFixed(1)}</span>
                <span className="text-zinc-500 font-normal">({hotel.reviewCount} reviews)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-stone-100 text-zinc-600 text-xs font-medium border border-zinc-200">
                <Sparkles className="w-3 h-3 text-brand" />
                New Property
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1 font-medium text-zinc-700">
            <MapPin className="w-3.5 h-3.5 text-brand" />
            {hotel.city}, {hotel.contactInfo?.address || 'India'}
          </span>
          {hotel.contactInfo?.email && (
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-zinc-400" />
              {hotel.contactInfo.email}
            </span>
          )}
          {hotel.contactInfo?.phoneNumber && (
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-zinc-400" />
              {hotel.contactInfo.phoneNumber}
            </span>
          )}
        </div>
      </div>

      {/* Editorial Photo Gallery Grid */}
      <div className="relative rounded-3xl overflow-hidden shadow-card border border-zinc-200">
        {allPhotos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[380px] sm:h-[460px]">
            {/* Primary Hero Photo */}
            <div
              onClick={() => { setLightboxIndex(0); setLightboxOpen(true); }}
              className="md:col-span-2 relative h-full cursor-pointer overflow-hidden group bg-stone-100"
            >
              <img
                src={allPhotos[0]}
                alt={hotel.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* Secondary Thumbnails */}
            <div className="hidden md:grid md:col-span-2 grid-cols-2 gap-2 h-full">
              {[1, 2, 3, 4].map((idx) => {
                const photoSrc = allPhotos[idx] || allPhotos[0]
                return (
                  <div
                    key={idx}
                    onClick={() => { setLightboxIndex(idx < allPhotos.length ? idx : 0); setLightboxOpen(true); }}
                    className="relative cursor-pointer overflow-hidden group bg-stone-100 h-full"
                  >
                    <img
                      src={photoSrc}
                      alt={`${hotel.name} - view ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )
              })}
            </div>

            {/* View All Photos Button */}
            <button
              onClick={() => { setLightboxIndex(0); setLightboxOpen(true); }}
              className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md text-zinc-900 border border-zinc-200 rounded-xl px-4 py-2 text-xs font-semibold shadow-md hover:bg-white transition-all flex items-center gap-2"
            >
              <ImageIcon className="w-4 h-4 text-brand" />
              <span>View all {allPhotos.length} photos</span>
            </button>
          </div>
        ) : (
          <div className="h-72 bg-stone-100 flex flex-col items-center justify-center text-zinc-400 text-sm gap-2">
            <Sparkles className="w-8 h-8 text-brand/40" />
            <p>Boutique property images coming soon</p>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && allPhotos.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-5 right-5 text-white/80 hover:text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <button
            onClick={() => setLightboxIndex((prev) => (prev > 0 ? prev - 1 : allPhotos.length - 1))}
            className="absolute left-5 text-white/80 hover:text-white p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="max-w-4xl max-h-[85vh] flex flex-col items-center">
            <img
              src={allPhotos[lightboxIndex]}
              alt={`Photo ${lightboxIndex + 1}`}
              className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl"
            />
            <p className="text-white/60 text-xs mt-3 font-mono">
              Photo {lightboxIndex + 1} of {allPhotos.length}
            </p>
          </div>

          <button
            onClick={() => setLightboxIndex((prev) => (prev < allPhotos.length - 1 ? prev + 1 : 0))}
            className="absolute right-5 text-white/80 hover:text-white p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}

      {error && <ErrorBanner error={error} />}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Left Column (Details, Rooms, Reviews) */}
        <div className="lg:col-span-2 space-y-12">
          {/* Amenities Grid */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="font-display text-xl font-bold text-zinc-900">
              Curated Amenities & Highlights
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              {(hotel.amenities || []).map((amenity) => {
                const Icon = AMENITY_ICONS[amenity.toLowerCase()] || CheckCircle2
                return (
                  <div
                    key={amenity}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-50 border border-zinc-200/60"
                  >
                    <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium text-zinc-800">{amenity}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Rooms List */}
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-zinc-900">
                Available Rooms & Suites
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Prices include all taxes and verified boutique concierge services.
              </p>
            </div>

            <div className="space-y-4">
              {rooms.map((room) => {
                const roomPhoto = room.photo?.[0] || room.photos?.[0]
                return (
                  <div
                    key={room.id}
                    className="bg-white border border-zinc-200 rounded-2xl overflow-hidden p-4 sm:p-5 flex flex-col sm:flex-row gap-5 shadow-sm hover:shadow-card hover:border-zinc-300 transition-all"
                  >
                    {/* Room Thumbnail */}
                    <div className="w-full sm:w-44 h-36 shrink-0 rounded-xl overflow-hidden bg-stone-100">
                      {roomPhoto ? (
                        <img
                          src={getPhotoUrl(roomPhoto)}
                          alt={room.type}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs">
                          No room photo
                        </div>
                      )}
                    </div>

                    {/* Room Details */}
                    <div className="flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-display text-lg font-bold text-zinc-900">
                            {room.type}
                          </h3>
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-600 bg-stone-100 px-2.5 py-0.5 rounded-full border border-zinc-200">
                            <Users className="w-3 h-3 text-brand" />
                            Sleeps {room.capacity}
                          </span>
                        </div>

                        {/* Room Amenities */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {(room.amenities || []).map((a) => (
                            <span
                              key={a}
                              className="text-[10px] text-zinc-600 bg-stone-50 border border-zinc-200 rounded px-2 py-0.5 font-mono"
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Pricing & CTA */}
                      <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                        <div>
                          <span className="font-display text-xl font-bold text-zinc-900">
                            ₹{Number(room.basePrice).toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs text-zinc-500 ml-1">/ night</span>
                        </div>
                        <button
                          onClick={() => startBooking(room)}
                          disabled={booking}
                          className="btn-primary text-xs px-5 py-2 rounded-xl"
                        >
                          {booking ? 'Reserving…' : 'Book this room'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Guest Reviews Section */}
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-zinc-900">
                  Guest Reviews
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Verified stays from authenticated travelers
                </p>
              </div>

              {hotel.reviewCount > 0 && (
                <div className="flex items-center gap-2">
                  <span className="font-display text-2xl font-extrabold text-zinc-900">
                    {Number(hotel.averageRating || 0).toFixed(1)}
                  </span>
                  <div className="text-left text-xs text-zinc-500 leading-tight">
                    <div className="flex text-amber-400">
                      {'★'.repeat(Math.round(hotel.averageRating || 5))}
                    </div>
                    <span>{hotel.reviewCount} verified ratings</span>
                  </div>
                </div>
              )}
            </div>

            {loadingReviews && <p className="text-xs text-zinc-400">Loading reviews…</p>}

            {!loadingReviews && reviews.length === 0 && (
              <p className="text-sm text-zinc-500 text-center py-6 bg-stone-50 rounded-2xl border border-zinc-200/60">
                No reviews yet. Be the first verified traveler to review this stay!
              </p>
            )}

            <div className="space-y-4">
              {reviews.map((rev) => (
                <div key={rev.id} className="p-4 rounded-2xl bg-stone-50 border border-zinc-200/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-brand-100 text-brand font-bold text-xs flex items-center justify-center">
                        {rev.userName ? rev.userName[0].toUpperCase() : 'G'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-800">{rev.userName || 'Verified Guest'}</p>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                        </span>
                      </div>
                    </div>
                    <div className="text-amber-400 text-xs font-mono">
                      {'★'.repeat(rev.rating)}
                    </div>
                  </div>
                  {rev.comment && <p className="text-xs text-zinc-600 leading-relaxed pl-10">{rev.comment}</p>}
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {reviewTotalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-4 text-xs">
                <button
                  onClick={() => setReviewPage((p) => Math.max(0, p - 1))}
                  disabled={reviewPage === 0}
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  Previous
                </button>
                <span className="text-zinc-500 font-mono">
                  Page {reviewPage + 1} of {reviewTotalPages}
                </span>
                <button
                  onClick={() => setReviewPage((p) => Math.min(reviewTotalPages - 1, p + 1))}
                  disabled={reviewPage >= reviewTotalPages - 1}
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sticky Reservation Summary Card */}
        <div className="lg:col-span-1 sticky top-24">
          <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-floating space-y-5">
            <div>
              <p className="text-[10px] uppercase font-bold text-zinc-400 font-mono tracking-wider">
                Select Stay Dates
              </p>
              <h3 className="font-display text-lg font-bold text-zinc-900 mt-1">
                Reserve Your Suite
              </h3>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Check-in</label>
                <input
                  type="date"
                  value={dates.checkInDate}
                  onChange={(e) => setDates({ ...dates, checkInDate: e.target.value })}
                  className="input text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Check-out</label>
                <input
                  type="date"
                  value={dates.checkOutDate}
                  onChange={(e) => setDates({ ...dates, checkOutDate: e.target.value })}
                  className="input text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">Rooms count</label>
                <input
                  type="number"
                  min={1}
                  value={dates.roomCount}
                  onChange={(e) => setDates({ ...dates, roomCount: e.target.value })}
                  className="input text-xs font-mono"
                />
              </div>
            </div>

            <div className="border-t border-zinc-100 pt-4 space-y-2 text-xs text-zinc-600">
              <div className="flex justify-between">
                <span>Duration</span>
                <span className="font-mono font-medium text-zinc-800">{nights} {nights === 1 ? 'night' : 'nights'}</span>
              </div>
              <div className="flex justify-between">
                <span>Reservation hold</span>
                <span className="text-brand font-medium">15 mins guaranteed</span>
              </div>
              <div className="flex justify-between">
                <span>Cancellation policy</span>
                <span className="text-zinc-700">Flexible refund</span>
              </div>
            </div>

            <div className="bg-stone-50 border border-zinc-200/60 rounded-2xl p-3 flex items-center gap-2.5 text-xs text-zinc-600">
              <ShieldCheck className="w-4 h-4 text-brand shrink-0" />
              <span>Pessimistic inventory locking prevents double-booking.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
