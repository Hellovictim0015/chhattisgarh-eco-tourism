"use client";

import { useState, useEffect } from "react";
import { Plus, ArrowLeft, Loader2, Edit, Trash2, Image as ImageIcon } from "lucide-react";

// Reusable Form Components — defined at module level so React doesn't remount
// inputs (and drop focus) on every keystroke
const InputField = ({ label, required, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      {...props}
      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors disabled:bg-slate-100 disabled:text-slate-500"
    />
  </div>
);
const SelectField = ({ label, required, options, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      {...props}
      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors cursor-pointer"
    >
      <option value="" disabled>Select {label}</option>
      {options.map((opt) => (
        <option key={opt.id} value={opt.id}>{opt.name}</option>
      ))}
    </select>
  </div>
);

// Reads the file once per selection (not on every render, which caused flicker and leaked blob URLs)
const FilePreview = ({ file, alt }) => {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSrc(reader.result);
    reader.readAsDataURL(file);
    return () => reader.abort();
  }, [file]);
  if (!src) return null;
  return <img src={src} alt={alt} className="w-full h-full object-cover" />;
};

export default function PropertiesManagement() {
  // --- VIEW STATE ---
 const [view, setView] = useState("list");
  const [propertiesList, setPropertiesList] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [editingId, setEditingId] = useState(null);

  // --- FORM STATE ---
  const [mainCategoryId, setMainCategoryId] = useState("");
  const [projectCategoryId, setProjectCategoryId] = useState("");
  const [propertyType, setPropertyType] = useState(""); // RESIDENTIAL | COMMERCIAL
  const [listingType, setListingType] = useState(""); // SELL | RENT
  const [propertySubType, setPropertySubType] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  
  // New Fields
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [maintenanceCharge, setMaintenanceCharge] = useState("");
  const [leaseDuration, setLeaseDuration] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [furnishing, setFurnishing] = useState("");
  const [ownership, setOwnership] = useState("");
  const [facing, setFacing] = useState("");
  const [parking, setParking] = useState("");

  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [areaSqft, setAreaSqft] = useState("");
  const [status, setStatus] = useState("PENDING");
  
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [mainCategories, setMainCategories] = useState([]);
  const [projectCategories, setProjectCategories] = useState([]);
  const [amenitiesList, setAmenitiesList] = useState([]);

  const [galleryBoxes, setGalleryBoxes] = useState({ box1: null, box2: null, box3: null, box4: null });
  const [outdoorImages, setOutdoorImages] = useState(null);
  const [indoorImages, setIndoorImages] = useState(null);
  const [masterPlans, setMasterPlans] = useState(null);
  const [floorPlans, setFloorPlans] = useState(null);
  const [floorPlanTitle, setFloorPlanTitle] = useState("");
  const [brochures, setBrochures] = useState(null);
  const [brochureTitle, setBrochureTitle] = useState("");

  const [uploading, setUploading] = useState(false);

  // --- FETCH DATA ON MOUNT ---
  const fetchProperties = async () => {
    setIsLoadingList(true);
    try {
      const res = await fetch("/api/admin/properties");
      const data = await res.json();
      if (data.success) {
        setPropertiesList(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch properties:", error);
    } finally {
      setIsLoadingList(false);
    }
  };

  const fetchFormData = async () => {
    try {
      const [mainRes, projRes, amenRes] = await Promise.all([
        fetch("/api/admin/main-categories").then(res => res.json()),
        fetch("/api/admin/project-categories").then(res => res.json()),
        fetch("/api/admin/amenities").then(res => res.json())
      ]);

      if (mainRes.success) setMainCategories(mainRes.data);
      if (projRes.success) setProjectCategories(projRes.data);
      if (amenRes.success) setAmenitiesList(amenRes.data.filter(a => a.status === 'ACTIVE'));
    } catch (error) {
      console.error("Failed to fetch form data:", error);
    }
  };

  useEffect(() => {
    fetchProperties();
    fetchFormData();
  }, []);

  // --- HELPER: RESET FORM ---
  const resetForm = () => {
    setEditingId(null);
    setMainCategoryId("");
    setProjectCategoryId("");
    setPropertyType("");
    setListingType("");
    setPropertySubType("");
    setTitle("");
    setSlug("");
    setDescription("");
    setCity("");
    setLocation("");
    setPrice("");
    setSecurityDeposit("");
    setMaintenanceCharge("");
    setLeaseDuration("");
    setAvailableFrom("");
    setFurnishing("");
    setOwnership("");
    setFacing("");
    setParking("");
    setBedrooms("");
    setBathrooms("");
    setAreaSqft("");
    setStatus("PENDING");
    setSelectedAmenities([]);
    setGalleryBoxes({ box1: null, box2: null, box3: null, box4: null });
    setOutdoorImages(null);
    setIndoorImages(null);
    setMasterPlans(null);
    setFloorPlans(null);
    setBrochures(null);
  };

  // --- EDIT HANDLING (GET BY ID) ---
  const handleEdit = async (id) => {
    resetForm();
    setIsLoadingList(true);
    try {
      const res = await fetch(`/api/admin/properties/${id}`);
      const data = await res.json();
      
      if (data.success) {
        const prop = data.data;
        setEditingId(prop.id);
        setTitle(prop.title || "Unknown Property");
        setStatus(prop.status || "PENDING");
        
        setView("form");
      } else {
        alert("Failed to load property details");
      }
    } catch (error) {
      console.error("Error fetching property details:", error);
    } finally {
      setIsLoadingList(false);
    }
  };

  // --- DELETE HANDLING ---
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this property?")) return;
    
    try {
      const res = await fetch(`/api/admin/properties/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchProperties(); // Refresh the list
      } else {
        alert("Failed to delete property.");
      }
    } catch (error) {
      console.error("Delete Error:", error);
    }
  };

  // --- FORM HANDLERS ---
  const handleGalleryChange = (boxKey, file) => {
    if (file) setGalleryBoxes((prev) => ({ ...prev, [boxKey]: file }));
  };
  
  const removeGalleryImage = (boxKey) => {
    setGalleryBoxes((prev) => ({ ...prev, [boxKey]: null }));
    document.getElementById(`gallery-upload-${boxKey}`).value = "";
  };

  const toggleAmenity = (id) => {
    setSelectedAmenities((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const appendFiles = (formData, key, files) => {
    if (files) {
      Array.from(files).forEach((file) => formData.append(key, file));
    }
  };

  // --- SUBMIT (POST OR PUT) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      if (editingId) {
        // --- PUT REQUEST (Update ONLY the status) ---
        const payload = { status };
        const response = await fetch(`/api/admin/properties/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (data.success) {
          alert("Property status updated successfully!");
          setView("list");
          fetchProperties();
        } else {
          alert(`Update Failed: ${data.error}`);
        }

      } else {
        // --- POST REQUEST (Create new property with files) ---
        // 1. Validation
        if (!mainCategoryId || !projectCategoryId || !propertyType || !listingType || !propertySubType || !title) {
          alert("Please fill all required core fields (Categories, Types, Sub-Type, Title).");
          setUploading(false);
          return;
        }

        if (listingType === "RENT") {
          if (!price || !securityDeposit || !availableFrom) {
            alert("Price, Security Deposit, and Available From are required for Rent listings.");
            setUploading(false);
            return;
          }
        }

        const formData = new FormData();

        // Core fields
        formData.append("main_category_id", mainCategoryId);
        formData.append("project_category_id", projectCategoryId);
        formData.append("property_type", propertyType);
        formData.append("listing_type", listingType);
        formData.append("property_sub_type", propertySubType);
        formData.append("title", title);
        
        // Optional String/Text Fields
        if (slug) formData.append("slug", slug);
        if (description) formData.append("description", description);
        if (city) formData.append("city", city);
        if (location) formData.append("location", location);
        if (price) formData.append("price", price);
        
        // New Details
        if (listingType === "RENT") {
          if (securityDeposit) formData.append("security_deposit", securityDeposit);
          if (maintenanceCharge) formData.append("maintenance_charge", maintenanceCharge);
          if (leaseDuration) formData.append("lease_duration", leaseDuration);
          if (availableFrom) formData.append("available_from", availableFrom);
        }
        
        if (furnishing) formData.append("furnishing", furnishing);
        if (ownership) formData.append("ownership", ownership);
        if (facing) formData.append("facing", facing);
        if (parking) formData.append("parking", parking);

        if (bedrooms) formData.append("bedrooms", bedrooms);
        if (bathrooms) formData.append("bathrooms", bathrooms);
        if (areaSqft) formData.append("area_sqft", areaSqft);
        formData.append("status", status);
        
        if (selectedAmenities.length > 0) {
          formData.append("amenities", selectedAmenities.join(","));
        }

        Object.values(galleryBoxes).forEach((file) => {
          if (file) formData.append("gallery_images", file);
        });

        appendFiles(formData, "outdoor_images", outdoorImages);
        appendFiles(formData, "indoor_images", indoorImages);
        appendFiles(formData, "master_plans", masterPlans);

        if (floorPlans) {
          Array.from(floorPlans).forEach((file) => {
            formData.append("floor_plans", file);
            formData.append("floor_plans_titles", floorPlanTitle || "Floor Plan");
          });
        }

        if (brochures) {
          Array.from(brochures).forEach((file) => {
            formData.append("brochures", file);
            formData.append("brochures_titles", brochureTitle || "Property Brochure");
          });
        }

        const response = await fetch("/api/admin/properties", {
          method: "POST",
          body: formData,
        });
        
        const data = await response.json();
        if (data.success) {
          alert("Property and ALL assets created successfully! 🎉");
          resetForm();
          setView("list");
          fetchProperties();
        } else {
          alert(`Upload Failed: ${data.error}`);
        }
      }
    } catch (error) {
      console.error("Submit Error:", error);
      alert("An error occurred while saving data.");
    }
    setUploading(false);
  };

  // Static options for new fields
  const propertyTypeOptions = [
    { id: "RESIDENTIAL", name: "Residential" },
    { id: "COMMERCIAL", name: "Commercial" }
  ];
  
  const listingTypeOptions = [
    { id: "SELL", name: "Sell" },
    { id: "RENT", name: "Rent" }
  ];

  const furnishingOptions = [
    { id: "UNFURNISHED", name: "Unfurnished" },
    { id: "SEMI_FURNISHED", name: "Semi-Furnished" },
    { id: "FULLY_FURNISHED", name: "Fully-Furnished" }
  ];

  // ==========================================
  // RENDER: LIST VIEW
  // ==========================================
  if (view === "list") {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Properties</h2>
            <p className="text-sm text-slate-500 mt-1">Manage all property listings and their assets.</p>
          </div>
          <button 
            onClick={() => { resetForm(); setView("form"); }}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Add New Property
          </button>
        </div>

        <div className="p-6">
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            {isLoadingList ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                <Loader2 className="animate-spin w-8 h-8 mb-2" />
                <span className="text-sm">Loading properties...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="px-6 py-3">Image</th>
                      <th className="px-6 py-3">Property Details</th>
                      <th className="px-6 py-3">Location</th>
                      <th className="px-6 py-3">Price</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-slate-600 divide-y divide-slate-100 bg-white">
                    {propertiesList.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                          No properties found. Click "Add New Property" to get started.
                        </td>
                      </tr>
                    ) : (
                      propertiesList.map((prop) => (
                        <tr key={prop.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4">
                            {prop.image ? (
                              <div className="w-14 h-14 bg-slate-100 rounded-md overflow-hidden border border-slate-200">
                                <img src={prop.image} alt={prop.title} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-14 h-14 bg-slate-50 rounded-md border border-slate-200 flex flex-col items-center justify-center text-slate-400">
                                <ImageIcon className="w-5 h-5 mb-0.5" />
                                <span className="text-[9px] uppercase font-bold">No Image</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900">{prop.title}</div>
                            <div className="text-xs text-slate-400 mt-0.5">ID: #{prop.id}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-slate-700">{prop.city || 'N/A'}</div>
                            <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[150px]">{prop.location || 'No address provided'}</div>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-900">
                            {prop.price ? `₹${prop.price}` : 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${
                              prop.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : prop.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {prop.status || 'PENDING'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => handleEdit(prop.id)} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors" title="Edit Status">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDelete(prop.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                                <Trash2 className="w-4 h-4" />
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

  // ==========================================
  // RENDER: FORM VIEW
  // ==========================================
  return (
    <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      
      {/* Header */}
      <div className="px-8 py-6 border-b border-slate-100 bg-white">
        <button 
          onClick={() => { resetForm(); setView("list"); }}
          className="text-xs font-medium text-slate-500 hover:text-slate-900 mb-4 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Properties
        </button>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          {editingId ? "Edit Property Status" : "Add New Property"}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {editingId 
            ? "Update the status for this specific property." 
            : "Fill in the details below to list a new property and upload its media assets."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="px-8 py-8 space-y-12">
        
        {editingId ? (
          /* --- EDIT MODE: STATUS ONLY --- */
          <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-6 pb-2 border-b border-slate-100">
              Update Status
            </h2>
            <div className="mb-6">
              <p className="text-sm text-slate-500">
                Editing Property: <span className="font-semibold text-slate-900">{title}</span>
              </p>
            </div>
            <div className="md:w-1/3">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value)} 
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors cursor-pointer"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="PENDING">PENDING</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </section>
        ) : (
          /* --- CREATE MODE: FULL FORM --- */
          <>
            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-6 pb-2 border-b border-slate-100">
                1. Property Classification
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <SelectField 
                  label="Main Category" 
                  required 
                  value={mainCategoryId} 
                  onChange={(e) => setMainCategoryId(e.target.value)} 
                  options={mainCategories}
                />
                <SelectField 
                  label="Project Category" 
                  required 
                  value={projectCategoryId} 
                  onChange={(e) => setProjectCategoryId(e.target.value)} 
                  options={projectCategories}
                />
                <SelectField 
                  label="Property Type" 
                  required 
                  value={propertyType} 
                  onChange={(e) => setPropertyType(e.target.value)} 
                  options={propertyTypeOptions}
                />
                <SelectField 
                  label="Listing Type" 
                  required 
                  value={listingType} 
                  onChange={(e) => setListingType(e.target.value)} 
                  options={listingTypeOptions}
                />
                <InputField 
                  label="Property Sub-Type" 
                  required 
                  value={propertySubType} 
                  onChange={(e) => setPropertySubType(e.target.value)}
                  placeholder="e.g. Apartment, Villa, Shop"
                />
                <InputField 
                  label="Property Title" 
                  type="text" 
                  required 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                />
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-6 pb-2 border-b border-slate-100">
                2. Property Details & Pricing
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InputField label="Price (₹)" type="number" required={listingType === 'RENT'} value={price} onChange={(e) => setPrice(e.target.value)} />
                
                {/* Conditionally show rent-specific fields */}
                {listingType === "RENT" && (
                  <>
                    <InputField label="Security Deposit (₹)" type="number" required value={securityDeposit} onChange={(e) => setSecurityDeposit(e.target.value)} />
                    <InputField label="Maintenance Charge (₹)" type="number" value={maintenanceCharge} onChange={(e) => setMaintenanceCharge(e.target.value)} />
                    <InputField label="Lease Duration" type="text" placeholder="e.g. 11 Months" value={leaseDuration} onChange={(e) => setLeaseDuration(e.target.value)} />
                    <InputField label="Available From" type="date" required value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} />
                  </>
                )}

                <InputField label="Area (Sq. Ft.)" type="number" value={areaSqft} onChange={(e) => setAreaSqft(e.target.value)} />
                <InputField label="Bedrooms" type="number" disabled={propertyType === 'COMMERCIAL'} value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} />
                <InputField label="Bathrooms" type="number" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} />
                <SelectField label="Furnishing" value={furnishing} onChange={(e) => setFurnishing(e.target.value)} options={furnishingOptions} />
                <InputField label="Ownership" type="text" placeholder="e.g. Freehold" value={ownership} onChange={(e) => setOwnership(e.target.value)} />
                <InputField label="Facing" type="text" placeholder="e.g. North-East" value={facing} onChange={(e) => setFacing(e.target.value)} />
                <InputField label="Parking" type="text" placeholder="e.g. 1 Covered" value={parking} onChange={(e) => setParking(e.target.value)} />
                <InputField label="Slug (URL)" type="text" value={slug} onChange={(e) => setSlug(e.target.value)} />
                <InputField label="City" type="text" value={city} onChange={(e) => setCity(e.target.value)} />

                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
                  <select 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value)} 
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors cursor-pointer"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PENDING">PENDING</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <InputField label="Location (Address)" type="text" value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>

                <div className="md:col-span-3 mt-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                  <textarea 
                    rows="4" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors resize-none"
                  ></textarea>
                </div>

                {/* Amenities Multi-Select Grid */}
                <div className="md:col-span-3 mt-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Amenities</label>
                  {amenitiesList.length === 0 ? (
                    <p className="text-sm text-slate-400 italic">No amenities available.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2.5">
                      {amenitiesList.map((amenity) => {
                        const isSelected = selectedAmenities.includes(amenity.id);
                        return (
                          <button
                            key={amenity.id}
                            type="button"
                            onClick={() => toggleAmenity(amenity.id)}
                            className={`px-4 py-2 text-sm font-medium rounded-md border transition-all ${
                              isSelected 
                                ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50 hover:border-slate-400'
                            }`}
                          >
                            {amenity.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-6 pb-2 border-b border-slate-100">
                3. Main Gallery Images
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {["box1", "box2", "box3", "box4"].map((boxKey, index) => (
                  <div key={boxKey} className="relative group flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 hover:border-slate-400 transition-all overflow-hidden">
                    {galleryBoxes[boxKey] ? (
                      <>
                        <FilePreview file={galleryBoxes[boxKey]} alt={`Preview ${index + 1}`} />
                        <button 
                          type="button" 
                          onClick={() => removeGalleryImage(boxKey)} 
                          className="absolute top-2 right-2 bg-white/90 text-slate-900 rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <label htmlFor={`gallery-upload-${boxKey}`} className="flex flex-col items-center justify-center w-full h-full cursor-pointer text-center p-4">
                        <span className="text-sm text-slate-500 font-medium">Add Image {index + 1}</span>
                      </label>
                    )}
                    <input id={`gallery-upload-${boxKey}`} type="file" accept="image/*" className="hidden" onChange={(e) => handleGalleryChange(boxKey, e.target.files[0])} />
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 mb-6 pb-2 border-b border-slate-100">
                4. Additional Media & Documents
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Outdoor Images</label>
                    <input type="file" multiple accept="image/*" onChange={(e) => setOutdoorImages(e.target.files)} className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer border border-slate-200 rounded-md p-1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Indoor Images</label>
                    <input type="file" multiple accept="image/*" onChange={(e) => setIndoorImages(e.target.files)} className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer border border-slate-200 rounded-md p-1" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Master Plans</label>
                    <input type="file" multiple accept="image/*" onChange={(e) => setMasterPlans(e.target.files)} className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer border border-slate-200 rounded-md p-1" />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-5 border border-slate-200 rounded-lg bg-slate-50/50 space-y-4">
                    <h3 className="text-sm font-semibold text-slate-800">Floor Plans</h3>
                    <input type="file" multiple accept="image/*" onChange={(e) => setFloorPlans(e.target.files)} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-white file:text-slate-700 file:border file:border-slate-300 hover:file:bg-slate-50 cursor-pointer" />
                    <input type="text" placeholder="Title (e.g., Ground Floor)" value={floorPlanTitle} onChange={(e) => setFloorPlanTitle(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900" />
                  </div>
                  <div className="p-5 border border-slate-200 rounded-lg bg-slate-50/50 space-y-4">
                    <h3 className="text-sm font-semibold text-slate-800">Brochures (PDF)</h3>
                    <input type="file" multiple accept=".pdf" onChange={(e) => setBrochures(e.target.files)} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-white file:text-slate-700 file:border file:border-slate-300 hover:file:bg-slate-50 cursor-pointer" />
                    <input type="text" placeholder="Title (e.g., Luxury Specs)" value={brochureTitle} onChange={(e) => setBrochureTitle(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900" />
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* --- SUBMIT BUTTON --- */}
        <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={() => { resetForm(); setView("list"); }}
            className="px-6 py-3 border border-slate-300 text-slate-700 font-medium rounded-md hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={uploading}
            className="md:min-w-[240px] bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-medium py-3 px-8 rounded-md transition-colors shadow-sm flex justify-center items-center"
          >
            {uploading ? "Processing..." : (editingId ? "Update Status" : "Save Property")}
          </button>
        </div>
        
      </form>
    </div>
  );
}