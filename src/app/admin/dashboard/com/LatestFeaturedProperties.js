"use client";

import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2, Image as ImageIcon } from 'lucide-react';

export default function LatestFeaturedProperties() {
  const [featured, setFeatured] = useState([]);
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
      const [featuredResponse, propertiesResponse] = await Promise.all([
        fetch('/api/admin/featured-properties'),
        fetch('/api/admin/properties') // Fetch base properties for the dropdown
      ]);

      // Safely parse JSON only if the response is OK (prevents HTML parsing errors)
      if (featuredResponse.ok) {
        const featuredData = await featuredResponse.json();
        if (featuredData.success) setFeatured(featuredData.data);
      }

      if (propertiesResponse.ok) {
        const propertiesData = await propertiesResponse.json();
        if (propertiesData.success) setAllProperties(propertiesData.data);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- ADD FEATURED PROPERTY (POST) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!propertyId) {
      alert("Please select a property.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/featured-properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: propertyId,
          sort_order: Number(sortOrder),
          status: status
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Server Error:", errorText);
        alert(`Failed to add property. Server returned status: ${res.status}`);
        return;
      }

      const data = await res.json();
      if (data.success) {
        // Reset form and refresh table
        setPropertyId("");
        setSortOrder("0");
        setStatus("ACTIVE");
        fetchData(); 
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      alert("An error occurred while adding the property.");
    } finally {
      setSubmitting(false);
    }
  };

  // --- REMOVE FEATURED PROPERTY (DELETE) ---
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this property from the featured list?')) return;
    
    try {
      const res = await fetch(`/api/admin/featured-properties/${id}`, { method: 'DELETE' });
      
      // Check if the response is valid BEFORE parsing JSON
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Server Error:", errorText);
        alert(`Failed to delete. Server returned status: ${res.status}`);
        return;
      }

      const data = await res.json();
      if (data.success) {
        fetchData(); // Refresh table
      } else {
        alert("Failed to remove property: " + data.error);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      alert("A network error occurred while trying to delete.");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 bg-white">
        <h2 className="text-lg font-semibold text-slate-900">Latest Featured Properties</h2>
        <p className="text-sm text-slate-500 mt-1">Manage the properties highlighted on the homepage.</p>
      </div>

      <div className="p-6">
        
        {/* Form Section */}
        <div className="mb-8 bg-slate-50/50 border border-slate-100 rounded-lg p-5">
          <h3 className="text-sm font-medium text-slate-800 mb-4">Add Featured Property</h3>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row flex-wrap gap-4 items-end">
            
            <div className="flex-1 min-w-[250px]">
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Select Property *</label>
              <select 
                required
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors cursor-pointer"
              >
                <option value="" disabled>-- Select a Property --</option>
                {allProperties.map((prop) => (
                  <option key={prop.id} value={prop.id}>
                    #{prop.id} - {prop.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-24">
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Sort Order</label>
              <input 
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
              />
            </div>

            <div className="w-full sm:w-32">
              <label className="block text-xs font-medium text-slate-700 mb-1.5">Status</label>
              <select 
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors cursor-pointer"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>

            <button 
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto bg-slate-900 text-white px-6 py-2.5 rounded-md text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4"/>} 
              Add to Featured
            </button>
          </form>
        </div>

        {/* Table Section */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
              <Loader2 className="animate-spin w-8 h-8 mb-2"/>
              <span className="text-sm">Loading featured properties...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-3">Order</th>
                    <th className="px-6 py-3">Image</th>
                    <th className="px-6 py-3">Property Details</th>
                    <th className="px-6 py-3">Price</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-slate-600 divide-y divide-slate-100 bg-white">
                  {featured.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                        No featured properties added yet. Select a property above to add one.
                      </td>
                    </tr>
                  ) : (
                    featured.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900">{item.sort_order}</td>
                        <td className="px-6 py-4">
                          {item.image ? (
                            <div className="w-12 h-12 bg-slate-100 rounded-md overflow-hidden border border-slate-200">
                              <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-slate-50 rounded-md border border-slate-200 flex flex-col items-center justify-center text-slate-400">
                              <ImageIcon className="w-4 h-4 mb-0.5" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">{item.title}</div>
                          <div className="text-xs text-slate-400 mt-0.5">Prop ID: #{item.property_id}</div>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-700">
                          {item.price ? `₹${item.price}` : 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                            item.status === 'ACTIVE' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {item.status || 'ACTIVE'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleDelete(item.id)} 
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Remove from Featured"
                          >
                            <Trash2 className="w-4 h-4"/>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}