"use client";

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HotelCard from '@/components/HotelCard';
import { dayFromToday, addDays } from '@/lib/dates';
import { Search, Loader2, Hotel, ChevronLeft, ChevronRight, CalendarDays, Users } from 'lucide-react';

const PRICE_OPTIONS = [
  { label: 'Any price', min: '', max: '' },
  { label: 'Under ₹1,500', min: '', max: '1500' },
  { label: '₹1,500 – ₹3,000', min: '1500', max: '3000' },
  { label: '₹3,000 – ₹6,000', min: '3000', max: '6000' },
  { label: 'Above ₹6,000', min: '6000', max: '' },
];

function HotelsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramsKey = searchParams.toString();

  // Form state mirrors the URL; the URL is the source of truth for the results.
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [checkIn, setCheckIn] = useState(searchParams.get('check_in') || '');
  const [checkOut, setCheckOut] = useState(searchParams.get('check_out') || '');
  const [guests, setGuests] = useState(searchParams.get('guests') || '2');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [priceIndex, setPriceIndex] = useState(() => {
    const i = PRICE_OPTIONS.findIndex((p) => p.min === (searchParams.get('min_price') || '') && p.max === (searchParams.get('max_price') || ''));
    return i < 0 ? 0 : i;
  });
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');

  const [stayTypes, setStayTypes] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/stay-types').then((r) => r.json()).then((d) => d.success && setStayTypes(d.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/hotels?${paramsKey}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Could not load hotels');
        setHotels(data.data);
        setPagination(data.pagination);
      } catch (err) {
        setError(err.message);
        setHotels([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [paramsKey]);

  const search = (page = 1) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (checkIn && checkOut) {
      params.set('check_in', checkIn);
      params.set('check_out', checkOut);
    }
    if (guests) params.set('guests', guests);
    if (type) params.set('type', type);
    const price = PRICE_OPTIONS[priceIndex];
    if (price.min) params.set('min_price', price.min);
    if (price.max) params.set('max_price', price.max);
    if (sort !== 'newest') params.set('sort', sort);
    if (page > 1) params.set('page', String(page));
    router.push(`/hotels?${params.toString()}`);
  };

  // Dates + guests travel to the detail page
  const stayQuery = new URLSearchParams(
    Object.fromEntries(['check_in', 'check_out', 'guests'].filter((k) => searchParams.get(k)).map((k) => [k, searchParams.get(k)]))
  ).toString();

  const inputCls = 'w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:bg-white';

  return (
    <main className="min-h-screen bg-slate-50 font-sans">
      <Navbar />

      <section className="bg-[#0f2a1d] text-white">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Hotels, Resorts & Eco Stays</h1>
          <p className="text-white/70 text-sm mb-6">Pick your dates to see only the stays with rooms available.</p>

          <form
            onSubmit={(e) => { e.preventDefault(); search(1); }}
            className="bg-white rounded-xl p-3 grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr_0.7fr_auto] gap-2 text-slate-800"
          >
            <div className="col-span-2 md:col-span-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="City, place or hotel name" className={`${inputCls} pl-9`} />
            </div>
            <label className="relative">
              <span className="sr-only">Check-in</span>
              <input
                type="date"
                value={checkIn}
                min={dayFromToday()}
                onChange={(e) => {
                  setCheckIn(e.target.value);
                  if (!checkOut || checkOut <= e.target.value) setCheckOut(addDays(e.target.value, 1));
                }}
                className={inputCls}
                aria-label="Check-in"
              />
            </label>
            <label>
              <span className="sr-only">Check-out</span>
              <input
                type="date"
                value={checkOut}
                min={checkIn ? addDays(checkIn, 1) : dayFromToday(1)}
                onChange={(e) => setCheckOut(e.target.value)}
                className={inputCls}
                aria-label="Check-out"
              />
            </label>
            <label className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="number" min="1" max="20" value={guests} onChange={(e) => setGuests(e.target.value)} className={`${inputCls} pl-9`} aria-label="Guests" />
            </label>
            <button type="submit" className="col-span-2 md:col-span-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm px-6 py-2.5 rounded-lg flex items-center justify-center gap-2">
              <Search className="w-4 h-4" /> Search
            </button>
          </form>
        </div>
      </section>

      <section className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <select value={type} onChange={(e) => setType(e.target.value)} className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm">
            <option value="">All stay types</option>
            {stayTypes.map((t) => <option key={t.code} value={t.code}>{t.name}</option>)}
          </select>
          <select value={priceIndex} onChange={(e) => setPriceIndex(Number(e.target.value))} className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm">
            {PRICE_OPTIONS.map((p, i) => <option key={p.label} value={i}>{p.label}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm">
            <option value="newest">Recommended</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
            <option value="rating">Star rating</option>
          </select>
          <button type="button" onClick={() => search(1)} className="text-sm font-semibold text-emerald-700 px-3 py-2 hover:underline">
            Apply filters
          </button>
          {!loading && !error && (
            <span className="ml-auto text-sm text-slate-500">
              {pagination.total} stay{pagination.total === 1 ? '' : 's'} found
              {searchParams.get('check_in') && (
                <span className="inline-flex items-center gap-1 ml-2 text-emerald-700">
                  <CalendarDays className="w-3.5 h-3.5" /> available for your dates
                </span>
              )}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-24 text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin mb-2" /> Loading stays...
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">{error}</div>
        ) : hotels.length === 0 ? (
          <div className="flex flex-col items-center text-center py-24 bg-white rounded-xl border border-slate-200">
            <Hotel className="w-10 h-10 text-slate-300 mb-3" />
            <h2 className="font-bold text-[#0a1629]">No stays found</h2>
            <p className="text-sm text-slate-500 mt-1">Try other dates, a different place, or fewer filters.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
              {hotels.map((h) => <HotelCard key={h.id} hotel={h} query={stayQuery} />)}
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-8">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => search(pagination.page - 1)}
                  className="w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-slate-600">Page {pagination.page} of {pagination.totalPages}</span>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => search(pagination.page + 1)}
                  className="w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <Footer />
    </main>
  );
}

export default function HotelsPage() {
  return (
    <Suspense fallback={null}>
      <HotelsContent />
    </Suspense>
  );
}
