"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, TrendingUp, Phone, Mail, Building2, Eye } from 'lucide-react';

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/leads');
      const data = await res.json();
      if (data.success) setLeads(data.data);
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 border border-slate-200 rounded-lg shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Leads</p>
            <p className="text-2xl font-semibold text-slate-900">{loading ? '—' : leads.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 border border-slate-200 rounded-lg shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
            <Eye className="w-6 h-6 text-slate-700" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Interested Buyers/Tenants</p>
            <p className="text-2xl font-semibold text-slate-900">{loading ? '—' : new Set(leads.map((l) => l.user_id)).size}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-white">
          <h2 className="text-lg font-semibold text-slate-900">Leads</h2>
          <p className="text-sm text-slate-500 mt-1">Logged-in users and the properties they&apos;ve viewed.</p>
        </div>

        <div className="p-6">
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                <Loader2 className="animate-spin w-8 h-8 mb-2" />
                <span className="text-sm">Loading leads...</span>
              </div>
            ) : leads.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
                <TrendingUp className="w-10 h-10 text-slate-300 mb-3" />
                <p className="text-sm">No leads yet. Leads appear here once a logged-in user views a property.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="px-6 py-3">User</th>
                      <th className="px-6 py-3">Property</th>
                      <th className="px-6 py-3">Views</th>
                      <th className="px-6 py-3">Last Viewed</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-slate-600 divide-y divide-slate-100 bg-white">
                    {leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{lead.user_name}</div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                            <Phone className="w-3 h-3" /> {lead.user_phone}
                          </div>
                          {lead.user_email && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                              <Mail className="w-3 h-3" /> {lead.user_email}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {lead.image ? (
                              <div className="w-10 h-10 rounded-md overflow-hidden border border-slate-200 shrink-0">
                                <img src={lead.image} alt={lead.property_title} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
                                <Building2 className="w-4 h-4 text-slate-300" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-slate-900">{lead.property_title}</div>
                              <div className="text-xs text-slate-400">
                                {lead.listing_type === 'RENT' ? 'For Rent' : 'For Sale'} &middot; {lead.price ? `₹${Number(lead.price).toLocaleString('en-IN')}` : 'N/A'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-900">{lead.view_count}</td>
                        <td className="px-6 py-4 text-slate-500">
                          {new Date(lead.last_viewed_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
    </div>
  );
}
