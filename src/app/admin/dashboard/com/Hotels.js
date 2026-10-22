"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Loader2, Edit, Trash2, Eye, Star, Hotel, Check, Ban } from "lucide-react";
import HotelForm from "@/components/HotelForm";
import StatusBadge from "@/components/BookingStatusBadge";
import { rupees } from "@/lib/dates";
import { adminFetch, adminToken } from "./adminFetch";

const FILTERS = ["", "PENDING", "ACTIVE", "INACTIVE"];

export default function HotelsManagement({ initialFilter = "" }) {
  const [view, setView] = useState("list");
  const [editingId, setEditingId] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(initialFilter);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch(`/api/admin/hotels${filter ? `?status=${filter}` : ""}`);
      if (data.success) setHotels(data.data);
      else setError(data.error);
    } catch {
      // redirected to login
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const patch = async (h, body, message) => {
    setError("");
    const data = await adminFetch(`/api/admin/hotels/${h.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch((e) => ({ error: e.message }));
    if (data.success) {
      setNotice(message);
      load();
    } else setError(data.error || "Update failed");
  };

  const remove = async (h) => {
    const warn = Number(h.total_bookings) > 0 ? `\n\nIts ${h.total_bookings} booking(s) will also be deleted. Consider deactivating instead.` : "";
    if (!confirm(`Delete "${h.name}"?${warn}`)) return;
    const data = await adminFetch(`/api/admin/hotels/${h.id}`, { method: "DELETE" }).catch((e) => ({ error: e.message }));
    if (data.success) {
      setNotice("Hotel deleted");
      load();
    } else setError(data.error || "Delete failed");
  };

  if (view === "form") {
    return (
      <HotelForm
        apiBase="/api/admin/hotels"
        token={adminToken()}
        hotelId={editingId}
        isAdmin
        onCancel={() => setView("list")}
        onDone={(message) => { setView("list"); setNotice(message); load(); }}
      />
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Hotels</h1>
          <p className="text-sm text-slate-500 mt-1">Approve owner listings, add hotels and manage what guests can book.</p>
        </div>
        <button
          type="button"
          onClick={() => { setEditingId(null); setView("form"); setNotice(""); }}
          className="px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add hotel
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map((s) => (
          <button
            key={s || "all"}
            type="button"
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${filter === s ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {notice && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md p-3 text-sm mb-4">{notice}</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm mb-4">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-20 text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : hotels.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
          <Hotel className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No hotels {filter ? `with status ${filter.toLowerCase()}` : "yet"}.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left font-semibold px-4 py-3">Hotel</th>
                <th className="text-left font-semibold px-4 py-3">Owner</th>
                <th className="text-left font-semibold px-4 py-3">Rooms / Price</th>
                <th className="text-left font-semibold px-4 py-3">Bookings</th>
                <th className="text-left font-semibold px-4 py-3">Status</th>
                <th className="text-right font-semibold px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hotels.map((h) => (
                <tr key={h.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-11 rounded bg-slate-100 overflow-hidden shrink-0">
                        {h.image && <img src={h.image} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="min-w-0">
                        <span className="font-medium text-slate-900 block truncate max-w-[220px]">{h.name}</span>
                        <span className="text-xs text-slate-500">{h.hotel_type_name} · {h.city}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {h.owner_name ? <>{h.owner_name}<span className="block text-xs text-slate-400">{h.owner_phone}</span></> : <span className="text-slate-400">Admin</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{h.total_rooms} rooms<span className="block text-xs text-slate-400">from {h.min_price ? rupees(h.min_price) : "—"}</span></td>
                  <td className="px-4 py-3 text-slate-600">{h.total_bookings}<span className="block text-xs text-slate-400">{h.views} views</span></td>
                  <td className="px-4 py-3">
                    <StatusBadge status={h.status} />
                    {Number(h.is_featured) === 1 && <span className="block text-[11px] text-amber-600 font-semibold mt-1">★ Featured</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end items-center gap-1">
                      {h.status !== "ACTIVE" ? (
                        <button type="button" onClick={() => patch(h, { status: "ACTIVE" }, `"${h.name}" is now live`)} title="Approve / activate" className="px-2.5 py-1.5 bg-emerald-600 text-white rounded text-xs font-semibold flex items-center gap-1 hover:bg-emerald-700">
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                      ) : (
                        <button type="button" onClick={() => patch(h, { status: "INACTIVE" }, `"${h.name}" deactivated`)} title="Deactivate" className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded">
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => patch(h, { is_featured: !Number(h.is_featured) }, Number(h.is_featured) ? "Removed from featured" : "Featured on home page")}
                        title={Number(h.is_featured) ? "Unfeature" : "Feature on home page"}
                        className={`p-1.5 rounded hover:bg-amber-50 ${Number(h.is_featured) ? "text-amber-500" : "text-slate-400"}`}
                      >
                        <Star className={`w-4 h-4 ${Number(h.is_featured) ? "fill-amber-400" : ""}`} />
                      </button>
                      <Link href={`/hotels/${h.id}`} target="_blank" title="View" className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"><Eye className="w-4 h-4" /></Link>
                      <button type="button" onClick={() => { setEditingId(h.id); setView("form"); setNotice(""); }} title="Edit" className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"><Edit className="w-4 h-4" /></button>
                      <button type="button" onClick={() => remove(h)} title="Delete" className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
