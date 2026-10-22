"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Loader2, Edit, Trash2, ImagePlus, X, Layers } from "lucide-react";
import StatusBadge from "@/components/BookingStatusBadge";
import { adminFetch } from "./adminFetch";
import { compressImage } from "@/lib/compressImage";

const EMPTY = { id: null, name: "", code: "", sort_order: 0, status: "ACTIVE", image: null };

const inputCls = "w-full px-3 py-2.5 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900";

export default function StayTypesManagement() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null); // null = list only, otherwise the type being added / edited
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminFetch("/api/admin/stay-types");
      if (data.success) setTypes(data.data);
      else setError(data.error);
    } catch {
      // redirected to login
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Preview for a newly picked image
  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const openForm = (type = EMPTY) => {
    setForm({ ...type });
    setFile(null);
    setRemoveImage(false);
    setError("");
    setNotice("");
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("code", form.code || "");
    fd.append("sort_order", String(form.sort_order || 0));
    fd.append("status", form.status);
    if (file) fd.append("image", await compressImage(file, { maxWidth: 800 }));
    if (removeImage) fd.append("remove_image", "1");
    try {
      const data = await adminFetch(form.id ? `/api/admin/stay-types/${form.id}` : "/api/admin/stay-types", {
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

  const remove = async (t) => {
    if (!confirm(`Delete stay type "${t.name}"?`)) return;
    setError("");
    const data = await adminFetch(`/api/admin/stay-types/${t.id}`, { method: "DELETE" }).catch((e) => ({ error: e.message }));
    if (data.success) {
      setNotice("Stay type deleted");
      load();
    } else setError(data.error || "Delete failed");
  };

  const shownImage = preview || (!removeImage && form?.image) || null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Stay Types</h1>
          <p className="text-sm text-slate-500 mt-1">Shown in &quot;Browse by stay type&quot; on the home page and in hotel forms and filters.</p>
        </div>
        <button type="button" onClick={() => openForm()} className="px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add stay type
        </button>
      </div>

      {notice && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md p-3 text-sm mb-4">{notice}</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm mb-4">{error}</div>}

      {form && (
        <form onSubmit={save} className="bg-white border border-slate-200 rounded-lg p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">{form.id ? `Edit "${form.name}"` : "New stay type"}</h2>
            <button type="button" onClick={() => setForm(null)} className="text-slate-400 hover:text-slate-700" aria-label="Close"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid md:grid-cols-[180px_1fr] gap-5">
            <div>
              <div className="w-full aspect-[4/3] rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center text-slate-300">
                {shownImage ? <img src={shownImage} alt="" className="w-full h-full object-cover" /> : <ImagePlus className="w-8 h-8" />}
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs font-semibold">
                <label className="text-slate-700 cursor-pointer hover:underline">
                  {shownImage ? "Change image" : "Upload image"}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files[0]) { setFile(e.target.files[0]); setRemoveImage(false); } e.target.value = ""; }} />
                </label>
                {shownImage && (
                  <button type="button" onClick={() => { setFile(null); setRemoveImage(true); }} className="text-red-600 hover:underline">Remove</button>
                )}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 content-start">
              <label className="block">
                <span className="block text-sm font-medium text-slate-700 mb-1.5">Name <span className="text-red-500">*</span></span>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="e.g. Tree Houses" />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-slate-700 mb-1.5">Code</span>
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className={inputCls} placeholder="Auto from name, e.g. TREE_HOUSES" />
                <span className="block text-xs text-slate-400 mt-1">Used in links like /hotels?type=CODE</span>
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
              <div className="sm:col-span-2 flex justify-end gap-3">
                <button type="button" onClick={() => setForm(null)} className="px-5 py-2.5 text-sm font-medium border border-slate-300 rounded-md bg-white hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving} className="px-6 py-2.5 text-sm font-semibold bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white rounded-md flex items-center gap-2">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-20 text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : types.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
          <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No stay types yet. Add one to start listing hotels.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left font-semibold px-4 py-3">Stay type</th>
                <th className="text-left font-semibold px-4 py-3">Code</th>
                <th className="text-left font-semibold px-4 py-3">Order</th>
                <th className="text-left font-semibold px-4 py-3">Hotels</th>
                <th className="text-left font-semibold px-4 py-3">Status</th>
                <th className="text-right font-semibold px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {types.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-10 rounded bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center text-slate-300">
                        {t.image ? <img src={t.image} alt="" className="w-full h-full object-cover" /> : <ImagePlus className="w-4 h-4" />}
                      </div>
                      <span className="font-medium text-slate-900">{t.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{t.code}</td>
                  <td className="px-4 py-3 text-slate-600">{t.sort_order}</td>
                  <td className="px-4 py-3 text-slate-600">{t.hotel_count}</td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => openForm(t)} title="Edit" className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded"><Edit className="w-4 h-4" /></button>
                      <button type="button" onClick={() => remove(t)} title="Delete" className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
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
