"use client";

import Link from 'next/link';
import { MapPin, BedDouble, Bath, Heart, Building2 } from 'lucide-react';

// Compact, OYO-style listing card. Reused across the homepage, /allproject and
// category pages so every property listing looks consistent site-wide.
export default function PropertyCard({ property, id }) {
  const propertyId = id ?? property.id ?? property.property_id;

  return (
    <Link
      href={`/property/${propertyId}`}
      className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300 group block"
    >
      <div className="relative h-36 w-full overflow-hidden bg-slate-100">
        {property.image ? (
          <img
            src={property.image}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <Building2 className="w-8 h-8" />
          </div>
        )}

        <span className={`absolute top-2 left-2 text-white text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded shadow-sm ${
          property.listing_type === 'RENT' ? 'bg-[#d9982b]' : 'bg-emerald-600'
        }`}>
          {property.listing_type === 'RENT' ? 'For Rent' : 'For Sale'}
        </span>

        <button
          type="button"
          onClick={(e) => e.preventDefault()}
          className="absolute top-2 right-2 w-6 h-6 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors shadow-sm"
        >
          <Heart className="w-3 h-3" />
        </button>
      </div>

      <div className="p-3">
        <h3 className="text-[13px] font-bold text-[#0a1629] truncate mb-1 group-hover:text-[#d9982b] transition-colors">
          {property.title}
        </h3>

        <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-2">
          <MapPin className="w-3 h-3 text-[#d9982b] shrink-0" />
          <span className="truncate">{[property.location, property.city].filter(Boolean).join(', ') || 'Location not specified'}</span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <span className="text-sm font-extrabold text-[#0a1629] truncate">
            {property.price ? `₹${Number(property.price).toLocaleString('en-IN')}` : 'On Request'}
          </span>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold shrink-0 ml-2">
            <span className="flex items-center gap-0.5"><BedDouble className="w-3 h-3" /> {property.bedrooms ?? 0}</span>
            <span className="flex items-center gap-0.5"><Bath className="w-3 h-3" /> {property.bathrooms ?? 0}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
