"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, Trash2, Mail, Phone, Eye } from 'lucide-react';

const STATUS_STYLES = {
  NEW: "bg-amber-50 text-amber-700 border-amber-200",
  READ: "bg-blue-50 text-blue-700 border-blue-200",
  RESPONDED: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function ContactMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/contact');
      const data = await res.json();
      if (data.success) setMessages(data.data);
    } catch (err) {
      console.error('Error fetching contact messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/admin/contact/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) fetchMessages();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleExpand = (msg) => {
    setExpandedId(expandedId === msg.id ? null : msg.id);
    if (msg.status === 'NEW') updateStatus(msg.id, 'READ');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      const res = await fetch(`/api/admin/contact/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) fetchMessages();
      else alert('Failed to delete message.');
    } catch (err) {
      console.error('Delete Error:', err);
    }
  };

  const newCount = messages.filter((m) => m.status === 'NEW').length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 bg-white flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Contact Messages</h2>
          <p className="text-sm text-slate-500 mt-1">Messages submitted through the website contact form.</p>
        </div>
        {newCount > 0 && (
          <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full">
            {newCount} New
          </span>
        )}
      </div>

      <div className="p-6">
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
              <Loader2 className="animate-spin w-8 h-8 mb-2" />
              <span className="text-sm">Loading messages...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
              <Mail className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-sm">No contact messages yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 bg-white">
              {messages.map((msg) => (
                <div key={msg.id}>
                  <div
                    onClick={() => handleExpand(msg)}
                    className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-900">{msg.name}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${STATUS_STYLES[msg.status] || STATUS_STYLES.NEW}`}>
                          {msg.status || 'NEW'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 truncate">
                        {msg.subject || 'No subject'} &middot; {msg.email}
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 shrink-0">
                      {new Date(msg.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(msg.id); }}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors shrink-0"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {expandedId === msg.id && (
                    <div className="px-6 pb-5 bg-slate-50/50">
                      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Mail className="w-3.5 h-3.5 text-[#d9982b]" /> {msg.email}
                          </div>
                          {msg.phone && (
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <Phone className="w-3.5 h-3.5 text-[#d9982b]" /> {msg.phone}
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{msg.message}</p>
                        <div className="flex items-center gap-2 pt-2">
                          {msg.status !== 'RESPONDED' && (
                            <button
                              onClick={() => updateStatus(msg.id, 'RESPONDED')}
                              className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-md hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5" /> Mark as Responded
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
