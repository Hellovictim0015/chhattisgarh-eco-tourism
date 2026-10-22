"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Loader2, Edit, Trash2, X, ArrowUp, ArrowDown, Search, Rows3, Hotel, ExternalLink } from "lucide-react";
import StatusBadge from "@/components/BookingStatusBadge";
import { adminFetch } from "./adminFetch";

const EMPTY = { id: null, title: "", subtitle: "", status: "ACTIVE", hotels: [] };

const inputCls = "w-full px-3 py-2.5 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900";

// Moves item i of a list by `step` (-1 up, +1 down); returns a new list
const move = (list, i, step) => {
  const j = i + step;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
};

function Thumb({ hotel, className = "w-12 h-9" }) {
  return (
    <div className={`${className} rounded bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center text-slate-300`}>
      {hotel.image ? <img src={hotel.image} alt="" className="w-full h-full object-cover" /> : <Hotel className="w-4 h-4" />}
    </div>
  );
}

export default function HomeSectionsManagement() {
  const [sections, setSections] = useState([]);
  const [allHotels, setAllHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null); // section being added / edited
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, h] = await Promise.all([adminFetch("/api/admin/home-sections"), adminFetch("/api/admin/hotels")]);
      if (s.success) setSections(s.data);
      else setError(s.error);
      if (h.success) setAllHotels(h.data);
    } catch {
      // redirected to login
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openForm = (section = EMPTY) => {
    setForm({ ...section, subtitle: section.subtitle || "", hotels: [...section.hotels] });
    setQuery("");
    setError("");
    setNotice("");
  };

  // Hotels not yet in the section being edited, filtered by the search box
  const candidates = useMemo(() => {
    if (!form) return [];
    const chosen = new Set(form.hotels.map((h) => h.id));
    const q = query.trim().toLowerCase();
    return allHotels.filter((h) => !chosen.has(h.id) && (!q || `${h.name} ${h.city} ${h.hotel_type_name}`.toLowerCase().includes(q)));
  }, [allHotels, form, query]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const data = await adminFetch(form.id ? `/api/admin/home-sections/${form.id}` : "/api/admin/home-sections", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.title, subtitle: form.subtitle, status: form.status, hotel_ids: form.hotels.map((h) => h.id) }),
      });
      if (!data.success) throw new Error(data.error);
      setNotice(data.message);
      setForm(null);
      load();
    } catch (err) {
      setError(err.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const reorder = async (i, step) => {
    const next = move(sections, i, step);
    if (next === sections) return;
    setSections(next);
    setError("");
    const data = await adminFetch("/api/admin/home-sections/reorder", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: next.map((s) => s.id) }),
    }).catch((e) => ({ error: e.message }));
    if (!data.success) {
      setError(data.error || "Could not save the order");
      load();
    }
  };

  const remove = async (s) => {
    if (!confirm(`Delete the section "${s.title}"? The hotels themselves are not deleted.`)) return;
    const data = await adminFetch(`/api/admin/home-sections/${s.id}`, { method: "DELETE" }).catch((e) => ({ error: e.message }));
    if (data.success) {
      setNotice("Section deleted");
      load();
    } else setError(data.error || "Delete failed");
  };

  const iconBtn = "p-1.5 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Home Sections</h1>
          <p className="text-sm text-slate-500 mt-1">
            Rows of hotels on the home page, e.g. &quot;Navratri Specials&quot;. Pick the hotels for each section and use the arrows to set the order.
          </p>
        </div>
        <button type="button" onClick={() => openForm()} className="px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add section
        </button>
      </div>

      {notice && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md p-3 text-sm mb-4">{notice}</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm mb-4">{error}</div>}

      {form && (
        <form onSubmit={save} className="bg-white border border-slate-200 rounded-lg p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">{form.id ? `Edit "${form.title}"` : "New section"}</h2>
            <button type="button" onClick={() => setForm(null)} className="text-slate-400 hover:text-slate-700" aria-label="Close"><X className="w-5 h-5" /></button>
          </div>

          <div className="grid md:grid-cols-[2fr_2fr_1fr] gap-4 mb-5">
            <label className="block">
              <span className="block text-sm font-medium text-slate-700 mb-1.5">Section title <span className="text-red-500">*</span></span>
              <input required maxLength={150} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} placeholder="Navratri Specials" />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-slate-700 mb-1.5">Sub-title</span>
              <input maxLength={255} value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className={inputCls} placeholder="Festive stays near Maa Bamleshwari, Dongargarh" />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-slate-700 mb-1.5">Status</span>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputCls}>
                <option value="ACTIVE">Active (shown)</option>
                <option value="INACTIVE">Inactive (hidden)</option>
              </select>
            </label>
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            {/* Chosen hotels, in display order */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Hotels in this section ({form.hotels.length})</h3>
              <div className="border border-slate-200 rounded-md divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
                {form.hotels.length === 0 ? (
                  <p className="p-6 text-sm text-slate-400 text-center">No hotels yet — add them from the list.</p>
                ) : (
                  form.hotels.map((h, i) => (
                    <div key={h.id} className="flex items-center gap-3 p-2">
                      <span className="w-5 text-xs text-slate-400 text-right">{i + 1}</span>
                      <Thumb hotel={h} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{h.name}</p>
                        <p className="text-xs text-slate-500 truncate">{h.city}{h.status !== "ACTIVE" && <span className="text-amber-600"> · {h.status.toLowerCase()} (hidden on site)</span>}</p>
                      </div>
                      <button type="button" disabled={i === 0} onClick={() => setForm({ ...form, hotels: move(form.hotels, i, -1) })} className={iconBtn} title="Move up"><ArrowUp className="w-4 h-4" /></button>
                      <button type="button" disabled={i === form.hotels.length - 1} onClick={() => setForm({ ...form, hotels: move(form.hotels, i, 1) })} className={iconBtn} title="Move down"><ArrowDown className="w-4 h-4" /></button>
                      <button type="button" onClick={() => setForm({ ...form, hotels: form.hotels.filter((x) => x.id !== h.id) })} className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50" title="Remove"><X className="w-4 h-4" /></button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Hotels that can be added */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">Add hotels</h3>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, city or type" className={`${inputCls} pl-9`} />
              </div>
              <div className="border border-slate-200 rounded-md divide-y divide-slate-100 max-h-[372px] overflow-y-auto">
                {candidates.length === 0 ? (
                  <p className="p-6 text-sm text-slate-400 text-center">{allHotels.length ? "No more hotels match." : "No hotels yet."}</p>
                ) : (
                  candidates.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => setForm({ ...form, hotels: [...form.hotels, h] })}
                      className="w-full flex items-center gap-3 p-2 text-left hover:bg-emerald-50 group"
                    >
                      <Thumb hotel={h} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{h.name}</p>
                        <p className="text-xs text-slate-500 truncate">{h.hotel_type_name} · {h.city}{h.status !== "ACTIVE" && ` · ${h.status.toLowerCase()}`}</p>
                      </div>
                      <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1 opacity-70 group-hover:opacity-100"><Plus className="w-3.5 h-3.5" /> Add</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-5">
            <button type="button" onClick={() => setForm(null)} className="px-5 py-2.5 text-sm font-medium border border-slate-300 rounded-md bg-white hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 text-sm font-semibold bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white rounded-md flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save section
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-20 text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : sections.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
          <Rows3 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No sections yet. Add one to show hotels on the home page.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map((s, i) => (
            <div key={s.id} className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex md:flex-col items-center gap-1">
                <button type="button" disabled={i === 0} onClick={() => reorder(i, -1)} className={iconBtn} title="Move section up"><ArrowUp className="w-4 h-4" /></button>
                <span className="text-xs font-semibold text-slate-400 w-6 text-center">{i + 1}</span>
                <button type="button" disabled={i === sections.length - 1} onClick={() => reorder(i, 1)} className={iconBtn} title="Move section down"><ArrowDown className="w-4 h-4" /></button>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-slate-900">{s.title}</h3>
                  <StatusBadge status={s.status} />
                </div>
                {s.subtitle && <p className="text-sm text-slate-500 mt-0.5">{s.subtitle}</p>}
                <div className="flex items-center gap-1.5 mt-2">
                  {s.hotels.slice(0, 6).map((h) => <Thumb key={h.id} hotel={h} className="w-10 h-8" />)}
                  <span className="text-xs text-slate-500 ml-1">{s.hotels.length} hotel{s.hotels.length === 1 ? "" : "s"}</span>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Link href={`/collections/${s.slug}`} target="_blank" title="View on site" className={iconBtn}><ExternalLink className="w-4 h-4" /></Link>
                <button type="button" onClick={() => openForm(s)} title="Edit" className={iconBtn}><Edit className="w-4 h-4" /></button>
                <button type="button" onClick={() => remove(s)} title="Delete" className="p-1.5 rounded text-slate-500 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
