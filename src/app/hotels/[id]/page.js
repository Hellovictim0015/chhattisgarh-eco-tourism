"use client";

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { dayFromToday, addDays, nightsBetween, formatDay, rupees } from '@/lib/dates';
import {
  MapPin, Star, Loader2, Hotel, Users, BedDouble, CheckCircle2, Clock, Phone, Mail,
  ChevronLeft, ChevronRight, X, CalendarDays, ShieldCheck, AlertCircle,
} from 'lucide-react';

function HotelDetailContent() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Dates from the URL are ignored when they are in the past
  const [checkIn, setCheckIn] = useState(() => {
    const d = searchParams.get('check_in');
    return d && d >= dayFromToday() ? d : dayFromToday();
  });
  const [checkOut, setCheckOut] = useState(() => {
    const d = searchParams.get('check_out');
    return d && d > dayFromToday() ? d : dayFromToday(1);
  });
  const [guests, setGuests] = useState(Number(searchParams.get('guests')) || 2);

  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [dateError, setDateError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);

  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [roomsCount, setRoomsCount] = useState(1);
  const [guest, setGuest] = useState({ guest_name: '', guest_phone: '', guest_email: '', special_request: '' });
  const [booking, setBooking] = useState({ state: 'idle', message: '', data: null }); // idle | sending | done | error

  const nights = nightsBetween(checkIn, checkOut);

  // Reload the hotel (with per-room availability) whenever the dates change
  useEffect(() => {
    if (!id) return;
    if (nights < 1) {
      setCheckOut(addDays(checkIn, 1));
      return;
    }
    setDateError('');
    const load = async () => {
      setRoomsLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`/api/hotels/${id}?check_in=${checkIn}&check_out=${checkOut}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (res.status === 404) setNotFound(true);
        else if (!data.success) setDateError(data.error || 'Could not check availability');
        else setHotel(data.data);
      } catch {
        setDateError('Could not check availability. Please try again.');
      } finally {
        setRoomsLoading(false);
        setLoading(false);
      }
    };
    load();
  }, [id, checkIn, checkOut, nights]);

  // Prefill guest details for logged-in users
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('authUser') || 'null');
      if (user) setGuest((g) => ({ ...g, guest_name: user.name || '', guest_phone: user.phone || '', guest_email: user.email || '' }));
    } catch {
      // ignore a corrupt stored user
    }
  }, []);

  const selectedRoom = hotel?.rooms.find((r) => r.id === selectedRoomId) || null;
  // If availability drops below what was chosen, clamp the room count
  const maxRooms = selectedRoom ? Math.max(1, Math.min(selectedRoom.available ?? 1, 10)) : 1;
  const effectiveRooms = Math.min(roomsCount, maxRooms);
  const total = selectedRoom ? Number(selectedRoom.price_per_night) * nights * effectiveRooms : 0;
  const capacity = selectedRoom ? selectedRoom.max_guests * effectiveRooms : 0;

  const images = useMemo(() => hotel?.images || [], [hotel]);

  const chooseRoom = (room) => {
    setSelectedRoomId(room.id);
    setRoomsCount(Math.min(room.available, Math.max(1, Math.ceil(guests / room.max_guests))));
    setBooking({ state: 'idle', message: '', data: null });
    setTimeout(() => document.getElementById('booking-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const submitBooking = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('authToken');
    if (!token) {
      const back = `/hotels/${id}?check_in=${checkIn}&check_out=${checkOut}&guests=${guests}`;
      router.push(`/login?redirect=${encodeURIComponent(back)}`);
      return;
    }
    if (guests > capacity) {
      setBooking({ state: 'error', message: `This selection fits at most ${capacity} guests. Add another room.` });
      return;
    }
    setBooking({ state: 'sending', message: '' });
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          room_id: selectedRoom.id, check_in: checkIn, check_out: checkOut,
          rooms_count: effectiveRooms, guests, ...guest,
        }),
      });
      const data = await res.json();
      if (res.status === 401) {
        router.push(`/login?redirect=${encodeURIComponent(`/hotels/${id}?check_in=${checkIn}&check_out=${checkOut}&guests=${guests}`)}`);
        return;
      }
      if (!data.success) throw new Error(data.error || 'Booking failed');
      setBooking({ state: 'done', message: data.message, data: data.data });
    } catch (err) {
      setBooking({ state: 'error', message: err.message });
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 font-sans">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <span className="text-sm">Loading hotel...</span>
        </div>
        <Footer />
      </main>
    );
  }

  if (notFound || !hotel) {
    return (
      <main className="min-h-screen bg-slate-50 font-sans">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 text-center px-4">
          <Hotel className="w-12 h-12 text-slate-300 mb-4" />
          <h1 className="text-xl font-bold text-[#0a1629] mb-2">Hotel Not Found</h1>
          <p className="text-sm text-slate-500 mb-6">This stay may have been removed or is not yet approved.</p>
          <Link href="/hotels" className="bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold px-6 py-3 rounded-lg">
            Browse all stays
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  const inputCls = 'w-full bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-emerald-600';

  return (
    <main className="min-h-screen bg-slate-50 font-sans">
      <Navbar />

      {hotel.status !== 'ACTIVE' && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-800 text-sm text-center py-2 px-4">
          Preview only — this hotel is <b>{hotel.status.toLowerCase()}</b> and not visible to guests yet.
        </div>
      )}

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <nav className="text-xs text-slate-500 mb-3">
          <Link href="/" className="hover:underline">Home</Link> / <Link href="/hotels" className="hover:underline">Hotels</Link> / <span className="text-slate-700">{hotel.name}</span>
        </nav>

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase px-2 py-0.5 rounded">
                {hotel.hotel_type_name || 'Hotel'}
              </span>
              {hotel.star_rating ? (
                <span className="flex items-center gap-0.5">
                  {Array.from({ length: hotel.star_rating }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-[#d9982b] text-[#d9982b]" />
                  ))}
                </span>
              ) : null}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#0a1629]">{hotel.name}</h1>
            <p className="flex items-center gap-1 text-sm text-slate-500 mt-1">
              <MapPin className="w-4 h-4 text-[#d9982b]" /> {[hotel.address, hotel.city].filter(Boolean).join(', ')}
            </p>
          </div>
          {hotel.rooms.length > 0 && (
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Starting from</span>
              <span className="text-2xl font-extrabold text-[#0a1629]">
                {rupees(Math.min(...hotel.rooms.map((r) => Number(r.price_per_night))))}
              </span>
              <span className="text-sm text-slate-500"> / night</span>
            </div>
          )}
        </div>

        {/* Gallery */}
        {images.length > 0 ? (
          <div className="grid grid-cols-4 grid-rows-2 gap-2 h-64 md:h-96 rounded-xl overflow-hidden mb-6">
            {images.slice(0, 5).map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => { setActiveImage(i); setGalleryOpen(true); }}
                className={`relative bg-slate-200 overflow-hidden ${i === 0 ? 'col-span-4 md:col-span-2 row-span-2' : 'hidden md:block'}`}
              >
                <img src={img.image} alt={`${hotel.name} ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                {i === 4 && images.length > 5 && (
                  <span className="absolute inset-0 bg-black/50 text-white font-semibold flex items-center justify-center">+{images.length - 5} photos</span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="h-48 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400 mb-6">
            <Hotel className="w-10 h-10" />
          </div>
        )}

        <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
          <div className="space-y-6 min-w-0">
            {/* Dates */}
            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="font-bold text-[#0a1629] mb-3 flex items-center gap-2"><CalendarDays className="w-4 h-4 text-emerald-700" /> Your stay</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <label className="text-xs font-semibold text-slate-500">
                  Check-in
                  <input
                    type="date"
                    value={checkIn}
                    min={dayFromToday()}
                    onChange={(e) => {
                      if (!e.target.value) return;
                      setCheckIn(e.target.value);
                      if (checkOut <= e.target.value) setCheckOut(addDays(e.target.value, 1));
                    }}
                    className={`${inputCls} mt-1`}
                  />
                </label>
                <label className="text-xs font-semibold text-slate-500">
                  Check-out
                  <input
                    type="date"
                    value={checkOut}
                    min={addDays(checkIn, 1)}
                    onChange={(e) => e.target.value && setCheckOut(e.target.value)}
                    className={`${inputCls} mt-1`}
                  />
                </label>
                <label className="text-xs font-semibold text-slate-500 col-span-2 sm:col-span-1">
                  Guests
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={guests}
                    onChange={(e) => setGuests(Math.max(1, Number(e.target.value) || 1))}
                    className={`${inputCls} mt-1`}
                  />
                </label>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {nights > 0 ? `${nights} night${nights > 1 ? 's' : ''}` : ''} · Check-in from {hotel.check_in_time}, check-out by {hotel.check_out_time}
              </p>
              {dateError && <p className="text-sm text-red-600 mt-2">{dateError}</p>}
            </section>

            {/* Rooms */}
            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="font-bold text-[#0a1629] mb-3 flex items-center gap-2">
                <BedDouble className="w-4 h-4 text-emerald-700" /> Choose your room
                {roomsLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
              </h2>
              {hotel.rooms.length === 0 ? (
                <p className="text-sm text-slate-500">No rooms are open for booking right now.</p>
              ) : (
                <div className="space-y-3">
                  {hotel.rooms.map((room) => {
                    const soldOut = room.available === 0;
                    const selected = room.id === selectedRoomId;
                    return (
                      <div
                        key={room.id}
                        className={`flex flex-col sm:flex-row gap-3 border rounded-lg p-3 ${selected ? 'border-emerald-600 ring-1 ring-emerald-600 bg-emerald-50/40' : 'border-slate-200'}`}
                      >
                        <div className="w-full sm:w-36 h-28 rounded-md overflow-hidden bg-slate-100 shrink-0">
                          {room.image ? (
                            <img src={room.image} alt={room.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300"><BedDouble className="w-7 h-7" /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-[#0a1629]">{room.name}</h3>
                          <p className="text-xs text-slate-500 flex flex-wrap gap-x-3 gap-y-1 mt-1">
                            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Up to {room.max_guests} guests</span>
                            {room.bed_type && <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" /> {room.bed_type}</span>}
                          </p>
                          {room.description && <p className="text-sm text-slate-600 mt-2 line-clamp-2">{room.description}</p>}
                          <p className={`text-xs font-semibold mt-2 ${soldOut ? 'text-red-600' : room.available <= 2 ? 'text-amber-600' : 'text-emerald-700'}`}>
                            {soldOut ? 'Sold out for these dates' : `${room.available} room${room.available > 1 ? 's' : ''} left`}
                          </p>
                        </div>
                        <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                          <div>
                            <span className="text-lg font-extrabold text-[#0a1629]">{rupees(room.price_per_night)}</span>
                            <span className="text-xs text-slate-500"> / night</span>
                          </div>
                          <button
                            type="button"
                            disabled={soldOut || nights < 1}
                            onClick={() => chooseRoom(room)}
                            className={`text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                              selected ? 'bg-emerald-700 text-white' : 'border border-emerald-700 text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            {selected ? 'Selected' : 'Select'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {hotel.description && (
              <section className="bg-white rounded-xl border border-slate-200 p-4">
                <h2 className="font-bold text-[#0a1629] mb-2">About this stay</h2>
                <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">{hotel.description}</p>
              </section>
            )}

            {hotel.amenities.length > 0 && (
              <section className="bg-white rounded-xl border border-slate-200 p-4">
                <h2 className="font-bold text-[#0a1629] mb-3">Facilities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {hotel.amenities.map((a) => (
                    <span key={a.id} className="flex items-center gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> {a.name}
                    </span>
                  ))}
                </div>
              </section>
            )}

            <section className="bg-white rounded-xl border border-slate-200 p-4">
              <h2 className="font-bold text-[#0a1629] mb-3">Policies & contact</h2>
              <div className="grid sm:grid-cols-2 gap-3 text-sm text-slate-600">
                <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400" /> Check-in {hotel.check_in_time} · Check-out {hotel.check_out_time}</span>
                <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-slate-400" /> Pay at hotel — no advance payment</span>
                {hotel.phone && <a href={`tel:${hotel.phone}`} className="flex items-center gap-2 hover:text-emerald-700"><Phone className="w-4 h-4 text-slate-400" /> {hotel.phone}</a>}
                {hotel.email && <a href={`mailto:${hotel.email}`} className="flex items-center gap-2 hover:text-emerald-700"><Mail className="w-4 h-4 text-slate-400" /> {hotel.email}</a>}
              </div>
              {hotel.policies && <p className="text-sm text-slate-600 whitespace-pre-line mt-3 pt-3 border-t border-slate-100">{hotel.policies}</p>}
            </section>
          </div>

          {/* Booking panel */}
          <aside id="booking-panel" className="bg-white rounded-xl border border-slate-200 p-4 lg:sticky lg:top-20 scroll-mt-20">
            {booking.state === 'done' ? (
              <div className="text-center py-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                <h2 className="text-lg font-bold text-[#0a1629]">Booking requested!</h2>
                <p className="text-sm text-slate-600 mt-1">{booking.message}</p>
                <div className="bg-slate-50 rounded-lg p-3 my-4 text-sm">
                  <span className="text-slate-500 block text-xs">Booking ID</span>
                  <span className="font-mono font-bold text-lg tracking-wider text-[#0a1629]">{booking.data.booking_code}</span>
                </div>
                <Link href="/my-bookings" className="block bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold py-2.5 rounded-lg">
                  View my bookings
                </Link>
              </div>
            ) : !selectedRoom ? (
              <div className="text-center py-6">
                <BedDouble className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Select your dates and a room to book.</p>
              </div>
            ) : (
              <form onSubmit={submitBooking} className="space-y-3">
                <h2 className="font-bold text-[#0a1629]">Book {selectedRoom.name}</h2>
                <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-slate-500">Dates</span><span className="font-medium">{formatDay(checkIn)} – {formatDay(checkOut)}</span></div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Rooms</span>
                    <select value={effectiveRooms} onChange={(e) => setRoomsCount(Number(e.target.value))} className="bg-white border border-slate-300 rounded px-2 py-1 text-sm">
                      {Array.from({ length: maxRooms }).map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                    </select>
                  </div>
                  <div className="flex justify-between"><span className="text-slate-500">Guests</span><span className="font-medium">{guests} (max {capacity})</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">{rupees(selectedRoom.price_per_night)} × {nights} night{nights > 1 ? 's' : ''} × {effectiveRooms}</span></div>
                  <div className="flex justify-between pt-2 mt-1 border-t border-slate-200 text-base">
                    <span className="font-bold">Total</span><span className="font-extrabold text-[#0a1629]">{rupees(total)}</span>
                  </div>
                </div>
                {guests > capacity && (
                  <p className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 rounded p-2">
                    <AlertCircle className="w-4 h-4 shrink-0" /> Too many guests for {effectiveRooms} room(s). Add a room or reduce guests.
                  </p>
                )}
                <input required placeholder="Full name *" value={guest.guest_name} onChange={(e) => setGuest({ ...guest, guest_name: e.target.value })} className={inputCls} />
                <input required type="tel" placeholder="Phone number *" value={guest.guest_phone} onChange={(e) => setGuest({ ...guest, guest_phone: e.target.value })} className={inputCls} />
                <input type="email" placeholder="Email (for confirmation)" value={guest.guest_email} onChange={(e) => setGuest({ ...guest, guest_email: e.target.value })} className={inputCls} />
                <textarea rows={2} placeholder="Special request (optional)" value={guest.special_request} onChange={(e) => setGuest({ ...guest, special_request: e.target.value })} className={inputCls} />
                {booking.state === 'error' && <p className="text-sm text-red-600">{booking.message}</p>}
                <button
                  type="submit"
                  disabled={booking.state === 'sending'}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
                >
                  {booking.state === 'sending' && <Loader2 className="w-4 h-4 animate-spin" />} Request booking
                </button>
                <p className="text-[11px] text-slate-500 text-center">No payment now — pay at the hotel. The hotel confirms your booking.</p>
              </form>
            )}
          </aside>
        </div>
      </div>

      {/* Fullscreen gallery */}
      {galleryOpen && images.length > 0 && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center" onClick={() => setGalleryOpen(false)}>
          <button type="button" className="absolute top-4 right-4 text-white/80 hover:text-white" aria-label="Close"><X className="w-7 h-7" /></button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setActiveImage((i) => (i - 1 + images.length) % images.length); }}
            className="absolute left-3 text-white/80 hover:text-white" aria-label="Previous"
          >
            <ChevronLeft className="w-9 h-9" />
          </button>
          <img src={images[activeImage].image} alt="" className="max-h-[85vh] max-w-[90vw] object-contain" onClick={(e) => e.stopPropagation()} />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setActiveImage((i) => (i + 1) % images.length); }}
            className="absolute right-3 text-white/80 hover:text-white" aria-label="Next"
          >
            <ChevronRight className="w-9 h-9" />
          </button>
          <span className="absolute bottom-4 text-white/70 text-sm">{activeImage + 1} / {images.length}</span>
        </div>
      )}

      <Footer />
    </main>
  );
}

export default function HotelDetailPage() {
  return (
    <Suspense fallback={null}>
      <HotelDetailContent />
    </Suspense>
  );
}
