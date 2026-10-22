"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2 } from 'lucide-react';
import PropertyCard from '@/components/PropertyCard';

export default function FeaturedProperties() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await fetch('/api/admin/featured-properties');
        const data = await res.json();
        if (data.success) {
          setProperties(data.data.filter((p) => p.status === 'ACTIVE'));
        }
      } catch (err) {
        console.error('Failed to fetch featured properties:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  if (!loading && properties.length === 0) return null;

  return (
    <section className="py-12 bg-slate-50 font-sans">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-6">
          <div className="max-w-xl">
            <span className="text-slate-500 font-bold text-xs sm:text-sm tracking-[0.15em] uppercase mb-1.5 block">
              Handpicked for you
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-[#0a1629]">
              Latest Featured Properties
            </h2>
          </div>
          <Link href="/allproject" className="hidden md:flex items-center gap-2 text-[#d9982b] hover:text-[#b87d1c] font-semibold text-sm transition-colors">
            View All Properties <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <span className="text-sm">Loading properties...</span>
          </div>
        ) : (
          <>
            {/* Property Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} id={property.property_id} />
              ))}
            </div>

            {/* Mobile View All Button */}
            <Link href="/allproject" className="w-full mt-8 md:hidden flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-[#0a1629] py-3 rounded-xl font-semibold transition-colors text-sm">
              View All Properties <ArrowRight className="w-4 h-4" />
            </Link>
          </>
        )}

      </div>
    </section>
  );
}
