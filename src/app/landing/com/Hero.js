"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Search, MapPin } from 'lucide-react';

const BUDGET_OPTIONS = [
  { label: 'Any Budget', min: '', max: '' },
  { label: 'Under ₹25 L', min: '', max: '2500000' },
  { label: '₹25 L – ₹50 L', min: '2500000', max: '5000000' },
  { label: '₹50 L – ₹1 Cr', min: '5000000', max: '10000000' },
  { label: '₹1 Cr – ₹2 Cr', min: '10000000', max: '20000000' },
  { label: '₹2 Cr – ₹5 Cr', min: '20000000', max: '50000000' },
  { label: 'Above ₹5 Cr', min: '50000000', max: '' },
];

const RENT_BUDGET_OPTIONS = [
  { label: 'Any Budget', min: '', max: '' },
  { label: 'Under ₹10,000', min: '', max: '10000' },
  { label: '₹10K – ₹25K', min: '10000', max: '25000' },
  { label: '₹25K – ₹50K', min: '25000', max: '50000' },
  { label: '₹50K – ₹1 L', min: '50000', max: '100000' },
  { label: 'Above ₹1 L', min: '100000', max: '' },
];

// listingType / propertyType are what the tab pins in the /allproject query.
// A tab with `href` is a shortcut, not a search.
const TABS = [
  { key: 'BUY', label: 'Buy', listingType: 'SELL' },
  { key: 'RENT', label: 'Rent', listingType: 'RENT' },
  { key: 'COMMERCIAL', label: 'Commercial', listingType: 'SELL', propertyType: 'COMMERCIAL' },
  { key: 'PROJECTS', label: 'Projects' },
  { key: 'POST', label: 'Post Property', badge: 'FREE', href: '/myProperty' },
];

// Banner image per tab — falls back to /home.png for tabs without their own.
const TAB_BACKGROUNDS = {
  BUY: '/buy.png',
  RENT: '/rent.png',
  COMMERCIAL: '/home.png',
  PROJECTS: '/home.png',
};

export default function Hero() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('BUY');
  const [query, setQuery] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [budgetIndex, setBudgetIndex] = useState(0);

  const tab = TABS.find((t) => t.key === activeTab);
  const budgets = tab.listingType === 'RENT' ? RENT_BUDGET_OPTIONS : BUDGET_OPTIONS;

  const handleTabClick = (t) => {
    if (t.href) {
      const token = localStorage.getItem('authToken');
      router.push(token ? t.href : `/login?redirect=${t.href}`);
      return;
    }
    setActiveTab(t.key);
    setBudgetIndex(0); // budget ranges differ between buy and rent
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (tab.listingType) params.set('listing_type', tab.listingType);

    const type = tab.propertyType || propertyType;
    if (type) params.set('property_type', type);

    if (query.trim()) params.set('q', query.trim());

    const budget = budgets[budgetIndex];
    if (budget.min) params.set('min_price', budget.min);
    if (budget.max) params.set('max_price', budget.max);

    router.push(`/allproject?${params.toString()}`);
  };

  return (
    <section className="relative font-sans bg-slate-50">
      {/* Banner */}
      <div
        className="relative w-full h-[324px] sm:h-[384px] md:h-[444px] bg-cover bg-center transition-[background-image] duration-500"
        style={{ backgroundImage: `url('${TAB_BACKGROUNDS[activeTab] || '/home.png'}')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a1629]/60 via-[#0a1629]/20 to-transparent" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-[6.5rem] md:pt-32">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow-md max-w-xl leading-tight">
            Find a home you&apos;ll <span className="text-[#f2b544]">love</span> to live in
          </h1>
          <p className="text-white/90 text-sm md:text-base mt-2 drop-shadow">
            Buy, rent or sell properties — all in one place.
          </p>
        </div>
      </div>

      {/* Search card (overlaps the banner) */}
      <div className="relative z-20 -mt-20 sm:-mt-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-[0_12px_40px_rgba(10,22,41,0.15)] border border-slate-100">

          {/* Tabs */}
          <div className="flex items-center overflow-x-auto no-scrollbar border-b border-slate-200 px-2 sm:px-4">
            {TABS.map((t) => {
              const isActive = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => handleTabClick(t)}
                  className={`relative shrink-0 px-4 sm:px-6 py-4 text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    isActive ? 'text-[#0a1629]' : 'text-slate-500 hover:text-[#0a1629]'
                  }`}
                >
                  {t.label}
                  {t.badge && (
                    <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      {t.badge}
                    </span>
                  )}
                  {isActive && <span className="absolute left-3 right-3 bottom-0 h-[3px] rounded-t bg-[#d9982b]" />}
                </button>
              );
            })}
          </div>

          {/* Search row */}
          <div className="flex flex-col md:flex-row md:items-stretch gap-3 md:gap-0 p-3 sm:p-4">

            {!tab.propertyType && (
              <div className="relative md:w-48 shrink-0 md:border-r md:border-slate-200">
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="w-full h-full appearance-none bg-slate-50 md:bg-transparent rounded-lg md:rounded-none cursor-pointer pl-4 pr-9 py-3 text-sm font-semibold text-slate-700 outline-none"
                >
                  <option value="">All Property Types</option>
                  <option value="RESIDENTIAL">Residential</option>
                  <option value="COMMERCIAL">Commercial</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
            )}

            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder='Search "city, locality or project name"'
                className="w-full h-full bg-slate-50 md:bg-transparent rounded-lg md:rounded-none pl-11 pr-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 outline-none"
              />
            </div>

            <div className="relative md:w-48 shrink-0 md:border-l md:border-slate-200">
              <select
                value={budgetIndex}
                onChange={(e) => setBudgetIndex(Number(e.target.value))}
                className="w-full h-full appearance-none bg-slate-50 md:bg-transparent rounded-lg md:rounded-none cursor-pointer pl-4 pr-9 py-3 text-sm font-semibold text-slate-700 outline-none"
              >
                {budgets.map((b, i) => (
                  <option key={b.label} value={i}>{b.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>

            <button
              type="button"
              onClick={handleSearch}
              className="md:ml-3 bg-[#0a1629] hover:bg-[#16243d] text-white px-8 py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-md"
            >
              <Search className="w-4 h-4" /> Search
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-5 pb-4 -mt-1 text-xs text-slate-500">
            <MapPin className="w-3.5 h-3.5 text-[#d9982b]" />
            Search by city, locality, landmark or project name
          </div>
        </div>
      </div>
    </section>
  );
}
