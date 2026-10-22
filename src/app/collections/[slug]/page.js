"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HotelCard from '@/components/HotelCard';
import { Loader2, Hotel } from 'lucide-react';

// "View all" page for a home page section: every live hotel the admin put in it
export default function CollectionPage() {
  const { slug } = useParams();
  const [section, setSection] = useState(null);
  const [state, setState] = useState('loading'); // loading | ready | missing

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/home-sections/${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setSection(d.data);
          setState('ready');
        } else setState('missing');
      })
      .catch(() => setState('missing'));
  }, [slug]);

  return (
    <main className="min-h-screen bg-slate-50 font-sans">
      <Navbar />

      {state === 'loading' ? (
        <div className="flex flex-col items-center py-32 text-slate-400">
          <Loader2 className="w-7 h-7 animate-spin mb-2" /> Loading...
        </div>
      ) : state === 'missing' ? (
        <div className="flex flex-col items-center text-center py-32 px-4">
          <Hotel className="w-12 h-12 text-slate-300 mb-4" />
          <h1 className="text-xl font-bold text-[#0a1629] mb-2">Collection not found</h1>
          <p className="text-sm text-slate-500 mb-6">This collection may have been removed.</p>
          <Link href="/hotels" className="bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold px-6 py-3 rounded-lg">Browse all stays</Link>
        </div>
      ) : (
        <>
          <section className="bg-[#0f2a1d] text-white">
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <nav className="text-xs text-white/60 mb-2">
                <Link href="/" className="hover:underline">Home</Link> / <span className="text-white/90">{section.title}</span>
              </nav>
              <h1 className="text-2xl md:text-3xl font-bold">{section.title}</h1>
              {section.subtitle && <p className="text-white/70 text-sm mt-1">{section.subtitle}</p>}
            </div>
          </section>

          <section className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-sm text-slate-500 mb-5">{section.hotels.length} stay{section.hotels.length === 1 ? '' : 's'}</p>
            {section.hotels.length === 0 ? (
              <div className="flex flex-col items-center text-center py-20 bg-white rounded-xl border border-slate-200">
                <Hotel className="w-10 h-10 text-slate-300 mb-3" />
                <p className="text-sm text-slate-500">No stays in this collection right now.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                {section.hotels.map((h) => <HotelCard key={h.id} hotel={h} />)}
              </div>
            )}
          </section>
        </>
      )}

      <Footer />
    </main>
  );
}
