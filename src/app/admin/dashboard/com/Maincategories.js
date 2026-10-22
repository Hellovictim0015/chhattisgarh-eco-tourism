"use client";

import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit, Save, X, Loader2, ImagePlus, Image as ImageIcon } from 'lucide-react';

const EMPTY_FORM = { name: '', slug: '', status: 'ACTIVE' };

// Reads the picked file once (not on every render) for the preview thumbnail
function useFilePreview(file) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSrc(reader.result);
    reader.readAsDataURL(file);
    return () => reader.abort();
  }, [file]);
  return file ? src : null;
}

export default function Maincategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isEditing, setIsEditing] = useState(null);
  const [imageFile, setImageFile] = useState(null);         // newly picked file
  const [existingImage, setExistingImage] = useState(null); // current image when editing
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const pickedPreview = useFilePreview(imageFile);
  const previewSrc = pickedPreview || (!removeImage ? existingImage : null);

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setIsEditing(null);
    setImageFile(null);
    setExistingImage(null);
    setRemoveImage(false);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startEdit = (cat) => {
    resetForm();
    setIsEditing(cat.id);
    setFormData({ name: cat.name, slug: cat.slug, status: cat.status || 'ACTIVE' });
    setExistingImage(cat.image || null);
  };

  const clearImage = () => {
    setImageFile(null);
    if (existingImage) setRemoveImage(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 1. Fetch Categories (GET)
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/main-categories');
      const result = await res.json();
      if (result.success) setCategories(result.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  // 2. Add / Update Category
  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isEditing
      ? `/api/admin/main-categories/${isEditing}`
      : '/api/admin/main-categories';

    const body = new FormData();
    body.append('name', formData.name);
    body.append('slug', formData.slug);
    body.append('status', formData.status);
    if (imageFile) body.append('image', imageFile);
    if (removeImage && !imageFile) body.append('remove_image', '1');

    setSaving(true);
    setError('');
    try {
      const res = await fetch(url, { method: isEditing ? 'PUT' : 'POST', body });
      const result = await res.json();
      if (!result.success) {
        setError(result.message || 'Failed to save category');
        return;
      }
      resetForm();
      fetchCategories();
    } catch (err) {
      console.error(err);
      setError('Something went wrong while saving.');
    } finally {
      setSaving(false);
    }
  };

  // 3. Delete Category
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    await fetch(`/api/admin/main-categories/${id}`, { method: 'DELETE' });
    fetchCategories();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100">
        <h2 className="text-lg font-semibold text-slate-900">Main Categories</h2>
        <p className="text-sm text-slate-500 mt-1">Manage and organize your top-level property categories.</p>
      </div>

      <div className="p-6">
        {/* Form Section */}
        <div className="mb-8 bg-slate-50/50 border border-slate-100 rounded-lg p-5">
          <h3 className="text-sm font-medium text-slate-800 mb-4">
            {isEditing ? 'Edit Category' : 'Add New Category'}
          </h3>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row flex-wrap gap-4 items-start sm:items-center">
            <input
              required
              className="px-4 py-2 bg-white border border-slate-300 rounded-md text-sm placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors flex-1 w-full sm:min-w-[200px]"
              placeholder="Category Name"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
            <input
              required
              className="px-4 py-2 bg-white border border-slate-300 rounded-md text-sm placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors flex-1 w-full sm:min-w-[200px]"
              placeholder="Slug (e.g., residential-plots)"
              value={formData.slug}
              onChange={e => setFormData({...formData, slug: e.target.value})}
            />

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {previewSrc && (
                <div className="relative w-14 h-14 rounded-md overflow-hidden border border-slate-300 bg-white shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={previewSrc} alt="Category preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-white/90 text-slate-700 hover:text-red-600 flex items-center justify-center shadow"
                    title="Remove image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <label className="cursor-pointer px-4 py-2 bg-white border border-dashed border-slate-300 rounded-md text-sm text-slate-600 hover:border-slate-500 hover:text-slate-900 transition-colors flex items-center gap-2 whitespace-nowrap">
                <ImagePlus className="w-4 h-4" />
                {previewSrc ? 'Change Image' : 'Add Image'}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) { setImageFile(file); setRemoveImage(false); }
                  }}
                />
              </label>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto bg-slate-900 text-white px-5 py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-800 disabled:bg-slate-400 transition-colors shadow-sm"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : isEditing ? <Save className="w-4 h-4"/> : <Plus className="w-4 h-4"/>}
                {saving ? 'Saving...' : isEditing ? 'Update Category' : 'Add Category'}
              </button>

              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm} 
                  className="px-4 py-2 text-slate-500 text-sm font-medium hover:text-slate-900 transition-colors flex items-center gap-1.5"
                >
                  <X className="w-4 h-4"/> Cancel
                </button>
              )}
            </div>
          </form>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>

        {/* Table Section */}
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
              <Loader2 className="animate-spin w-8 h-8 mb-2"/>
              <span className="text-sm">Loading categories...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-3">Image</th>
                    <th className="px-6 py-3">Category Name</th>
                    <th className="px-6 py-3">Slug</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-slate-600 divide-y divide-slate-100 bg-white">
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                        No categories found. Add one above.
                      </td>
                    </tr>
                  ) : (
                    categories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          {cat.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={cat.image} alt={cat.name} className="w-12 h-12 rounded-md object-cover border border-slate-200" />
                          ) : (
                            <div className="w-12 h-12 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-300">
                              <ImageIcon className="w-5 h-5" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900">{cat.name}</td>
                        <td className="px-6 py-4 text-slate-500">{cat.slug}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            cat.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {cat.status || 'ACTIVE'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => startEdit(cat)}
                              className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4"/>
                            </button>
                            <button
                              onClick={() => handleDelete(cat.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4"/>
                            </button>
                          </div>
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