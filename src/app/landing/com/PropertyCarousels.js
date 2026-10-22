"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import PropertyCard from '@/components/PropertyCard';

export default function PropertyCarousels() {
  const [luxuryData, setLuxuryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLuxury = async () => {
      try {
        const res = await fetch('/api/admin/luxury-properties');
        const data = await res.json();
        if (data.success) {
          setLuxuryData(data.data.filter((p) => p.status === 'ACTIVE'));
        }
      } catch (err) {
        console.error('Failed to fetch luxury properties:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLuxury();
  }, []);

  const luxuryRef = useRef(null);

  const scroll = (ref, direction) => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!loading && luxuryData.length === 0) return null;

  return (
    <div className="bg-slate-50 font-sans py-12 overflow-hidden">

      {/* =========================================
          LUXURY PROPERTIES
          ========================================= */}
      <section className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 relative">

        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-slate-500 font-bold text-xs sm:text-sm tracking-[0.15em] uppercase mb-1.5 block">
              Luxury Living
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-[#0a1629]">
              Luxury Properties
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/allproject" className="border border-slate-200 hover:border-slate-300 text-slate-700 font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors bg-white">
              View All Properties
            </Link>
            <div className="hidden md:flex items-center gap-2">
              <button onClick={() => scroll(luxuryRef, 'left')} className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 hover:text-[#d9982b] transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => scroll(luxuryRef, 'right')} className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 hover:text-[#d9982b] transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <span className="text-sm">Loading luxury properties...</span>
          </div>
        ) : (
          <div className="relative group">
            <button onClick={() => scroll(luxuryRef, 'left')} className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white shadow-lg rounded-full hidden lg:group-hover:flex items-center justify-center text-slate-600 hover:text-[#d9982b]">
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div
              ref={luxuryRef}
              className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory py-4"
            >
              {luxuryData.map((property) => (
                <div key={property.id} className="min-w-[190px] md:min-w-[220px] snap-start shrink-0">
                  <PropertyCard property={property} id={property.property_id} />
                </div>
              ))}
            </div>

            <button onClick={() => scroll(luxuryRef, 'right')} className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white shadow-lg rounded-full hidden lg:group-hover:flex items-center justify-center text-slate-600 hover:text-[#d9982b]">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </section>

    </div>
  );
}
