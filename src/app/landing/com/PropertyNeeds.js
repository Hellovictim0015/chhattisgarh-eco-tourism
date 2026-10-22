"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const NEEDS = [
  {
    key: 'BUY',
    tab: 'Buy',
    caption: 'Buy a home',
    title: 'Find, buy & own your dream home',
    description: 'Explore apartments, villas, builder floors, plots and more from verified listings.',
    points: ['Verified listings', 'Prices that match your budget', 'Direct contact with owners'],
    cta: 'Explore Buying',
    href: '/allproject?listing_type=SELL',
    image: '/buy.png',
  },
  {
    key: 'RENT',
    tab: 'Rent',
    caption: 'Rent a home',
    title: 'Rental homes for everyone',
    description: 'Discover furnished, semi-furnished and unfurnished homes for families and professionals.',
    points: ['Fresh listings every day', 'Filter by budget & furnishing', 'No hidden surprises'],
    cta: 'Explore Renting',
    href: '/allproject?listing_type=RENT',
    image: '/rent.png',
  },
  {
    key: 'SELL',
    tab: 'Sell',
    caption: 'Sell or rent your property',
    title: 'List your property for free',
    description: 'Post your property in minutes and reach thousands of genuine buyers and tenants.',
    points: ['Free listing', 'Reviewed by our team', 'Track your listings anytime'],
    cta: 'Post Property',
    href: '/myProperty',
    image: '/sell.png',
    requiresLogin: true,
  },
  {
    key: 'COMMERCIAL',
    tab: 'Commercial',
    caption: 'Commercial spaces',
    title: 'Offices, shops & showrooms',
    description: 'Buy or lease commercial spaces in prime locations to grow your business.',
    points: ['Offices & co-working', 'Retail shops & showrooms', 'Buy or lease options'],
    cta: 'Explore Commercial',
    href: '/allproject?property_type=COMMERCIAL',
    image: '/home.png',
  },
];

export default function PropertyNeeds() {
  const router = useRouter();
  const [activeKey, setActiveKey] = useState('BUY');
  const need = NEEDS.find((n) => n.key === activeKey);

  const handleCta = () => {
    if (need.requiresLogin && !localStorage.getItem('authToken')) {
      router.push(`/login?redirect=${need.href}`);
      return;
    }
    router.push(need.href);
  };

  return (
    <section className="font-sans bg-white py-16">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <p className="text-xs sm:text-sm font-bold tracking-[0.15em] uppercase text-slate-500">
            All property needs — one portal
          </p>
          <h2 className="mt-2 text-2xl md:text-3xl font-bold text-[#0a1629]">
            Find better places to live, work and invest
          </h2>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-slate-100 rounded-full p-1 overflow-x-auto no-scrollbar max-w-full">
            {NEEDS.map((n) => (
              <button
                key={n.key}
                type="button"
                onClick={() => setActiveKey(n.key)}
                className={`shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
                  activeKey === n.key ? 'bg-[#0a1629] text-white shadow' : 'text-slate-600 hover:text-[#0a1629]'
                }`}
              >
                {n.tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="grid md:grid-cols-2 gap-8 items-center bg-[#fbf6ec] rounded-2xl overflow-hidden border border-[#f1e4c8]">
          <div className="p-6 sm:p-10 order-2 md:order-1">
            <span className="text-[#d9982b] text-xs font-bold tracking-widest uppercase">{need.caption}</span>
            <h3 className="mt-2 text-2xl md:text-3xl font-bold text-[#0a1629] leading-tight">{need.title}</h3>
            <p className="mt-3 text-slate-600 text-sm md:text-base">{need.description}</p>
            <ul className="mt-5 space-y-2">
              {need.points.map((point) => (
                <li key={point} className="flex items-center gap-2 text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> {point}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={handleCta}
              className="mt-7 inline-flex items-center gap-2 bg-[#0a1629] hover:bg-[#16243d] text-white px-6 py-3 rounded-lg font-semibold text-sm transition-colors"
            >
              {need.cta} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="order-1 md:order-2 h-56 md:h-full md:min-h-[360px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={need.image} alt="" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
}
