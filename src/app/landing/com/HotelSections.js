"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import HotelCard from '@/components/HotelCard';
import { Hotel, ArrowRight, ShieldCheck, Wallet, CalendarCheck, Headset } from 'lucide-react';

// Stay types come from the admin panel (Stay Types); hidden when none are active
export function StayTypes() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stay-types')
      .then((r) => r.json())
      .then((d) => d.success && setTypes(d.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && types.length === 0) return null;

  return (
    <section className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
      <h2 className="text-xl md:text-2xl font-bold text-[#0a1629] mb-5">Browse by stay type</h2>
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-square rounded-xl bg-slate-200 animate-pulse" />)
          : types.map((t) => (
              <Link
                key={t.id}
                href={`/hotels?type=${encodeURIComponent(t.code)}`}
                className="relative aspect-square rounded-xl overflow-hidden bg-emerald-900 group shadow-sm"
              >
                {t.image ? (
                  <img src={t.image} alt={t.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-white/30"><Hotel className="w-10 h-10" /></span>
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <span className="absolute left-2 right-2 bottom-2 sm:left-3 sm:right-3 sm:bottom-3 text-white">
                  <span className="block font-bold text-xs sm:text-base leading-tight">{t.name}</span>
                  <span className="block text-[10px] sm:text-[11px] text-white/75">
                    {Number(t.hotel_count) > 0 ? `${t.hotel_count} stay${Number(t.hotel_count) > 1 ? 's' : ''}` : 'Explore'}
                  </span>
                </span>
              </Link>
            ))}
      </div>
    </section>
  );
}

// Rows of hotels built by the admin (Admin -> Home Sections), in the admin's order
export function HomeSections() {
  const [sections, setSections] = useState(null);

  useEffect(() => {
    fetch('/api/home-sections')
      .then((r) => r.json())
      .then((d) => setSections(d.success ? d.data : []))
      .catch(() => setSections([]));
  }, []);

  if (sections === null) {
    return (
      <section className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="h-7 w-48 rounded bg-slate-200 animate-pulse mb-5" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-72 rounded-xl bg-slate-200 animate-pulse" />)}
        </div>
      </section>
    );
  }

  return sections.map((section) => (
    <section key={section.id} className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
      <div className="flex items-end justify-between gap-4 mb-5">
        <div className="min-w-0">
          <h2 className="text-xl md:text-2xl font-bold text-[#0a1629]">{section.title}</h2>
          {section.subtitle && <p className="text-sm text-slate-500">{section.subtitle}</p>}
        </div>
        <Link href={`/collections/${section.slug}`} className="text-sm font-semibold text-emerald-700 flex items-center gap-1 hover:underline shrink-0">
          View all{section.total_hotels > section.hotels.length ? ` (${section.total_hotels})` : ''} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {section.hotels.map((h) => <HotelCard key={h.id} hotel={h} />)}
      </div>
    </section>
  ));
}

const REASONS = [
  { icon: Wallet, title: 'Pay at the hotel', text: 'No advance payment. Reserve now and pay when you check in.' },
  { icon: CalendarCheck, title: 'Live availability', text: 'See exactly how many rooms are left for your dates.' },
  { icon: ShieldCheck, title: 'Verified stays', text: 'Every listing is reviewed before it goes live.' },
  { icon: Headset, title: 'Help when you need it', text: 'Our team is a call away for any booking question.' },
];

export function WhyBook() {
  return (
    <section className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-14">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {REASONS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="bg-white border border-slate-200 rounded-xl p-5">
            <Icon className="w-6 h-6 text-emerald-700 mb-3" />
            <h3 className="font-bold text-[#0a1629] mb-1">{title}</h3>
            <p className="text-sm text-slate-500">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ListYourHotel() {
  return (
    <section className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <div className="bg-[#0f2a1d] rounded-2xl px-6 py-10 md:px-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-white">
        <div>
          <h2 className="text-2xl font-bold mb-2">Own a hotel, resort or homestay?</h2>
          <p className="text-white/75 max-w-xl text-sm md:text-base">
            List it for free, set your rooms and prices, and confirm bookings from your own dashboard.
          </p>
        </div>
        <Link href="/my-hotels" className="bg-[#f2b544] hover:bg-[#e0a434] text-[#0a1629] font-bold px-6 py-3 rounded-lg shrink-0">
          List your hotel — free
        </Link>
      </div>
    </section>
  );
}
