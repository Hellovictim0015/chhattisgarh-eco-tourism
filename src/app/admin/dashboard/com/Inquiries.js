"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, MessageSquare, Phone, Mail, Building2, User as UserIcon } from 'lucide-react';

const STATUS_STYLES = {
  NEW: "bg-amber-50 text-amber-700 border-amber-200",
  CONTACTED: "bg-blue-50 text-blue-700 border-blue-200",
  SITE_VISIT: "bg-purple-50 text-purple-700 border-purple-200",
  CLOSED: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function Inquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/inquiries');
      const data = await res.json();
      if (data.success) setInquiries(data.data);
    } catch (err) {
      console.error('Error fetching inquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) fetchInquiries();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 bg-white">
        <h2 className="text-lg font-semibold text-slate-900">Property Inquiries</h2>
        <p className="text-sm text-slate-500 mt-1">Inquiries submitted from property pages (website and mobile app).</p>
      </div>

      <div className="p-6">
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
              <Loader2 className="animate-spin w-8 h-8 mb-2" />
              <span className="text-sm">Loading inquiries...</span>
            </div>
          ) : inquiries.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
              <MessageSquare className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-sm">No inquiries yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-3">Enquirer</th>
                    <th className="px-6 py-3">Property</th>
                    <th className="px-6 py-3">Message</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-slate-600 divide-y divide-slate-100 bg-white">
                  {inquiries.map((inq) => (
                    <tr key={inq.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                          {inq.user_id ? <UserIcon className="w-3.5 h-3.5 text-[#d9982b]" /> : null}
                          {inq.name}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                          <Phone className="w-3 h-3" /> {inq.phone}
                        </div>
                        {inq.email && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                            <Mail className="w-3 h-3" /> {inq.email}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {inq.image ? (
                            <div className="w-10 h-10 rounded-md overflow-hidden border border-slate-200 shrink-0">
                              <img src={inq.image} alt={inq.property_title} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
                              <Building2 className="w-4 h-4 text-slate-300" />
                            </div>
                          )}
                          <span className="font-medium text-slate-900">{inq.property_title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-[220px]">
                        <p className="truncate text-slate-500">{inq.message || '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={inq.status || 'NEW'}
                          onChange={(e) => updateStatus(inq.id, e.target.value)}
                          className={`text-[11px] font-bold uppercase px-2.5 py-1.5 rounded-full border cursor-pointer outline-none ${STATUS_STYLES[inq.status] || STATUS_STYLES.NEW}`}
                        >
                          <option value="NEW">New</option>
                          <option value="CONTACTED">Contacted</option>
                          <option value="SITE_VISIT">Site Visit</option>
                          <option value="CLOSED">Closed</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(inq.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
