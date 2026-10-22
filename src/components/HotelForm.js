"use client";

import { useEffect, useState } from 'react';
import { Plus, Trash2, Loader2, ArrowLeft, ImagePlus, X, BedDouble } from 'lucide-react';

const EMPTY_ROOM = { name: '', description: '', price_per_night: '', max_guests: 2, total_rooms: 1, bed_type: '', status: 'ACTIVE', image: null };

const inputCls = 'w-full px-3 py-2.5 bg-white border border-slate-300 rounded-md text-sm placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:ring-1 focus:ring-emerald-700';

// Module-level so inputs keep focus between renders
const Field = ({ label, required, children, className = '' }) => (
  <label className={`block ${className}`}>
    <span className="block text-sm font-medium text-slate-700 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </span>
    {children}
  </label>
);

// Shows a picked File (or an existing URL) as a thumbnail
function Thumb({ file, url, onRemove }) {
  const [src, setSrc] = useState(url || null);
  useEffect(() => {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setSrc(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  return (
    <div className="relative w-24 h-20 rounded-md overflow-hidden bg-slate-100 border border-slate-200">
      {src && <img src={src} alt="" className="w-full h-full object-cover" />}
      {onRemove && (
        <button type="button" onClick={onRemove} className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center" aria-label="Remove image">
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

// Add / edit form for a hotel and its room types.
//   apiBase:  "/api/owner/hotels" or "/api/admin/hotels"
//   token:    Bearer token for that API
//   hotelId:  edit this hotel (omit to create)
//   isAdmin:  shows status + featured controls
//   onDone(message), onCancel()
export default function HotelForm({ apiBase, token, hotelId = null, isAdmin = false, onDone, onCancel }) {
  const [form, setForm] = useState({
    name: '', hotel_type: 'HOTEL', description: '', city: '', address: '', star_rating: '',
    phone: '', email: '', check_in_time: '12:00', check_out_time: '11:00', policies: '',
    status: 'ACTIVE', is_featured: false,
  });
  const [amenities, setAmenities] = useState([]);
  const [stayTypes, setStayTypes] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [existingImages, setExistingImages] = useState([]); // URLs already saved
  const [newImages, setNewImages] = useState([]); // File objects
  const [rooms, setRooms] = useState([{ ...EMPTY_ROOM }]);
  const [roomFiles, setRoomFiles] = useState({}); // room index -> File
  const [loading, setLoading] = useState(!!hotelId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/amenities').then((r) => r.json()).then((d) => d.success && setAmenities(d.data)).catch(() => {});
    fetch('/api/stay-types')
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        setStayTypes(d.data);
        // New hotels default to the first available type
        if (!hotelId && d.data.length) setForm((f) => (d.data.some((t) => t.code === f.hotel_type) ? f : { ...f, hotel_type: d.data[0].code }));
      })
      .catch(() => {});
  }, [hotelId]);

  useEffect(() => {
    if (!hotelId) return;
    const load = async () => {
      try {
        const res = await fetch(`${apiBase}/${hotelId}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Could not load hotel');
        const h = data.data;
        setForm({
          name: h.name || '', hotel_type: h.hotel_type || 'HOTEL', description: h.description || '',
          city: h.city || '', address: h.address || '', star_rating: h.star_rating || '',
          phone: h.phone || '', email: h.email || '', check_in_time: h.check_in_time || '12:00',
          check_out_time: h.check_out_time || '11:00', policies: h.policies || '',
          status: h.status, is_featured: !!h.is_featured,
        });
        setSelectedAmenities(h.amenities.map((a) => a.id));
        setExistingImages(h.images.map((i) => i.image));
        setRooms(h.rooms.length ? h.rooms.map((r) => ({ ...r, price_per_night: Number(r.price_per_night) })) : [{ ...EMPTY_ROOM }]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [hotelId, apiBase, token]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const setRoom = (i, key, value) => setRooms((list) => list.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));

  const removeRoom = (i) => {
    setRooms((list) => list.filter((_, idx) => idx !== i));
    // Re-key the picked room images so they stay with their rooms
    setRoomFiles((files) => {
      const next = {};
      for (const [k, f] of Object.entries(files)) {
        const n = Number(k);
        if (n < i) next[n] = f;
        else if (n > i) next[n - 1] = f;
      }
      return next;
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (rooms.length === 0) return setError('Add at least one room type');

    const fd = new FormData();
    for (const key of ['name', 'hotel_type', 'description', 'city', 'address', 'star_rating', 'phone', 'email', 'check_in_time', 'check_out_time', 'policies']) {
      fd.append(key, form[key] ?? '');
    }
    if (isAdmin) {
      fd.append('status', form.status);
      fd.append('is_featured', form.is_featured ? '1' : '0');
    }
    fd.append('amenities', selectedAmenities.join(','));
    fd.append('existing_images', JSON.stringify(existingImages));
    newImages.forEach((f) => fd.append('images', f));
    fd.append('rooms', JSON.stringify(rooms.map(({ id, name, description, price_per_night, max_guests, total_rooms, bed_type, status, image }) => (
      { id, name, description, price_per_night, max_guests, total_rooms, bed_type, status, image }
    ))));
    Object.entries(roomFiles).forEach(([i, f]) => fd.append(`room_image_${i}`, f));

    setSaving(true);
    try {
      const res = await fetch(hotelId ? `${apiBase}/${hotelId}` : apiBase, {
        method: hotelId ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Could not save hotel');
      onDone?.(data.message);
    } catch (err) {
      setError(err.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="flex items-center gap-3">
        {onCancel && (
          <button type="button" onClick={onCancel} className="w-9 h-9 rounded-md border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50" aria-label="Back">
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <h2 className="text-xl font-semibold text-slate-900">{hotelId ? 'Edit hotel' : 'Add a new hotel'}</h2>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}

      <section className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
        <h3 className="font-semibold text-slate-900">Basic details</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Hotel name" required className="md:col-span-2">
            <input required value={form.name} onChange={set('name')} className={inputCls} placeholder="e.g. Chitrakote Jungle Resort" />
          </Field>
          <Field label="Stay type" required>
            <select value={form.hotel_type} onChange={set('hotel_type')} className={inputCls}>
              {stayTypes.map((t) => <option key={t.code} value={t.code}>{t.name}</option>)}
              {/* keep a hotel's current type selectable even if it has since been deactivated */}
              {form.hotel_type && stayTypes.length > 0 && !stayTypes.some((t) => t.code === form.hotel_type) && (
                <option value={form.hotel_type}>{form.hotel_type}</option>
              )}
            </select>
          </Field>
          <Field label="Star rating">
            <select value={form.star_rating} onChange={set('star_rating')} className={inputCls}>
              <option value="">Not rated</option>
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} star</option>)}
            </select>
          </Field>
          <Field label="City / district" required>
            <input required value={form.city} onChange={set('city')} className={inputCls} placeholder="e.g. Jagdalpur" />
          </Field>
          <Field label="Address / landmark">
            <input value={form.address} onChange={set('address')} className={inputCls} />
          </Field>
          <Field label="Contact phone">
            <input value={form.phone} onChange={set('phone')} className={inputCls} />
          </Field>
          <Field label="Contact email">
            <input type="email" value={form.email} onChange={set('email')} className={inputCls} />
          </Field>
          <Field label="Check-in time">
            <input type="time" value={form.check_in_time} onChange={set('check_in_time')} className={inputCls} />
          </Field>
          <Field label="Check-out time">
            <input type="time" value={form.check_out_time} onChange={set('check_out_time')} className={inputCls} />
          </Field>
          <Field label="Description" className="md:col-span-2">
            <textarea rows={4} value={form.description} onChange={set('description')} className={inputCls} />
          </Field>
          <Field label="Policies (cancellation, ID proof, pets...)" className="md:col-span-2">
            <textarea rows={3} value={form.policies} onChange={set('policies')} className={inputCls} />
          </Field>
          {isAdmin && (
            <>
              <Field label="Status">
                <select value={form.status} onChange={set('status')} className={inputCls}>
                  <option value="ACTIVE">Active (visible & bookable)</option>
                  <option value="PENDING">Pending review</option>
                  <option value="INACTIVE">Inactive (hidden)</option>
                </select>
              </Field>
              <label className="flex items-center gap-2 text-sm text-slate-700 md:mt-7">
                <input type="checkbox" checked={form.is_featured} onChange={set('is_featured')} className="w-4 h-4 accent-emerald-700" />
                Feature on home page
              </label>
            </>
          )}
        </div>
      </section>

      <section className="bg-white rounded-lg border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-3">Photos</h3>
        <div className="flex flex-wrap gap-3">
          {existingImages.map((url) => (
            <Thumb key={url} url={url} onRemove={() => setExistingImages((l) => l.filter((u) => u !== url))} />
          ))}
          {newImages.map((file, i) => (
            <Thumb key={`${file.name}-${i}`} file={file} onRemove={() => setNewImages((l) => l.filter((_, idx) => idx !== i))} />
          ))}
          <label className="w-24 h-20 rounded-md border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 text-xs cursor-pointer hover:border-emerald-600 hover:text-emerald-700">
            <ImagePlus className="w-5 h-5 mb-1" /> Add photos
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => { setNewImages((l) => [...l, ...Array.from(e.target.files)]); e.target.value = ''; }}
            />
          </label>
        </div>
        <p className="text-xs text-slate-400 mt-2">The first photo is the cover. JPG / PNG / WEBP, up to 5 MB each.</p>
      </section>

      <section className="bg-white rounded-lg border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-3">Facilities</h3>
        {amenities.length === 0 ? (
          <p className="text-sm text-slate-400 italic">No facilities configured.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {amenities.map((a) => (
              <label key={a.id} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-emerald-700"
                  checked={selectedAmenities.includes(a.id)}
                  onChange={(e) => setSelectedAmenities((l) => (e.target.checked ? [...l, a.id] : l.filter((x) => x !== a.id)))}
                />
                {a.name}
              </label>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white rounded-lg border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-slate-900">Room types <span className="text-red-500">*</span></h3>
          <button type="button" onClick={() => setRooms((l) => [...l, { ...EMPTY_ROOM }])} className="text-sm font-semibold text-emerald-700 flex items-center gap-1 hover:underline">
            <Plus className="w-4 h-4" /> Add room type
          </button>
        </div>
        <div className="space-y-4">
          {rooms.map((room, i) => (
            <div key={room.id || `new-${i}`} className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-700 flex items-center gap-2"><BedDouble className="w-4 h-4" /> Room type {i + 1}</span>
                {rooms.length > 1 && (
                  <button type="button" onClick={() => removeRoom(i)} className="text-red-600 text-sm flex items-center gap-1 hover:underline">
                    <Trash2 className="w-4 h-4" /> Remove
                  </button>
                )}
              </div>
              <div className="grid md:grid-cols-4 gap-3">
                <Field label="Name" required className="md:col-span-2">
                  <input required value={room.name} onChange={(e) => setRoom(i, 'name', e.target.value)} className={inputCls} placeholder="e.g. Deluxe Cottage" />
                </Field>
                <Field label="Price / night (₹)" required>
                  <input required type="number" min="1" value={room.price_per_night} onChange={(e) => setRoom(i, 'price_per_night', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Bed type">
                  <input value={room.bed_type || ''} onChange={(e) => setRoom(i, 'bed_type', e.target.value)} className={inputCls} placeholder="Double / Twin" />
                </Field>
                <Field label="Max guests / room" required>
                  <input required type="number" min="1" value={room.max_guests} onChange={(e) => setRoom(i, 'max_guests', e.target.value)} className={inputCls} />
                </Field>
                <Field label="No. of rooms" required>
                  <input required type="number" min="1" value={room.total_rooms} onChange={(e) => setRoom(i, 'total_rooms', e.target.value)} className={inputCls} />
                </Field>
                <Field label="Booking">
                  <select value={room.status} onChange={(e) => setRoom(i, 'status', e.target.value)} className={inputCls}>
                    <option value="ACTIVE">Open</option>
                    <option value="INACTIVE">Closed</option>
                  </select>
                </Field>
                <div>
                  <span className="block text-sm font-medium text-slate-700 mb-1.5">Photo</span>
                  <div className="flex items-center gap-2">
                    {(roomFiles[i] || room.image) && <Thumb key={roomFiles[i]?.name || room.image} file={roomFiles[i]} url={roomFiles[i] ? null : room.image} />}
                    <label className="text-xs font-semibold text-emerald-700 cursor-pointer hover:underline">
                      {roomFiles[i] || room.image ? 'Change' : 'Upload'}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && setRoomFiles((f) => ({ ...f, [i]: e.target.files[0] }))} />
                    </label>
                  </div>
                </div>
                <Field label="Description" className="md:col-span-4">
                  <textarea rows={2} value={room.description || ''} onChange={(e) => setRoom(i, 'description', e.target.value)} className={inputCls} />
                </Field>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-5 py-2.5 text-sm font-medium border border-slate-300 rounded-md bg-white hover:bg-slate-50">Cancel</button>
        )}
        <button type="submit" disabled={saving} className="px-6 py-2.5 text-sm font-semibold bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white rounded-md flex items-center gap-2">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />} {hotelId ? 'Save changes' : isAdmin ? 'Add hotel' : 'Submit for review'}
        </button>
      </div>
    </form>
  );
}
