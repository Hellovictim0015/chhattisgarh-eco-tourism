"use client";

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HotelForm from '@/components/HotelForm';
import BookingsTable from '@/components/BookingsTable';
import StatusBadge from '@/components/BookingStatusBadge';
import { rupees } from '@/lib/dates';
import { Loader2, Plus, Hotel, Edit, Trash2, Eye, MapPin, CalendarCheck } from 'lucide-react';

const BOOKING_FILTERS = ['', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REJECTED'];

export default function MyHotelsPage() {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [tab, setTab] = useState('hotels'); // hotels | bookings
  const [view, setView] = useState('list'); // list | form
  const [editingId, setEditingId] = useState(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const [hotels, setHotels] = useState([]);
  const [hotelsLoading, setHotelsLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingFilter, setBookingFilter] = useState('PENDING');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    const t = localStorage.getItem('authToken');
    if (!t) {
      router.replace('/login?redirect=/my-hotels');
      return;
    }
    setToken(t);
  }, [router]);

  const authFetch = useCallback(async (url, options = {}) => {
    const res = await fetch(url, { ...options, headers: { ...(options.headers || {}), Authorization: `Bearer ${token}` } });
    if (res.status === 401) {
      router.replace('/login?redirect=/my-hotels');
      throw new Error('Please login again');
    }
    return res.json();
  }, [token, router]);

  const loadHotels = useCallback(async () => {
    setHotelsLoading(true);
    try {
      const data = await authFetch('/api/owner/hotels');
      if (data.success) setHotels(data.data);
    } catch {
      // handled by authFetch
    } finally {
      setHotelsLoading(false);
    }
  }, [authFetch]);

  const loadBookings = useCallback(async () => {
    setBookingsLoading(true);
    try {
      const data = await authFetch(`/api/owner/bookings${bookingFilter ? `?status=${bookingFilter}` : ''}`);
      if (data.success) setBookings(data.data);
    } catch {
      // handled by authFetch
    } finally {
      setBookingsLoading(false);
    }
  }, [authFetch, bookingFilter]);

  useEffect(() => { if (token) loadHotels(); }, [token, loadHotels]);
  useEffect(() => { if (token && tab === 'bookings') loadBookings(); }, [token, tab, loadBookings]);

  const deleteHotel = async (h) => {
    if (!confirm(`Delete "${h.name}"? This cannot be undone.`)) return;
    setError('');
    const data = await authFetch(`/api/owner/hotels/${h.id}`, { method: 'DELETE' }).catch((e) => ({ error: e.message }));
    if (data.success) {
      setNotice('Hotel deleted');
      loadHotels();
    } else setError(data.error || 'Could not delete');
  };

  const changeStatus = async (b, status) => {
    setBusyId(b.id);
    setError('');
    try {
      const data = await authFetch(`/api/owner/bookings/${b.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!data.success) throw new Error(data.error);
      setBookings((list) => list.map((x) => (x.id === b.id ? { ...x, status } : x)));
      loadHotels(); // refresh pending counts
    } catch (err) {
      setError(err.message || 'Could not update booking');
    } finally {
      setBusyId(null);
    }
  };

  const openForm = (id = null) => {
    setEditingId(id);
    setView('form');
    setNotice('');
    setError('');
    window.scrollTo({ top: 0 });
  };

  const pendingTotal = hotels.reduce((n, h) => n + Number(h.pending_bookings || 0), 0);

  if (!token) return null;

  return (
    <main className="min-h-screen bg-slate-50 font-sans">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {view === 'form' ? (
          <HotelForm
            apiBase="/api/owner/hotels"
            token={token}
            hotelId={editingId}
            onCancel={() => setView('list')}
            onDone={(message) => { setView('list'); setNotice(message); loadHotels(); }}
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div>
                <h1 className="text-2xl font-bold text-[#0a1629]">My Hotels</h1>
                <p className="text-sm text-slate-500">List your property and manage guest bookings.</p>
              </div>
              <button type="button" onClick={() => openForm()} className="bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold px-4 py-2.5 rounded-lg flex items-center gap-2">
                <Plus className="w-4 h-4" /> List a hotel
              </button>
            </div>

            <div className="flex gap-1 border-b border-slate-200 mb-5">
              {[['hotels', `Hotels (${hotels.length})`], ['bookings', 'Bookings']].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px flex items-center gap-2 ${tab === key ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                  {label}
                  {key === 'bookings' && pendingTotal > 0 && <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendingTotal} new</span>}
                </button>
              ))}
            </div>

            {notice && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-3 text-sm mb-4">{notice}</div>}
            {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">{error}</div>}

            {tab === 'hotels' ? (
              hotelsLoading ? (
                <div className="flex justify-center py-20 text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
              ) : hotels.length === 0 ? (
                <div className="flex flex-col items-center text-center py-20 bg-white rounded-xl border border-slate-200">
                  <Hotel className="w-10 h-10 text-slate-300 mb-3" />
                  <h2 className="font-bold text-[#0a1629]">You have not listed a hotel yet</h2>
                  <p className="text-sm text-slate-500 mt-1 mb-5">Add your hotel, resort or homestay. It goes live after a quick review.</p>
                  <button type="button" onClick={() => openForm()} className="bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold px-5 py-2.5 rounded-lg">List your hotel</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {hotels.map((h) => (
                    <div key={h.id} className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col sm:flex-row gap-4">
                      <div className="w-full sm:w-36 h-28 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                        {h.image ? <img src={h.image} alt={h.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><Hotel className="w-7 h-7" /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-bold text-[#0a1629]">{h.name}</h3>
                          <StatusBadge status={h.status} />
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {[h.address, h.city].filter(Boolean).join(', ')}</p>
                        <p className="text-sm text-slate-600 mt-2">
                          {h.hotel_type_name} · {h.total_rooms} rooms · from {h.min_price ? rupees(h.min_price) : '—'}/night · {h.views} views
                        </p>
                        {h.status === 'PENDING' && <p className="text-xs text-amber-700 mt-1">Waiting for admin approval before guests can book.</p>}
                        {Number(h.pending_bookings) > 0 && (
                          <button type="button" onClick={() => { setBookingFilter('PENDING'); setTab('bookings'); }} className="text-xs font-semibold text-amber-700 mt-1 flex items-center gap-1 hover:underline">
                            <CalendarCheck className="w-3.5 h-3.5" /> {h.pending_bookings} booking(s) waiting for confirmation
                          </button>
                        )}
                      </div>
                      <div className="flex sm:flex-col gap-2 shrink-0">
                        <Link href={`/hotels/${h.id}`} className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-slate-200 rounded-md hover:bg-slate-50"><Eye className="w-4 h-4" /> View</Link>
                        <button type="button" onClick={() => openForm(h.id)} className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-slate-200 rounded-md hover:bg-slate-50"><Edit className="w-4 h-4" /> Edit</button>
                        <button type="button" onClick={() => deleteHotel(h)} className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-red-200 text-red-600 rounded-md hover:bg-red-50"><Trash2 className="w-4 h-4" /> Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <>
                <div className="flex flex-wrap gap-2 mb-4">
                  {BOOKING_FILTERS.map((s) => (
                    <button
                      key={s || 'all'}
                      type="button"
                      onClick={() => setBookingFilter(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${bookingFilter === s ? 'bg-[#0a1629] text-white border-[#0a1629]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    >
                      {s || 'All'}
                    </button>
                  ))}
                </div>
                {bookingsLoading ? (
                  <div className="flex justify-center py-20 text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
                ) : (
                  <BookingsTable bookings={bookings} onStatus={changeStatus} busyId={busyId} showHotel={hotels.length > 1} />
                )}
              </>
            )}
          </>
        )}
      </div>
      <Footer />
    </main>
  );
}
