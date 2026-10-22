"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Phone, Menu, X, UserCircle2, ChevronDown, Headset, Mail, LogOut, Hotel, User, CalendarCheck,
} from 'lucide-react';
import Image from 'next/image';
import { SITE_NAME, LOGO_SRC } from '@/lib/site';

const SUPPORT_PHONE = '+91 98765 43210';
const SUPPORT_PHONE_HREF = 'tel:+919876543210';

// Closes a dropdown when the user clicks anywhere outside it.
function useClickOutside(ref, onOutside) {
  useEffect(() => {
    const handle = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onOutside();
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [ref, onOutside]);
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null); // 'help' | 'profile' | null
  const [scrolled, setScrolled] = useState(false);

  // On the home page the bar floats transparently over the hero banner
  // and turns solid once the user scrolls. Other pages have no banner behind it.
  const overHero = pathname === '/';

  useEffect(() => {
    if (!overHero) return;
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [overHero]);

  const solid = !overHero || scrolled || mobileMenuOpen;

  const menusRef = useRef(null);
  const closeMenus = React.useCallback(() => setOpenMenu(null), []);
  useClickOutside(menusRef, closeMenus);

  const goWithLogin = (href) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    router.push(token ? href : `/login?redirect=${href}`);
  };

  const handleListHotel = () => {
    setMobileMenuOpen(false);
    goWithLogin('/my-hotels');
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    setUser(null);
    setOpenMenu(null);
    setMobileMenuOpen(false);
    router.push('/');
  };

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('authUser');
      const token = localStorage.getItem('authToken');
      if (token && storedUser) setUser(JSON.parse(storedUser));
    } catch {
      setUser(null);
    }
  }, []);

  const allNavItems = [
    { id: 'home', name: 'Home', slug: '' },
    { id: 'hotels', name: 'Hotels & Stays', slug: 'hotels' },
    { id: 'resorts', name: 'Resorts', slug: 'hotels?type=RESORT' },
    { id: 'eco', name: 'Eco Lodges & Camps', slug: 'hotels?type=ECO_LODGE' },
    { id: 'contact', name: 'Contact Us', slug: 'contact' },
  ];

  // Transparent over the hero (light text), white once scrolled / on other pages (dark text)
  const theme = solid
    ? {
        header: 'bg-white text-slate-800 border-b border-slate-200 shadow-[0_2px_12px_rgba(10,22,41,0.08)]',
        logo: '',
        link: 'text-slate-600 hover:text-[#0a1629]',
        linkActive: 'text-[#0a1629] font-semibold',
        muted: 'text-slate-400',
        icon: 'text-slate-600 hover:text-[#0a1629] hover:bg-slate-100',
        post: 'bg-[#0a1629] text-white hover:bg-[#16243d]',
      }
    : {
        header: 'bg-gradient-to-b from-black/45 to-transparent text-white',
        logo: 'brightness-0 invert drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]',
        link: 'text-white/80 hover:text-white',
        linkActive: 'text-white font-semibold',
        muted: 'text-white/40',
        icon: 'text-white/85 hover:text-white hover:bg-white/10',
        post: 'bg-white text-[#0a1629] hover:bg-slate-100',
      };

  const hrefFor = (item) => (item.slug ? `/${item.slug.trim()}` : '/');
  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    if (href.includes('?')) return false; // filtered shortcuts never show as the active page
    return pathname?.startsWith(href);
  };

  return (
    <header
      className={`w-full top-0 z-50 transition-[background-color,box-shadow,color] duration-300 ${
        overHero ? 'fixed' : 'sticky'
      } ${theme.header}`}
    >
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

        {/* Left: Logo + links */}
        <div className="flex items-center gap-8 min-w-0">
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src={LOGO_SRC}
              alt={SITE_NAME}
              width={200}
              height={80}
              className={`w-auto h-12 sm:h-14 object-contain ${theme.logo}`}
              priority
            />
          </Link>

          <nav className="hidden xl:flex items-center gap-1 text-[14px] font-medium">
            {allNavItems.map((item) => {
                  const href = hrefFor(item);
                  const active = isActive(href);
                  return (
                    <Link
                      key={item.id}
                      href={href}
                      className={`relative px-3 py-5 whitespace-nowrap transition-colors ${
                        active ? theme.linkActive : theme.link
                      }`}
                    >
                      {item.name.trim()}
                      {active && <span className="absolute left-3 right-3 bottom-0 h-[3px] rounded-t bg-[#d9982b]" />}
                    </Link>
                  );
                })}
          </nav>
        </div>

        {/* Right: actions */}
        <div ref={menusRef} className="flex items-center gap-2 sm:gap-3 shrink-0">

          {/* List your hotel */}
          <button
            type="button"
            onClick={handleListHotel}
            className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${theme.post}`}
          >
            List your hotel
            <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">FREE</span>
          </button>

          {/* Help */}
          <div className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setOpenMenu((m) => (m === 'help' ? null : 'help'))}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${theme.icon}`}
              aria-label="Help"
              aria-expanded={openMenu === 'help'}
            >
              <Headset className="w-5 h-5" />
            </button>
            {openMenu === 'help' && (
              <div className="absolute right-0 mt-2 w-64 bg-white text-slate-800 rounded-lg shadow-xl border border-slate-100 py-3">
                <p className="px-4 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Talk to our expert</p>
                <a onClick={closeMenus} href={SUPPORT_PHONE_HREF} className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50">
                  <Phone className="w-4 h-4 text-[#d9982b]" />
                  <span>
                    <span className="block text-sm font-semibold">{SUPPORT_PHONE}</span>
                    <span className="block text-xs text-slate-500">Mon – Sat, 9 AM – 8 PM</span>
                  </span>
                </a>
                <Link onClick={closeMenus} href="/contact" className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-50">
                  <Mail className="w-4 h-4 text-[#d9982b]" /> Contact us
                </Link>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setOpenMenu((m) => (m === 'profile' ? null : 'profile'))}
              className={`flex items-center gap-1 pl-1 pr-2 h-9 rounded-full transition-colors ${theme.icon}`}
              aria-label="Account"
              aria-expanded={openMenu === 'profile'}
            >
              <UserCircle2 className="w-6 h-6" />
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            {openMenu === 'profile' && (
              <div className="absolute right-0 mt-2 w-60 bg-white text-slate-800 rounded-lg shadow-xl border border-slate-100 py-2">
                {user ? (
                  <>
                    <div className="px-4 py-2 border-b border-slate-100 mb-1">
                      <p className="text-xs text-slate-500">Signed in as</p>
                      <p className="text-sm font-semibold truncate">{user.name}</p>
                    </div>
                    <Link onClick={closeMenus} href="/profile" className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-50">
                      <User className="w-4 h-4 text-slate-500" /> My Profile
                    </Link>
                    <Link onClick={closeMenus} href="/my-bookings" className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-50">
                      <CalendarCheck className="w-4 h-4 text-slate-500" /> My Bookings
                    </Link>
                    <Link onClick={closeMenus} href="/my-hotels" className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-50">
                      <Hotel className="w-4 h-4 text-slate-500" /> My Hotels
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </>
                ) : (
                  <div className="px-4 py-2">
                    <p className="text-sm text-slate-600 mb-3">Login to book stays and manage your bookings.</p>
                    <button
                      type="button"
                      onClick={() => router.push(`/login?redirect=${pathname || '/'}`)}
                      className="w-full bg-[#0a1629] hover:bg-[#16243d] text-white py-2 rounded-md text-sm font-semibold transition-colors"
                    >
                      Login / Register
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className={`xl:hidden w-10 h-10 flex items-center justify-center rounded-md ${theme.icon}`}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t border-slate-200 bg-white px-4 py-4 flex flex-col gap-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
          {allNavItems.map((item) => {
            const href = hrefFor(item);
            return (
              <Link
                key={item.id}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2.5 rounded-md text-sm font-medium ${
                  isActive(href) ? 'bg-slate-100 text-[#0a1629] font-semibold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.name.trim()}
              </Link>
            );
          })}

          <div className="h-px bg-slate-200 my-2" />

          {user ? (
            <>
              <Link onClick={() => setMobileMenuOpen(false)} href="/profile" className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm text-slate-700 hover:bg-slate-50">
                <UserCircle2 className="w-5 h-5" /> {user.name}
              </Link>
              <Link onClick={() => setMobileMenuOpen(false)} href="/my-bookings" className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm text-slate-700 hover:bg-slate-50">
                <CalendarCheck className="w-5 h-5" /> My Bookings
              </Link>
              <Link onClick={() => setMobileMenuOpen(false)} href="/my-hotels" className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm text-slate-700 hover:bg-slate-50">
                <Hotel className="w-5 h-5" /> My Hotels
              </Link>
              <button type="button" onClick={handleLogout} className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm text-red-600 hover:bg-red-50">
                <LogOut className="w-5 h-5" /> Logout
              </button>
            </>
          ) : (
            <Link
              onClick={() => setMobileMenuOpen(false)}
              href={`/login?redirect=${pathname || '/'}`}
              className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm text-slate-700 hover:bg-slate-50"
            >
              <UserCircle2 className="w-5 h-5" /> Login / Register
            </Link>
          )}

          <button
            type="button"
            onClick={handleListHotel}
            className="flex items-center justify-center gap-2 mt-2 bg-[#0a1629] text-white px-5 py-3 rounded-md font-semibold text-sm"
          >
            List your hotel
            <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">FREE</span>
          </button>

          <a href={SUPPORT_PHONE_HREF} className="flex items-center gap-2 px-3 py-3 text-sm text-slate-700">
            <Phone className="w-4 h-4 text-[#d9982b]" /> {SUPPORT_PHONE}
          </a>
        </div>
      )}
    </header>
  );
}
