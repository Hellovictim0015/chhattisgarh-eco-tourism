"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2, ArrowUp, ArrowDown, X } from "lucide-react";
import { SOCIAL_NETWORKS } from "@/lib/footerDefaults";
import { adminFetch } from "./adminFetch";

const inputCls = "w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900";

const move = (list, i, step) => {
  const j = i + step;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
};

const Section = ({ title, hint, children }) => (
  <section className="bg-white border border-slate-200 rounded-lg p-5">
    <h2 className="font-semibold text-slate-900">{title}</h2>
    {hint && <p className="text-xs text-slate-500 mt-0.5 mb-4">{hint}</p>}
    <div className={hint ? "" : "mt-4"}>{children}</div>
  </section>
);

export default function FooterSettings() {
  const [footer, setFooter] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    adminFetch("/api/admin/settings")
      .then((d) => (d.success ? setFooter(d.data.footer) : setError(d.error)))
      .catch(() => {});
  }, []);

  const set = (key, value) => setFooter((f) => ({ ...f, [key]: value }));
  const setColumn = (ci, column) => set("columns", footer.columns.map((c, i) => (i === ci ? column : c)));
  const setLink = (ci, li, patch) => {
    const col = footer.columns[ci];
    setColumn(ci, { ...col, links: col.links.map((l, i) => (i === li ? { ...l, ...patch } : l)) });
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const data = await adminFetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ footer }),
      });
      if (!data.success) throw new Error(data.error);
      setFooter(data.data.footer);
      setNotice("Footer saved. Links with an empty name or address were dropped.");
    } catch (err) {
      setError(err.message || "Could not save");
    } finally {
      setSaving(false);
      window.scrollTo?.({ top: 0 });
    }
  };

  if (!footer) {
    return error
      ? <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm">{error}</div>
      : <div className="flex justify-center py-20 text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <form onSubmit={save} className="max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Footer</h1>
          <p className="text-sm text-slate-500 mt-1">Text, links and social media shown at the bottom of every page. The phone number comes from Settings → Call number.</p>
        </div>
        <button type="submit" disabled={saving} className="px-6 py-2.5 text-sm font-semibold bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white rounded-md flex items-center gap-2">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save footer
        </button>
      </div>

      {notice && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md p-3 text-sm">{notice}</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm">{error}</div>}

      <Section title="Text">
        <div className="grid md:grid-cols-2 gap-4">
          <label className="block md:col-span-2">
            <span className="block text-sm font-medium text-slate-700 mb-1.5">About line (next to the logo)</span>
            <input maxLength={300} value={footer.about} onChange={(e) => set("about", e.target.value)} className={inputCls} />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1.5">Email</span>
            <input type="email" maxLength={150} value={footer.email} onChange={(e) => set("email", e.target.value)} className={inputCls} placeholder="info@example.com (empty = hidden)" />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-slate-700 mb-1.5">Office hours</span>
            <input maxLength={100} value={footer.hours} onChange={(e) => set("hours", e.target.value)} className={inputCls} />
          </label>
          <label className="block md:col-span-2">
            <span className="block text-sm font-medium text-slate-700 mb-1.5">Address</span>
            <input maxLength={300} value={footer.address} onChange={(e) => set("address", e.target.value)} className={inputCls} />
          </label>
          <label className="block md:col-span-2">
            <span className="block text-sm font-medium text-slate-700 mb-1.5">Disclaimer</span>
            <textarea rows={3} maxLength={1000} value={footer.disclaimer} onChange={(e) => set("disclaimer", e.target.value)} className={inputCls} placeholder="Empty = hidden" />
          </label>
          <label className="block md:col-span-2">
            <span className="block text-sm font-medium text-slate-700 mb-1.5">Copyright line</span>
            <input maxLength={200} value={footer.copyright} onChange={(e) => set("copyright", e.target.value)} className={inputCls} placeholder={`Empty = "© ${new Date().getFullYear()} Chhattisgarh Eco Tourism. All rights reserved."`} />
          </label>
        </div>
      </Section>

      <Section title="Link columns" hint='Address can be a page on this site like /hotels or /collections/navratri-specials, or a full link starting with https://'>
        <div className="space-y-4">
          {footer.columns.map((col, ci) => (
            <div key={ci} className="border border-slate-200 rounded-md p-3">
              <div className="flex items-center gap-2 mb-3">
                <input value={col.title} maxLength={60} onChange={(e) => setColumn(ci, { ...col, title: e.target.value })} className={`${inputCls} font-semibold`} placeholder="Column heading" />
                <button type="button" disabled={ci === 0} onClick={() => set("columns", move(footer.columns, ci, -1))} className="p-2 text-slate-500 hover:bg-slate-100 rounded disabled:opacity-30" title="Move column left"><ArrowUp className="w-4 h-4" /></button>
                <button type="button" disabled={ci === footer.columns.length - 1} onClick={() => set("columns", move(footer.columns, ci, 1))} className="p-2 text-slate-500 hover:bg-slate-100 rounded disabled:opacity-30" title="Move column right"><ArrowDown className="w-4 h-4" /></button>
                <button type="button" onClick={() => set("columns", footer.columns.filter((_, i) => i !== ci))} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete column"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="space-y-2">
                {col.links.map((link, li) => (
                  <div key={li} className="grid grid-cols-[1fr_1.4fr_70px_auto] gap-2 items-center">
                    <input value={link.label} maxLength={60} onChange={(e) => setLink(ci, li, { label: e.target.value })} className={inputCls} placeholder="Link name" />
                    <input value={link.href} maxLength={500} onChange={(e) => setLink(ci, li, { href: e.target.value })} className={inputCls} placeholder="/hotels or https://…" />
                    <input value={link.badge || ""} maxLength={12} onChange={(e) => setLink(ci, li, { badge: e.target.value })} className={inputCls} placeholder="Badge" title="Optional small badge, e.g. FREE or NEW" />
                    <div className="flex">
                      <button type="button" disabled={li === 0} onClick={() => setColumn(ci, { ...col, links: move(col.links, li, -1) })} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded disabled:opacity-30" title="Move up"><ArrowUp className="w-4 h-4" /></button>
                      <button type="button" disabled={li === col.links.length - 1} onClick={() => setColumn(ci, { ...col, links: move(col.links, li, 1) })} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded disabled:opacity-30" title="Move down"><ArrowDown className="w-4 h-4" /></button>
                      <button type="button" onClick={() => setColumn(ci, { ...col, links: col.links.filter((_, i) => i !== li) })} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="Remove link"><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
              {col.links.length < 12 && (
                <button type="button" onClick={() => setColumn(ci, { ...col, links: [...col.links, { label: "", href: "", badge: "" }] })} className="mt-2 text-sm font-semibold text-slate-700 flex items-center gap-1 hover:underline">
                  <Plus className="w-4 h-4" /> Add link
                </button>
              )}
            </div>
          ))}
          {footer.columns.length < 6 && (
            <button type="button" onClick={() => set("columns", [...footer.columns, { title: "", links: [{ label: "", href: "", badge: "" }] }])} className="px-4 py-2 text-sm font-semibold border border-slate-300 rounded-md hover:bg-slate-50 flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add column
            </button>
          )}
        </div>
      </Section>

      <Section title="Social media" hint="Paste the full page link. Icons with an empty link are hidden.">
        <div className="grid md:grid-cols-2 gap-4">
          {SOCIAL_NETWORKS.map(({ key, label }) => (
            <label key={key} className="block">
              <span className="block text-sm font-medium text-slate-700 mb-1.5">{label}</span>
              <input
                type="url"
                value={footer.socials[key] || ""}
                onChange={(e) => set("socials", { ...footer.socials, [key]: e.target.value })}
                className={inputCls}
                placeholder="https://"
              />
            </label>
          ))}
        </div>
      </Section>

      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="px-6 py-2.5 text-sm font-semibold bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white rounded-md flex items-center gap-2">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save footer
        </button>
      </div>
    </form>
  );
}
