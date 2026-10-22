"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Loader2, Edit, Trash2, ImagePlus, X, GalleryHorizontal } from "lucide-react";
import StatusBadge from "@/components/BookingStatusBadge";
import { HeroHeading } from "@/app/landing/com/HotelHero";
import { adminFetch } from "./adminFetch";
import { compressImage } from "@/lib/compressImage";

const EMPTY = { id: null, title: "", highlight: "", subtitle: "", sort_order: 0, status: "ACTIVE", image: null };

const inputCls = "w-full px-3 py-2.5 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900";

export default function HeroSlidesManagement() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null); // null = list only, otherwise the slide being added / edited
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch("/api/admin/hero-slides");
      if (data.success) setSlides(data.data);
      else setError(data.error);
    } catch {
      // redirected to login
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const openForm = (slide = EMPTY) => {
    setForm({ ...slide, highlight: slide.highlight || "", subtitle: slide.subtitle || "" });
    setFile(null);
    setError("");
    setNotice("");
    window.scrollTo?.({ top: 0 });
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.id && !file) return setError("Please upload a banner image");
    setSaving(true);
    setError("");
    const fd = new FormData();
    for (const key of ["title", "highlight", "subtitle", "sort_order", "status"]) fd.append(key, String(form[key] ?? ""));
    if (file) fd.append("image", await compressImage(file, { maxWidth: 1920 }));
    try {
      const data = await adminFetch(form.id ? `/api/admin/hero-slides/${form.id}` : "/api/admin/hero-slides", {
        method: form.id ? "PUT" : "POST",
        body: fd,
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

  const remove = async (s) => {
    if (!confirm(`Delete the slide "${s.title}"?`)) return;
    setError("");
    const data = await adminFetch(`/api/admin/hero-slides/${s.id}`, { method: "DELETE" }).catch((e) => ({ error: e.message }));
    if (data.success) {
      setNotice("Slide deleted");
      load();
    } else setError(data.error || "Delete failed");
  };

  const shownImage = preview || form?.image || null;
  const activeCount = slides.filter((s) => s.status === "ACTIVE").length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Hero Slides</h1>
          <p className="text-sm text-slate-500 mt-1">
            The home page banner scrolls through the active slides every few seconds. {activeCount} active.
          </p>
        </div>
        <button type="button" onClick={() => openForm()} className="px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add slide
        </button>
      </div>

      {notice && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md p-3 text-sm mb-4">{notice}</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm mb-4">{error}</div>}

      {form && (
        <form onSubmit={save} className="bg-white border border-slate-200 rounded-lg p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">{form.id ? "Edit slide" : "New slide"}</h2>
            <button type="button" onClick={() => setForm(null)} className="text-slate-400 hover:text-slate-700" aria-label="Close"><X className="w-5 h-5" /></button>
          </div>

          {/* Live preview of how the banner will look */}
          <div
            className="relative w-full h-56 rounded-lg overflow-hidden bg-slate-200 bg-cover bg-center mb-4 flex items-center justify-center text-slate-400"
            style={shownImage ? { backgroundImage: `url('${shownImage}')` } : undefined}
          >
            {shownImage ? (
              <>
                <div className="absolute inset-0 bg-gradient-to-b from-[#0f2a1d]/75 via-[#0f2a1d]/35 to-transparent" />
                <div className="relative z-10 self-start w-full p-6">
                  <HeroHeading slide={form} className="text-2xl md:text-3xl" />
                  {form.subtitle && <p className="text-white/90 text-sm mt-2 max-w-xl">{form.subtitle}</p>}
                </div>
              </>
            ) : (
              <span className="flex flex-col items-center gap-1 text-sm"><ImagePlus className="w-8 h-8" /> Upload a wide banner image</span>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <label className="block md:col-span-2">
              <span className="block text-sm font-medium text-slate-700 mb-1.5">Banner image {!form.id && <span className="text-red-500">*</span>}</span>
              <input type="file" accept="image/*" onChange={(e) => e.target.files[0] && setFile(e.target.files[0])} className="text-sm" />
              <span className="block text-xs text-slate-400 mt-1">Wide landscape photo, at least 1600 px wide. JPG / PNG / WEBP up to 5 MB.</span>
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-slate-700 mb-1.5">Heading <span className="text-red-500">*</span></span>
              <input required maxLength={150} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} placeholder="Stay close to nature" />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-slate-700 mb-1.5">Highlighted words</span>
              <input maxLength={60} value={form.highlight} onChange={(e) => setForm({ ...form, highlight: e.target.value })} className={inputCls} placeholder="nature" />
              <span className="block text-xs text-slate-400 mt-1">Part of the heading shown in gold. Leave empty for none.</span>
            </label>
            <label className="block md:col-span-2">
              <span className="block text-sm font-medium text-slate-700 mb-1.5">Sub-heading</span>
              <input maxLength={255} value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className={inputCls} />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-slate-700 mb-1.5">Display order</span>
              <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} className={inputCls} />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-slate-700 mb-1.5">Status</span>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputCls}>
                <option value="ACTIVE">Active (shown)</option>
                <option value="INACTIVE">Inactive (hidden)</option>
              </select>
            </label>
            <div className="md:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={() => setForm(null)} className="px-5 py-2.5 text-sm font-medium border border-slate-300 rounded-md bg-white hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={saving} className="px-6 py-2.5 text-sm font-semibold bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white rounded-md flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-20 text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : slides.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
          <GalleryHorizontal className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No slides yet. The home page shows a default banner until you add one.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {slides.map((s) => (
            <div key={s.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="relative h-36 bg-slate-100 bg-cover bg-center" style={{ backgroundImage: `url('${s.image}')` }}>
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent" />
                <div className="relative p-3"><HeroHeading slide={s} className="text-base" /></div>
              </div>
              <div className="p-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 truncate">{s.subtitle || "No sub-heading"}</p>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">Order {s.sort_order} <StatusBadge status={s.status} /></p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button type="button" onClick={() => openForm(s)} title="Edit" className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"><Edit className="w-4 h-4" /></button>
                  <button type="button" onClick={() => remove(s)} title="Delete" className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
