"use client";

import Link from 'next/link';
import { MapPin, Star, Hotel } from 'lucide-react';

// Listing card for a hotel. `query` (e.g. "check_in=...&check_out=...") is carried to the
// detail page so the chosen dates stay selected.
export default function HotelCard({ hotel, query = '' }) {
  return (
    <Link
      href={`/hotels/${hotel.id}${query ? `?${query}` : ''}`}
      className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300 group block"
    >
      <div className="relative h-28 sm:h-44 w-full overflow-hidden bg-slate-100">
        {hotel.image ? (
          <img
            src={hotel.image}
            alt={hotel.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <Hotel className="w-8 h-8" />
          </div>
        )}

        <span className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-emerald-700 text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-wide px-1.5 sm:px-2 py-0.5 rounded shadow-sm max-w-[70%] truncate">
          {hotel.hotel_type_name || 'Hotel'}
        </span>
        {hotel.star_rating ? (
          <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-white/95 text-[#0a1629] text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-0.5 shadow-sm">
            {hotel.star_rating} <Star className="w-3 h-3 fill-[#d9982b] text-[#d9982b]" />
          </span>
        ) : null}
      </div>

      <div className="p-2.5 sm:p-3.5">
        <h3 className="text-[13px] sm:text-sm font-bold text-[#0a1629] truncate mb-1 group-hover:text-emerald-700 transition-colors">
          {hotel.name}
        </h3>

        <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-500 mb-2 sm:mb-3">
          <MapPin className="w-3.5 h-3.5 text-[#d9982b] shrink-0" />
          <span className="truncate">{[hotel.address, hotel.city].filter(Boolean).join(', ') || 'Location not specified'}</span>
        </div>

        <div className="flex items-end justify-between pt-2.5 border-t border-slate-100">
          <div>
            <span className="text-[10px] text-slate-400 block leading-none mb-0.5">Starting from</span>
            <span className="text-sm sm:text-base font-extrabold text-[#0a1629]">
              {hotel.min_price ? `₹${Number(hotel.min_price).toLocaleString('en-IN')}` : '—'}
            </span>
            <span className="text-[11px] text-slate-500"> / night</span>
          </div>
          <span className="hidden sm:inline text-xs font-semibold text-emerald-700 group-hover:underline">View rooms</span>
        </div>
      </div>
    </Link>
  );
}
