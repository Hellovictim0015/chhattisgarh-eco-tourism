"use client";

import StatusBadge from '@/components/BookingStatusBadge';
import { formatDay, rupees } from '@/lib/dates';

// The actions offered for each status (mirrors the allowed transitions on the server)
const ACTIONS = {
  PENDING: [
    { status: 'CONFIRMED', label: 'Confirm', cls: 'bg-emerald-700 text-white hover:bg-emerald-800' },
    { status: 'REJECTED', label: 'Reject', cls: 'border border-red-300 text-red-600 hover:bg-red-50' },
  ],
  CONFIRMED: [
    { status: 'COMPLETED', label: 'Checked out', cls: 'bg-sky-600 text-white hover:bg-sky-700' },
    { status: 'CANCELLED', label: 'Cancel', cls: 'border border-slate-300 text-slate-600 hover:bg-slate-50' },
  ],
};

// Booking list for hotel owners and admins. onStatus(booking, newStatus) performs the change.
export default function BookingsTable({ bookings, onStatus, busyId, showHotel = true }) {
  if (bookings.length === 0) {
    return <div className="bg-white border border-slate-200 rounded-lg p-10 text-center text-sm text-slate-500">No bookings found.</div>;
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
      <table className="w-full text-sm min-w-[860px]">
        <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
          <tr>
            <th className="text-left font-semibold px-4 py-3">Booking</th>
            <th className="text-left font-semibold px-4 py-3">Guest</th>
            {showHotel && <th className="text-left font-semibold px-4 py-3">Hotel / Room</th>}
            <th className="text-left font-semibold px-4 py-3">Stay</th>
            <th className="text-right font-semibold px-4 py-3">Amount</th>
            <th className="text-left font-semibold px-4 py-3">Status</th>
            <th className="text-right font-semibold px-4 py-3">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {bookings.map((b) => (
            <tr key={b.id} className="align-top">
              <td className="px-4 py-3">
                <span className="font-mono font-semibold text-slate-900">{b.booking_code}</span>
                <span className="block text-xs text-slate-400">{new Date(b.created_at).toLocaleDateString('en-IN')}</span>
              </td>
              <td className="px-4 py-3">
                <span className="font-medium text-slate-900">{b.guest_name}</span>
                <a href={`tel:${b.guest_phone}`} className="block text-xs text-slate-500 hover:underline">{b.guest_phone}</a>
                {b.guest_email && <span className="block text-xs text-slate-400">{b.guest_email}</span>}
                {b.special_request && <span className="block text-xs text-amber-700 mt-1 max-w-[200px]">“{b.special_request}”</span>}
              </td>
              {showHotel && (
                <td className="px-4 py-3">
                  <span className="font-medium text-slate-900">{b.hotel_name}</span>
                  <span className="block text-xs text-slate-500">{b.room_name} × {b.rooms_count}</span>
                </td>
              )}
              <td className="px-4 py-3 whitespace-nowrap">
                {formatDay(b.check_in)} → {formatDay(b.check_out)}
                <span className="block text-xs text-slate-500">
                  {b.nights} night{b.nights > 1 ? 's' : ''} · {b.guests} guest{b.guests > 1 ? 's' : ''}
                  {!showHotel && ` · ${b.room_name} × ${b.rooms_count}`}
                </span>
              </td>
              <td className="px-4 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">{rupees(b.total_amount)}</td>
              <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  {(ACTIONS[b.status] || []).map((a) => (
                    <button
                      key={a.status}
                      type="button"
                      disabled={busyId === b.id}
                      onClick={() => onStatus(b, a.status)}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap disabled:opacity-50 ${a.cls}`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
