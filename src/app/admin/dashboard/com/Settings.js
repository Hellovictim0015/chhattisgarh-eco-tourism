"use client";

import { useEffect, useState } from "react";
import { Loader2, Phone, MessageCircle } from "lucide-react";
import { adminFetch } from "./adminFetch";

const inputCls = "w-full pl-10 pr-3 py-2.5 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900";

export default function SettingsManagement() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    adminFetch("/api/admin/settings")
      .then((d) => (d.success ? setForm(d.data) : setError(d.error)))
      .catch(() => {});
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const data = await adminFetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!data.success) throw new Error(data.error);
      setForm(data.data);
      setNotice(data.message);
    } catch (err) {
      setError(err.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Contact numbers used by the Call and WhatsApp buttons on hotel pages.</p>
      </div>

      {notice && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md p-3 text-sm mb-4">{notice}</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm mb-4">{error}</div>}

      {!form ? (
        <div className="flex justify-center py-20 text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : (
        <form onSubmit={save} className="bg-white border border-slate-200 rounded-lg p-5 space-y-5">
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1.5">Call number</span>
            <span className="relative block">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="tel" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} className={inputCls} placeholder="+91 98765 43210" />
            </span>
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1.5">WhatsApp number</span>
            <span className="relative block">
              <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="tel" value={form.whatsapp_number} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} className={inputCls} placeholder="+91 98765 43210" />
            </span>
            <span className="block text-xs text-slate-400 mt-1">Include the country code (+91). A 10-digit number is treated as Indian.</span>
          </label>
          <p className="text-xs text-slate-500 bg-slate-50 rounded-md p-3">
            These are the default numbers for every hotel. To use a different number for one hotel, set its &quot;Contact phone&quot; and &quot;WhatsApp number&quot; in Hotels → Edit.
          </p>
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="px-6 py-2.5 text-sm font-semibold bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white rounded-md flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save settings
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
