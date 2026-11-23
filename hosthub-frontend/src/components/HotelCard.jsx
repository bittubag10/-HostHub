import { Link } from 'react-router-dom'
import { getPhotoUrl } from '../util/imageUrl'

export default function HotelCard({ hotelPriceDto, searchParams }) {
  const hotel = hotelPriceDto.hotel
  const price = hotelPriceDto.price
  const rawPhoto = hotel?.photo?.[0] || hotel?.photos?.[0]
  const photo = getPhotoUrl(rawPhoto)
  const avgRating = hotel?.averageRating || hotelPriceDto?.averageRating || 0
  const reviewCount = hotel?.reviewCount || hotelPriceDto?.reviewCount || 0

  return (
    <Link
      to={`/hotels/${hotel.id}`}
      state={{ searchParams }}
      className="group flex gap-5 bg-surface/60 border border-brass/10 rounded-lg p-4 hover:border-brass/40 transition-colors"
    >
      <div className="w-40 h-32 shrink-0 rounded-md overflow-hidden bg-surface-raised">
        {photo ? (
          <img src={photo} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted text-xs">No photo</div>
        )}
      </div>

      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-lg text-ivory">{hotel.name}</h3>
            {reviewCount > 0 ? (
              <span className="inline-flex items-center gap-1 text-xs text-brass-light font-medium shrink-0">
                ★ {avgRating.toFixed(1)} <span className="text-muted">({reviewCount})</span>
              </span>
            ) : (
              <span className="text-xs text-muted/70 shrink-0">★ New</span>
            )}
          </div>
          <p className="text-sm text-muted">{hotel.city}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {(hotel.amenities || []).slice(0, 4).map((a) => (
              <span key={a} className="text-[10px] uppercase tracking-wide text-brass-light/80 border border-brass/20 rounded-full px-2 py-0.5">
                {a}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-end justify-between mt-3">
          <span className="text-xs text-muted">per room / night</span>
          <span className="font-mono text-xl text-brass-light">₹{Math.round(price).toLocaleString('en-IN')}</span>
        </div>
      </div>
    </Link>
  )
}
