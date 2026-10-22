"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2, Image as ImageIcon } from 'lucide-react';

export default function LuxuryProperties() {
  const [luxury, setLuxury] = useState([]);
  const [allProperties, setAllProperties] = useState([]); // For the dropdown
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [propertyId, setPropertyId] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [status, setStatus] = useState("ACTIVE");

  // --- FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const [luxuryRes, propertiesRes] = await Promise.all([
        fetch('/api/admin/luxury-properties').then(res => res.json()),
        fetch('/api/admin/properties').then(res => res.json())
      ]);

      if (luxuryRes.success) setLuxury(luxuryRes.data);
      if (propertiesRes.success) setAllProperties(propertiesRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- ADD LUXURY PROPERTY (POST) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!propertyId) {
      alert("Please select a property.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/luxury-properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: propertyId,
          sort_order: Number(sortOrder),
          status: status
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPropertyId("");
        setSortOrder("0");
        setStatus("ACTIVE");
        fetchData(); 
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while adding the property.");
    } finally {
      setSubmitting(false);
    }
  };

  // --- REMOVE LUXURY PROPERTY (DELETE) ---
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this property from luxury list?')) return;
    
    try {
      const res = await fetch(`/api/admin/luxury-properties/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert("Failed to remove property.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 bg-white">
        <h2 className="text-lg font-semibold text-slate-900">Luxury Properties</h2>
        <p className="text-sm text-slate-500 mt-1">Manage luxury properties highlighted on the homepage.</p>
      </div>

      <div className="p-6">
        {/* Form */}
        <div className="mb-8 bg-slate-50/50 border border-slate-100 rounded-lg p-5">
          <h3 className="text-sm font-medium text-slate-800 mb-4">Add Luxury Property</h3>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[250px]">
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Select Property *</label>
              <select 
                required
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 cursor-pointer"
              >
                <option value="" disabled>-- Select a Property --</option>
                {allProperties.map((prop) => (
                  <option key={prop.id} value={prop.id}>#{prop.id} - {prop.title}</option>
                ))}
              </select>
            </div>
            
            <div className="w-full sm:w-24">
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Sort Order</label>
              <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-md text-sm" />
            </div>

            <div className="w-full sm:w-32">
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-md text-sm cursor-pointer">
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>

            <button type="submit" disabled={submitting} className="bg-slate-900 text-white px-6 py-2.5 rounded-md text-sm font-medium hover:bg-slate-800 transition-colors flex items-center gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4"/>} 
              Add to Luxury
            </button>
          </form>
        </div>

        {/* Table Section */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
              <Loader2 className="animate-spin w-8 h-8 mb-2"/>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b text-xs font-semibold text-slate-500 uppercase">
                <tr>
                  <th className="px-6 py-3">Order</th>
                  <th className="px-6 py-3">Image</th>
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-sm">
                {luxury.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold">{item.sort_order}</td>
                    <td className="px-6 py-4">
                      {item.image ? <img src={item.image} className="w-10 h-10 rounded object-cover"/> : <ImageIcon className="w-8 h-8 text-slate-300"/>}
                    </td>
                    <td className="px-6 py-4 font-medium">{item.title}</td>
                    <td className="px-6 py-4">₹{item.price}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${item.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}