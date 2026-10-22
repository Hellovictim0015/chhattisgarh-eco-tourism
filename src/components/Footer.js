"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SITE_NAME, LOGO_SRC } from '@/lib/site';
import { DEFAULT_FOOTER } from '@/lib/footerDefaults';
import { MapPin, Phone, Mail, Clock, ChevronUp, ShieldCheck } from 'lucide-react';

// Icons for the social networks the admin can link (Admin -> Footer)
const SOCIAL_ICONS = [
  { key: 'facebook', label: 'Facebook', path: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /> },
  // X (formerly Twitter) logo is a solid shape, so it is drawn filled instead of outlined
  { key: 'x', label: 'X (Twitter)', filled: true, path: <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" /> },
  { key: 'linkedin', label: 'LinkedIn', path: <><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" /></> },
  { key: 'instagram', label: 'Instagram', path: <><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></> },
  { key: 'youtube', label: 'YouTube', path: <><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" /></> },
];

// "/hotels" stays a client-side link; full URLs open in a new tab
function FooterLink({ href, className, children }) {
  if (href.startsWith('/')) return <Link href={href} className={className}>{children}</Link>;
  return <a href={href} target="_blank" rel="noopener noreferrer" className={className}>{children}</a>;
}

export default function Footer() {
  // Content is managed in Admin -> Footer; the phone is Admin -> Settings -> Call number
  const [footer, setFooter] = useState(DEFAULT_FOOTER);
  const [phone, setPhone] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) return;
        if (data.data.footer) setFooter(data.data.footer);
        setPhone(data.data.contact_phone || '');
      })
      .catch(() => {});
  }, []);

  const socials = SOCIAL_ICONS.filter((s) => footer.socials?.[s.key]);

  return (
    <footer className="bg-[#0a1629] text-slate-300 font-sans">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ===== Brand + contact strip ===== */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 py-8 border-b border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <Link href="/" className="shrink-0">
              <Image src={LOGO_SRC} alt={SITE_NAME} width={200} height={80} className="h-14 w-auto object-contain brightness-0 invert" />
            </Link>
            {footer.about && (
              <p className="text-sm text-slate-400 max-w-sm sm:border-l sm:border-white/10 sm:pl-6">{footer.about}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
            {phone && <a href={`tel:${phone}`} className="flex items-center gap-3 group">
              <span className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <Phone className="w-4 h-4 text-[#d9982b]" />
              </span>
              <span>
                <span className="block text-[11px] uppercase tracking-wider text-slate-500">Call us</span>
                <span className="block text-sm font-semibold text-white group-hover:text-[#d9982b]">{phone}</span>
              </span>
            </a>}
            {footer.email && <a href={`mailto:${footer.email}`} className="flex items-center gap-3 group min-w-0">
              <span className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-[#d9982b]" />
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] uppercase tracking-wider text-slate-500">Email us</span>
                <span className="block text-sm font-semibold text-white group-hover:text-[#d9982b] break-all">{footer.email}</span>
              </span>
            </a>}
          </div>
        </div>

        {/* ===== Link columns ===== */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-10 py-10 border-b border-white/10">
          {footer.columns.map((col, ci) => (
            <div key={ci}>
              <h3 className="text-white text-sm font-bold uppercase tracking-wider mb-4">{col.title}</h3>
              <ul className="flex flex-col gap-2.5 text-sm">
                {col.links.map((link, li) => (
                  <li key={li}>
                    <FooterLink href={link.href} className="text-slate-400 hover:text-[#d9982b] transition-colors inline-flex items-center gap-2">
                      {link.label}
                      {link.badge && (
                        <span className="bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">{link.badge}</span>
                      )}
                    </FooterLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="col-span-2 md:col-span-1">
            <h3 className="text-white text-sm font-bold uppercase tracking-wider mb-4">Reach Us</h3>
            <ul className="flex flex-col gap-3 text-sm text-slate-400">
              {footer.address && (
                <li className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#d9982b] shrink-0 mt-0.5" /> {footer.address}
                </li>
              )}
              {footer.hours && (
                <li className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-[#d9982b] shrink-0 mt-0.5" /> {footer.hours}
                </li>
              )}
            </ul>
            {socials.length > 0 && <div className="flex items-center gap-2.5 mt-5">
              {socials.map((s) => (
                <a
                  key={s.key}
                  href={footer.socials[s.key]}
                  target="_blank"
                  rel="noopener noreferrer"
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
            </div>}
          </div>
        </div>

        {/* ===== Disclaimer ===== */}
        {footer.disclaimer && (
          <div className="py-6 border-b border-white/10 flex gap-3">
            <ShieldCheck className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 leading-relaxed">
              <span className="font-semibold text-slate-400">Disclaimer:</span> {footer.disclaimer}
            </p>
          </div>
        )}

        {/* ===== Bottom bar ===== */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 text-xs text-slate-500">
          <p>{footer.copyright || `© ${new Date().getFullYear()} ${SITE_NAME}. All rights reserved.`}</p>
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
