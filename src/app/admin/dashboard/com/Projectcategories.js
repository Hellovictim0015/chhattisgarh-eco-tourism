"use client";

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Save, Loader2, AlertCircle } from 'lucide-react';

export default function Projectcategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', slug: '', status: 'ACTIVE' });
  const [isEditing, setIsEditing] = useState(null);
  const [error, setError] = useState(null);

  // Fetch Data (GET)
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/project-categories');
      const result = await res.json();
      if (result.success) setCategories(result.data);
    } catch (err) { setError("Failed to load categories."); }
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  // Add / Update (POST/PUT)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isEditing 
      ? `/api/admin/project-categories/${isEditing}` 
      : '/api/admin/project-categories';
      
    await fetch(url, {
      method: isEditing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    
    setFormData({ name: '', slug: '', status: 'ACTIVE' });
    setIsEditing(null);
    fetchCategories();
  };

  // Delete (DELETE)
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this project category?')) return;
    await fetch(`/api/admin/project-categories/${id}`, { method: 'DELETE' });
    fetchCategories();
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
      <h2 className="text-xl font-bold text-[#0a1629] mb-6">Project Categories</h2>

      {/* Form Area */}
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 mb-8 bg-slate-50 p-5 rounded-xl border border-slate-100">
        <input 
          className="border border-slate-200 rounded-lg p-2.5 text-sm flex-1 min-w-[200px] outline-none focus:border-amber-500"
          placeholder="Project Category Name"
          value={formData.name}
          onChange={e => setFormData({...formData, name: e.target.value})}
          required
        />
        <input 
          className="border border-slate-200 rounded-lg p-2.5 text-sm flex-1 min-w-[200px] outline-none focus:border-amber-500"
          placeholder="Slug (e.g. newly-launch-projects)"
          value={formData.slug}
          onChange={e => setFormData({...formData, slug: e.target.value})}
          required
        />
        <button type="submit" className="bg-[#0a1629] hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
          {isEditing ? <Save className="w-4 h-4"/> : <Plus className="w-4 h-4"/>} 
          {isEditing ? 'Update Category' : 'Add Category'}
        </button>
        {isEditing && (
          <button type="button" onClick={() => {setIsEditing(null); setFormData({name:'', slug:'', status:'ACTIVE'})}} className="text-slate-500 text-sm font-semibold">Cancel</button>
        )}
      </form>

      {/* Categories Table */}
      {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 mb-4"><AlertCircle className="w-4 h-4"/> {error}</div>}
      
      {loading ? (
        <div className="flex justify-center p-10"><Loader2 className="animate-spin text-amber-500 w-8 h-8"/></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs font-bold text-slate-400 uppercase border-b border-slate-100">
                <th className="pb-3 pl-2">Name</th>
                <th className="pb-3">Slug</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-600">
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-4 pl-2 font-bold text-[#0a1629]">{cat.name}</td>
                  <td className="py-4">{cat.slug}</td>
                  <td className="py-4">
                    <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase">{cat.status}</span>
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setIsEditing(cat.id); setFormData(cat); }} className="p-2 text-slate-400 hover:text-amber-500 bg-white border border-slate-200 rounded shadow-sm"><Edit className="w-4 h-4"/></button>
                      <button onClick={() => handleDelete(cat.id)} className="p-2 text-slate-400 hover:text-red-500 bg-white border border-slate-200 rounded shadow-sm"><Trash2 className="w-4 h-4"/></button>
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