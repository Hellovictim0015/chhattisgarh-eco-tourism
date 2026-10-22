"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StatusBadge from '@/components/BookingStatusBadge';
import { formatDay, rupees, dayFromToday } from '@/lib/dates';
import { Loader2, CalendarDays, Hotel, Users, BedDouble, MapPin } from 'lucide-react';

export default function MyBookingsPage() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = localStorage.getItem('authToken');
    if (!t) {
      router.replace('/login?redirect=/my-bookings');
      return;
    }
    setToken(t);
  }, [router]);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      try {
        const res = await fetch('/api/bookings', { headers: { Authorization: `Bearer ${token}` } });
        if (res.status === 401) return router.replace('/login?redirect=/my-bookings');
        const data = await res.json();
        if (data.success) setBookings(data.data);
        else setError(data.error || 'Could not load bookings');
      } catch {
        setError('Could not load bookings');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token, router]);

  const cancel = async (b) => {
    if (!confirm(`Cancel booking ${b.booking_code} at ${b.hotel_name}?`)) return;
    setBusyId(b.id);
    setError('');
    try {
      const res = await fetch(`/api/bookings/${b.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setBookings((list) => list.map((x) => (x.id === b.id ? { ...x, status: 'CANCELLED' } : x)));
    } catch (err) {
      setError(err.message || 'Could not cancel');
    } finally {
      setBusyId(null);
    }
  };

  const today = dayFromToday();

  return (
    <main className="min-h-screen bg-slate-50 font-sans">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-[#0a1629] mb-1">My Bookings</h1>
        <p className="text-sm text-slate-500 mb-6">Your hotel stays and their status.</p>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">{error}</div>}

        {loading ? (
          <div className="flex flex-col items-center py-24 text-slate-400"><Loader2 className="w-7 h-7 animate-spin mb-2" /> Loading...</div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center text-center py-20 bg-white rounded-xl border border-slate-200">
            <CalendarDays className="w-10 h-10 text-slate-300 mb-3" />
            <h2 className="font-bold text-[#0a1629]">No bookings yet</h2>
            <p className="text-sm text-slate-500 mt-1 mb-5">Find a stay and book in a few clicks.</p>
            <Link href="/hotels" className="bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold px-5 py-2.5 rounded-lg">Explore stays</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => {
              const canCancel = ['PENDING', 'CONFIRMED'].includes(b.status) && b.check_in >= today;
              return (
                <div key={b.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col sm:flex-row">
                  <Link href={`/hotels/${b.hotel_id}`} className="sm:w-44 h-32 sm:h-auto bg-slate-100 shrink-0 block">
                    {b.hotel_image ? (
                      <img src={b.hotel_image} alt={b.hotel_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300"><Hotel className="w-8 h-8" /></div>
                    )}
                  </Link>
                  <div className="p-4 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <Link href={`/hotels/${b.hotel_id}`} className="font-bold text-[#0a1629] hover:text-emerald-700">{b.hotel_name}</Link>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mb-3"><MapPin className="w-3.5 h-3.5" /> {b.hotel_city}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                      <div><span className="block text-[11px] text-slate-400">Check-in</span>{formatDay(b.check_in)}</div>
                      <div><span className="block text-[11px] text-slate-400">Check-out</span>{formatDay(b.check_out)}</div>
                      <div><span className="block text-[11px] text-slate-400">Room</span><span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" /> {b.room_name} × {b.rooms_count}</span></div>
                      <div><span className="block text-[11px] text-slate-400">Guests</span><span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {b.guests}</span></div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100">
                      <span className="text-sm">
                        <span className="text-slate-500">ID </span><span className="font-mono font-semibold">{b.booking_code}</span>
                        <span className="text-slate-500"> · {b.nights} night{b.nights > 1 ? 's' : ''} · </span>
                        <span className="font-bold text-[#0a1629]">{rupees(b.total_amount)}</span>
                        <span className="text-xs text-slate-400"> (pay at hotel)</span>
                      </span>
                      {canCancel && (
                        <button
                          type="button"
                          disabled={busyId === b.id}
                          onClick={() => cancel(b)}
                          className="text-sm font-semibold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg disabled:opacity-50"
                        >
                          {busyId === b.id ? 'Cancelling...' : 'Cancel booking'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}
