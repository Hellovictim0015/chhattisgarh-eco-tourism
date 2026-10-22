"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, CalendarDays, Users } from 'lucide-react';
import { dayFromToday, addDays } from '@/lib/dates';

const POPULAR = ['Jagdalpur', 'Chitrakote', 'Mainpat', 'Raipur', 'Barnawapara', 'Sirpur'];

// Shown until the admin-managed slides load, and when none are active
const DEFAULT_SLIDE = {
  id: 'default',
  image: '/home.png',
  title: 'Stay close to nature',
  highlight: 'nature',
  subtitle: 'Hotels, jungle resorts, eco lodges and homestays — book in minutes, pay at the hotel.',
};

const SLIDE_MS = 5000;

// Slide heading with its highlighted words in gold. Also used by the admin preview.
export function HeroHeading({ slide, className = '' }) {
  const title = slide.title || '';
  const at = slide.highlight ? title.toLowerCase().indexOf(slide.highlight.toLowerCase()) : -1;
  return (
    <h1 className={`font-bold text-white drop-shadow-md max-w-2xl leading-tight ${className}`}>
      {at < 0 ? title : (
        <>
          {title.slice(0, at)}
          <span className="text-[#f2b544]">{title.slice(at, at + slide.highlight.length)}</span>
          {title.slice(at + slide.highlight.length)}
        </>
      )}
    </h1>
  );
}

export default function HotelHero() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [checkIn, setCheckIn] = useState(dayFromToday());
  const [checkOut, setCheckOut] = useState(dayFromToday(1));
  const [guests, setGuests] = useState(2);

  const [slides, setSlides] = useState([DEFAULT_SLIDE]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    fetch('/api/hero-slides')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data.length) {
          setSlides(d.data);
          setActive(0);
        }
      })
      .catch(() => {});
  }, []);

  // Auto-advance; restarting the timer on every change means a dot click gets a full interval too
  useEffect(() => {
    if (slides.length < 2) return;
    const t = setTimeout(() => setActive((i) => (i + 1) % slides.length), SLIDE_MS);
    return () => clearTimeout(t);
  }, [active, slides.length]);

  const search = (place = q) => {
    const params = new URLSearchParams({ check_in: checkIn, check_out: checkOut, guests: String(guests) });
    if (place.trim()) params.set('q', place.trim());
    router.push(`/hotels?${params.toString()}`);
  };

  const fieldCls = 'w-full bg-transparent text-sm font-semibold text-slate-800 outline-none';

  return (
    <section className="relative font-sans bg-slate-50">
      <div className="relative w-full h-[360px] sm:h-[420px] md:h-[480px] overflow-hidden bg-[#0f2a1d]">
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            aria-hidden={i !== active}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${i === active ? 'opacity-100' : 'opacity-0'}`}
            style={{ backgroundImage: `url('${slide.image}')` }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f2a1d]/75 via-[#0f2a1d]/35 to-transparent" />

        <div className="relative z-10 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-[6.5rem] md:pt-36">
          <div className="grid">
            {/* All slide texts share one grid cell so the block keeps the height of the tallest */}
            {slides.map((slide, i) => (
              <div
                key={slide.id}
                aria-hidden={i !== active}
                className={`[grid-area:1/1] transition-all duration-700 ${i === active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'}`}
              >
                <HeroHeading slide={slide} className="text-3xl sm:text-4xl md:text-5xl" />
                {slide.subtitle && (
                  <p className="text-white/90 text-sm md:text-base mt-3 drop-shadow max-w-xl">{slide.subtitle}</p>
                )}
              </div>
            ))}
          </div>

          {slides.length > 1 && (
            <div className="flex gap-2 mt-5">
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`Show slide ${i + 1}`}
                  aria-current={i === active}
                  className={`h-1.5 rounded-full transition-all duration-300 ${i === active ? 'w-8 bg-[#f2b544]' : 'w-4 bg-white/60 hover:bg-white'}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="relative z-20 -mt-24 sm:-mt-28 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <form
          onSubmit={(e) => { e.preventDefault(); search(); }}
          className="bg-white rounded-xl shadow-[0_12px_40px_rgba(10,22,41,0.15)] border border-slate-100 p-3 sm:p-4"
        >
          <div className="grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr_0.8fr_auto] gap-2 md:gap-0">
            <label className="col-span-2 md:col-span-1 bg-slate-50 md:bg-transparent rounded-lg px-4 py-2.5 md:border-r border-slate-200">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-0.5"><MapPin className="w-3.5 h-3.5" /> Where</span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="City, place or hotel" className={`${fieldCls} placeholder:text-slate-400 placeholder:font-normal`} />
            </label>
            <label className="bg-slate-50 md:bg-transparent rounded-lg px-4 py-2.5 md:border-r border-slate-200">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-0.5"><CalendarDays className="w-3.5 h-3.5" /> Check-in</span>
              <input
                type="date"
                required
                value={checkIn}
                min={dayFromToday()}
                onChange={(e) => {
                  if (!e.target.value) return;
                  setCheckIn(e.target.value);
                  if (checkOut <= e.target.value) setCheckOut(addDays(e.target.value, 1));
                }}
                className={fieldCls}
              />
            </label>
            <label className="bg-slate-50 md:bg-transparent rounded-lg px-4 py-2.5 md:border-r border-slate-200">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-0.5"><CalendarDays className="w-3.5 h-3.5" /> Check-out</span>
              <input
                type="date"
                required
                value={checkOut}
                min={addDays(checkIn, 1)}
                onChange={(e) => e.target.value && setCheckOut(e.target.value)}
                className={fieldCls}
              />
            </label>
            <label className="col-span-2 md:col-span-1 bg-slate-50 md:bg-transparent rounded-lg px-4 py-2.5">
              <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-0.5"><Users className="w-3.5 h-3.5" /> Guests</span>
              <input type="number" min="1" max="30" value={guests} onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 1))} className={fieldCls} />
            </label>
            <button type="submit" className="col-span-2 md:col-span-1 md:ml-2 bg-emerald-700 hover:bg-emerald-800 text-white px-8 py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 shadow-md">
              <Search className="w-4 h-4" /> Search
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 px-1 sm:px-4 pt-3 mt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">Popular:</span>
            {POPULAR.map((p) => (
              <button key={p} type="button" onClick={() => search(p)} className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800">
                {p}
              </button>
            ))}
          </div>
        </form>
      </div>
    </section>
  );
}
