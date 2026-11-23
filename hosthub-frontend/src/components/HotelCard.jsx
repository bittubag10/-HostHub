import { Link } from 'react-router-dom'
import { getPhotoUrl } from '../util/imageUrl'
import { Star, MapPin, Sparkles, Wifi, Waves, Car, Coffee, Wind } from 'lucide-react'

const AMENITY_ICONS = {
  wifi: Wifi,
  pool: Waves,
  parking: Car,
  breakfast: Coffee,
  ac: Wind,
}

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
      className="group bg-white border border-zinc-200/80 rounded-2xl overflow-hidden hover:shadow-card hover:border-zinc-300 transition-all duration-300 flex flex-col"
    >
      {/* 4:3 Aspect Ratio Image Frame */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
        {photo ? (
          <img
            src={photo}
            alt={hotel.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 text-xs gap-1.5">
            <Sparkles className="w-5 h-5 text-zinc-300" />
            <span>Curated Boutique Stay</span>
          </div>
        )}

        {/* Floating City Badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1 backdrop-blur-md bg-white/90 text-zinc-800 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm border border-white/40">
            <MapPin className="w-3 h-3 text-brand" />
            {hotel.city}
          </span>
        </div>

        {/* Floating Rating Badge */}
        <div className="absolute top-3 right-3">
          {reviewCount > 0 ? (
            <span className="inline-flex items-center gap-1 backdrop-blur-md bg-white/95 text-zinc-900 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm border border-white/40">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{avgRating.toFixed(1)}</span>
              <span className="text-zinc-400 font-normal">({reviewCount})</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 backdrop-blur-md bg-white/90 text-brand text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm border border-white/40">
              <Sparkles className="w-3 h-3" />
              <span>New</span>
            </span>
          )}
        </div>
      </div>

      {/* Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-display text-lg font-bold text-zinc-900 group-hover:text-brand transition-colors line-clamp-1">
            {hotel.name}
          </h3>

          <p className="text-xs text-zinc-500 mt-1 line-clamp-1">
            {hotel.contactInfo?.address || `${hotel.city}, India`}
          </p>

          {/* Amenities Chips */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {(hotel.amenities || []).slice(0, 3).map((a) => {
              const Icon = AMENITY_ICONS[a.toLowerCase()] || Sparkles
              return (
                <span
                  key={a}
                  className="inline-flex items-center gap-1 text-[11px] text-zinc-600 bg-stone-100/80 rounded-md px-2 py-0.5 border border-zinc-200/50"
                >
                  <Icon className="w-3 h-3 text-zinc-400" />
                  {a}
                </span>
              )
            })}
            {(hotel.amenities || []).length > 3 && (
              <span className="text-[10px] text-zinc-400 font-mono py-0.5 px-1 self-center">
                +{(hotel.amenities || []).length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Pricing Footer */}
        <div className="mt-4 pt-3 border-t border-zinc-100 flex items-baseline justify-between">
          <span className="text-xs text-zinc-500 font-medium">Starting from</span>
          <div className="text-right">
            <span className="font-display text-xl font-bold text-zinc-900">
              ₹{Math.round(price).toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-zinc-500 ml-1 font-normal">/ night</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
