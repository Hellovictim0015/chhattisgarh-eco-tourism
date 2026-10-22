"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import BookingsTable from "@/components/BookingsTable";
import { adminFetch } from "./adminFetch";

const FILTERS = ["", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "REJECTED"];

export default function BookingsManagement({ initialFilter = "" }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(initialFilter);
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter) params.set("status", filter);
      if (query) params.set("q", query);
      const data = await adminFetch(`/api/admin/bookings?${params.toString()}`);
      if (data.success) setBookings(data.data);
      else setError(data.error);
    } catch {
      // redirected to login
    } finally {
      setLoading(false);
    }
  }, [filter, query]);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (b, status) => {
    setBusyId(b.id);
    setError("");
    try {
      const data = await adminFetch(`/api/admin/bookings/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!data.success) throw new Error(data.error);
      setBookings((list) => list.map((x) => (x.id === b.id ? { ...x, status } : x)));
    } catch (err) {
      setError(err.message || "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Bookings</h1>
        <p className="text-sm text-slate-500 mt-1">All guest bookings across hotels. Payment is collected at the hotel.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
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
        <form onSubmit={(e) => { e.preventDefault(); setQuery(q.trim()); }} className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Booking ID, guest or phone"
            className="bg-white border border-slate-200 rounded-md py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-400 w-64"
          />
        </form>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm mb-4">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-20 text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : (
        <BookingsTable bookings={bookings} onStatus={changeStatus} busyId={busyId} />
      )}
    </div>
  );
}
