"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SITE_NAME, LOGO_SRC } from '@/lib/site';
import { MapPin, Phone, Mail, Clock, ChevronUp, ShieldCheck } from 'lucide-react';

const SUPPORT_PHONE = '+91 98765 43210';
const SUPPORT_PHONE_HREF = 'tel:+919876543210';
const SUPPORT_EMAIL = 'contact@indiantownship.com';
const OFFICE_ADDRESS = 'Chhattisgarh, India';

// Only links to pages that exist on the site
const LINK_COLUMNS = [
  {
    title: 'Stays',
    links: [
      { label: 'All Hotels & Stays', href: '/hotels' },
      { label: 'Resorts', href: '/hotels?type=RESORT' },
      { label: 'Eco Lodges', href: '/hotels?type=ECO_LODGE' },
      { label: 'Homestays', href: '/hotels?type=HOMESTAY' },
    ],
  },
  {
    title: 'For Guests',
    links: [
      { label: 'My Bookings', href: '/my-bookings' },
      { label: 'My Profile', href: '/profile' },
      { label: 'Login / Register', href: '/login' },
    ],
  },
  {
    title: 'For Hotel Owners',
    links: [
      { label: 'List Your Hotel', href: '/my-hotels', badge: 'FREE' },
      { label: 'Manage Bookings', href: '/my-hotels' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Home', href: '/' },
      { label: 'Contact Us', href: '/contact' },
    ],
  },
];

const SOCIALS = [
  { label: 'Facebook', path: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /> },
  // X (formerly Twitter) logo is a solid shape, so it is drawn filled instead of outlined
  { label: 'X (Twitter)', filled: true, path: <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" /> },
  { label: 'LinkedIn', path: <><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></> },
  { label: 'Instagram', path: <><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></> },
];

export default function Footer() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetch('/api/admin/main-categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCategories(data.data.filter((c) => c.status === 'ACTIVE'));
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="bg-[#0a1629] text-slate-300 font-sans">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ===== Brand + contact strip ===== */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 py-8 border-b border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <Link href="/" className="shrink-0">
              <Image src={LOGO_SRC} alt={SITE_NAME} width={200} height={80} className="h-14 w-auto object-contain brightness-0 invert" />
            </Link>
            <p className="text-sm text-slate-400 max-w-sm sm:border-l sm:border-white/10 sm:pl-6">
              Book hotels, resorts and eco stays across Chhattisgarh — pay at the hotel.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
            <a href={SUPPORT_PHONE_HREF} className="flex items-center gap-3 group">
              <span className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <Phone className="w-4 h-4 text-[#d9982b]" />
              </span>
              <span>
                <span className="block text-[11px] uppercase tracking-wider text-slate-500">Call us</span>
                <span className="block text-sm font-semibold text-white group-hover:text-[#d9982b]">{SUPPORT_PHONE}</span>
              </span>
            </a>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="flex items-center gap-3 group min-w-0">
              <span className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-[#d9982b]" />
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] uppercase tracking-wider text-slate-500">Email us</span>
                <span className="block text-sm font-semibold text-white group-hover:text-[#d9982b] break-all">{SUPPORT_EMAIL}</span>
              </span>
            </a>
          </div>
        </div>

        {/* ===== Link columns ===== */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-10 py-10 border-b border-white/10">
          {LINK_COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-white text-sm font-bold uppercase tracking-wider mb-4">{col.title}</h3>
              <ul className="flex flex-col gap-2.5 text-sm">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-slate-400 hover:text-[#d9982b] transition-colors inline-flex items-center gap-2">
                      {link.label}
                      {link.badge && (
                        <span className="bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">{link.badge}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="col-span-2 md:col-span-1">
            <h3 className="text-white text-sm font-bold uppercase tracking-wider mb-4">Reach Us</h3>
            <ul className="flex flex-col gap-3 text-sm text-slate-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#d9982b] shrink-0 mt-0.5" /> {OFFICE_ADDRESS}
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#d9982b] shrink-0 mt-0.5" /> Mon – Sat, 9 AM – 8 PM
              </li>
            </ul>
            <div className="flex items-center gap-2.5 mt-5">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:bg-[#d9982b] hover:border-[#d9982b] hover:text-white transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={s.filled ? 13 : 15}
                    height={s.filled ? 13 : 15}
                    viewBox="0 0 24 24"
                    {...(s.filled
                      ? { fill: 'currentColor' }
                      : { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' })}
                  >
                    {s.path}
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ===== Explore categories (from Main Categories) ===== */}
        {categories.length > 0 && (
          <div className="py-8 border-b border-white/10">
            <h3 className="text-white text-sm font-bold uppercase tracking-wider mb-4">Explore Categories</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/allproject?main_category_id=${cat.id}`}
                  className="text-xs text-slate-300 bg-white/5 border border-white/10 hover:border-[#d9982b] hover:text-[#d9982b] px-3 py-1.5 rounded-full transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ===== Disclaimer ===== */}
        <div className="py-6 border-b border-white/10 flex gap-3">
          <ShieldCheck className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-500 leading-relaxed">
            <span className="font-semibold text-slate-400">Disclaimer:</span> Hotel details, photos and prices are provided by the
            hotels themselves. Bookings are confirmed by the hotel and payment is made directly at the property. Please carry a valid ID at check-in.
          </p>
        </div>

        {/* ===== Bottom bar ===== */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {SITE_NAME}. All rights reserved.</p>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-1.5 text-slate-400 hover:text-[#d9982b] transition-colors"
            aria-label="Back to top"
          >
            Back to top
            <span className="w-8 h-8 rounded-full bg-[#d9982b] flex items-center justify-center">
              <ChevronUp className="w-4 h-4 text-white" />
            </span>
          </button>
        </div>
      </div>
    </footer>
  );
}
