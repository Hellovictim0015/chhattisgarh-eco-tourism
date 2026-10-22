"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Store, Warehouse, Building2 } from 'lucide-react';

// Shown only when no active main categories exist yet.
const FALLBACK_OPTIONS = [
  { label: 'Buying a home', href: '/allproject?listing_type=SELL&property_type=RESIDENTIAL', image: '/buy.png' },
  { label: 'Renting a home', href: '/allproject?listing_type=RENT&property_type=RESIDENTIAL', image: '/rent.png' },
  { label: 'Sell / Rent your property', href: '/myProperty', image: '/sell.png', badge: 'FREE', requiresLogin: true },
  { label: 'Explore all projects', href: '/allproject', image: '/home.png' },
  { label: 'Buying commercial spaces', href: '/allproject?listing_type=SELL&property_type=COMMERCIAL', icon: Store, tint: 'from-amber-50 to-orange-100', iconColor: 'text-amber-600' },
  { label: 'Lease commercial spaces', href: '/allproject?listing_type=RENT&property_type=COMMERCIAL', icon: Warehouse, tint: 'from-sky-50 to-blue-100', iconColor: 'text-sky-600' },
];

// Icon backgrounds cycled for categories that don't have an image yet
const TINTS = [
  { tint: 'from-amber-50 to-orange-100', iconColor: 'text-amber-600' },
  { tint: 'from-sky-50 to-blue-100', iconColor: 'text-sky-600' },
  { tint: 'from-emerald-50 to-green-100', iconColor: 'text-emerald-600' },
  { tint: 'from-violet-50 to-purple-100', iconColor: 'text-violet-600' },
];

const categoryToOption = (cat, i) => ({
  label: cat.name,
  href: `/allproject?main_category_id=${cat.id}`,
  image: cat.image || null,
  icon: Building2,
  ...TINTS[i % TINTS.length],
});

function TileBody({ option }) {
  const Icon = option.icon;
  return (
    <>
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
        {option.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={option.image}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${option.tint} flex items-center justify-center`}>
            <Icon className={`w-12 h-12 ${option.iconColor} group-hover:scale-110 transition-transform duration-300`} strokeWidth={1.5} />
          </div>
        )}
        {option.badge && (
          <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            {option.badge}
          </span>
        )}
      </div>
      <p className="mt-2.5 text-sm font-semibold text-slate-800 group-hover:text-[#d9982b] transition-colors">
        {option.label}
      </p>
    </>
  );
}

export default function ExploreOptions() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/admin/main-categories');
        const data = await res.json();
        if (data.success) setCategories(data.data.filter((c) => c.status === 'ACTIVE'));
      } catch (err) {
        console.error('Failed to fetch main categories:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const goWithLogin = (href) => {
    const token = localStorage.getItem('authToken');
    router.push(token ? href : `/login?redirect=${href}`);
  };

  const options = categories.length > 0 ? categories.map(categoryToOption) : FALLBACK_OPTIONS;
  const tileClass = 'group w-40 sm:w-auto shrink-0 snap-start';

  return (
    <section className="font-sans bg-slate-50 pt-14 pb-6">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-xs sm:text-sm font-bold tracking-[0.15em] uppercase text-slate-500 mb-8">
          Get started with exploring real estate options
        </h2>

        <div className="flex sm:grid sm:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-40 sm:w-auto shrink-0 animate-pulse">
                  <div className="aspect-[4/3] rounded-xl bg-slate-200" />
                  <div className="mt-3 h-3.5 w-2/3 rounded bg-slate-200" />
                </div>
              ))
            : options.map((option) =>
                option.requiresLogin ? (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => goWithLogin(option.href)}
                    className={`${tileClass} text-left`}
                  >
                    <TileBody option={option} />
                  </button>
                ) : (
                  <Link key={option.href} href={option.href} className={tileClass}>
                    <TileBody option={option} />
                  </Link>
                )
              )}
        </div>
      </div>
    </section>
  );
}
