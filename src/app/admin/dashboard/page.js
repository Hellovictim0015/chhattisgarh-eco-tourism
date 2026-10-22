"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, Hotel, Users, Mail, Menu, X, CalendarCheck, Clock, IndianRupee,
  LogOut, ArrowRight, Loader2, LogIn, Layers, GalleryHorizontal, Rows3, Settings,
} from 'lucide-react';
import HotelsManagement from './com/Hotels';
import BookingsManagement from './com/Bookings';
import StayTypesManagement from './com/StayTypes';
import HeroSlidesManagement from './com/HeroSlides';
import HomeSectionsManagement from './com/HomeSections';
import SettingsManagement from './com/Settings';
import ContactMessages from './com/ContactMessages';
import UsersManagement from './com/Users';
import { adminFetch } from './com/adminFetch';
import { ADMIN_LOGIN_REQUIRED } from '@/lib/site';

const NAV = [
  { section: null, items: [{ key: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
  {
    section: 'Hotel Booking',
    items: [
      { key: 'Hotels', label: 'Hotels', icon: Hotel },
      { key: 'Bookings', label: 'Bookings', icon: CalendarCheck },
      { key: 'Stay Types', label: 'Stay Types', icon: Layers },
    ],
  },
  { section: 'Home Page', items: [
      { key: 'Hero Slides', label: 'Hero Slides', icon: GalleryHorizontal },
      { key: 'Home Sections', label: 'Home Sections', icon: Rows3 },
    ] },
  { section: 'Enquiries', items: [{ key: 'Contact Messages', label: 'Contact Messages', icon: Mail }] },
  { section: 'Users', items: [{ key: 'Users', label: 'Users Management', icon: Users }] },
  { section: 'Site', items: [{ key: 'Settings', label: 'Settings', icon: Settings }] },
];

function StatCard({ label, value, hint, icon: Icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="text-left bg-white p-5 border border-slate-200 rounded-lg shadow-sm hover:border-slate-300 disabled:hover:border-slate-200 transition-colors group"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <p className="text-3xl font-semibold text-slate-900 mt-2">{value}</p>
      {hint && (
        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
          {hint} {onClick && <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
        </p>
      )}
    </button>
  );
}

function Overview({ go }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    adminFetch('/api/admin/stats').then((d) => d.success && setStats(d.data)).catch(() => {});
  }, []);

  if (!stats) return <div className="flex justify-center py-20 text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Overview of hotels and bookings.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        <StatCard label="Bookings waiting" value={stats.bookings.pending} hint="Need confirmation" icon={Clock} onClick={() => go('Bookings', 'PENDING')} />
        <StatCard label="Arrivals today" value={stats.bookings.arrivals_today} hint="Pending + confirmed check-ins" icon={LogIn} onClick={() => go('Bookings')} />
        <StatCard label="Hotels awaiting approval" value={stats.hotels.pending} hint="Listed by owners" icon={Hotel} onClick={() => go('Hotels', 'PENDING')} />
        <StatCard label="Live hotels" value={stats.hotels.active} hint={`${stats.hotels.total} in total`} icon={Hotel} onClick={() => go('Hotels', 'ACTIVE')} />
        <StatCard label="Total bookings" value={stats.bookings.total} hint="All time" icon={CalendarCheck} onClick={() => go('Bookings')} />
        <StatCard
          label="Booking value"
          value={`₹${Number(stats.bookings.revenue).toLocaleString('en-IN')}`}
          hint={`Confirmed + completed · ${stats.users} registered users`}
          icon={IndianRupee}
        />
      </div>
    </>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [activeView, setActiveView] = useState('Dashboard');
  const [initialFilter, setInitialFilter] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [adminName, setAdminName] = useState('');

  useEffect(() => {
    if (ADMIN_LOGIN_REQUIRED && !localStorage.getItem('admin_token')) {
      router.replace('/admin/auth');
      return;
    }
    try {
      setAdminName(JSON.parse(localStorage.getItem('admin_user') || '{}').name || '');
    } catch {
      // ignore
    }
    setReady(true);
  }, [router]);

  const selectView = (view, filter = '') => {
    setActiveView(view);
    setInitialFilter(filter);
    setIsSidebarOpen(false);
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    router.replace('/admin/auth');
  };

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans flex text-slate-800">

      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/40 z-40 lg:hidden" />
      )}

      <aside
        className={`w-[260px] bg-white border-r border-slate-200 flex-shrink-0 flex flex-col h-screen fixed top-0 left-0 z-50 transition-transform duration-300 lg:sticky lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-emerald-800 text-white rounded flex items-center justify-center">
              <Hotel className="w-5 h-5" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-slate-900 tracking-wide uppercase">CGET</span>
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Admin Panel</span>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-6 no-scrollbar">
          {NAV.map((group, gi) => (
            <div key={gi}>
              {group.section && (
                <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{group.section}</h3>
              )}
              <div className="space-y-1">
                {group.items.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => selectView(key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                      activeView === key ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" /> {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {ADMIN_LOGIN_REQUIRED && <div className="border-t border-slate-100 p-4">
          <button type="button" onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-red-600 hover:bg-red-50">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>}
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden w-9 h-9 border border-slate-200 text-slate-600 rounded-md flex items-center justify-center hover:bg-slate-50"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="ml-auto flex items-center gap-3 text-sm text-slate-600">
            {adminName && <span>{adminName}</span>}
            <div className="w-8 h-8 bg-slate-200 rounded-full border border-slate-300" />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar">
          {activeView === 'Dashboard' ? (
            <Overview go={selectView} />
          ) : activeView === 'Hotels' ? (
            <HotelsManagement key={`hotels-${initialFilter}`} initialFilter={initialFilter} />
          ) : activeView === 'Bookings' ? (
            <BookingsManagement key={`bookings-${initialFilter}`} initialFilter={initialFilter} />
          ) : activeView === 'Stay Types' ? (
            <StayTypesManagement />
          ) : activeView === 'Hero Slides' ? (
            <HeroSlidesManagement />
          ) : activeView === 'Home Sections' ? (
            <HomeSectionsManagement />
          ) : activeView === 'Settings' ? (
            <SettingsManagement />
          ) : activeView === 'Contact Messages' ? (
            <ContactMessages />
          ) : (
            <UsersManagement />
          )}
        </div>
      </main>
    </div>
  );
}
