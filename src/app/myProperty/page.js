"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Plus, ArrowLeft, Loader2, Eye, Building2, Image as ImageIcon, MapPin
} from "lucide-react";

const STATUS_STYLES = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  INACTIVE: "bg-slate-100 text-slate-700 border-slate-200",
};

// Defined at module level so React doesn't remount inputs (and drop focus) on every keystroke
const InputField = ({ label, required, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      {...props}
      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-[#d9982b] focus:ring-1 focus:ring-[#d9982b] transition-colors"
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
      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:border-[#d9982b] focus:ring-1 focus:ring-[#d9982b] transition-colors cursor-pointer"
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

function MyPropertyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- AUTH ---
  const [authChecked, setAuthChecked] = useState(false);
  const [token, setToken] = useState(null);

  // --- VIEW STATE ---
  const [view, setView] = useState("list");
  const [myProperties, setMyProperties] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(true);

  // --- FORM DATA SOURCES ---
  const [mainCategories, setMainCategories] = useState([]);
  const [projectCategories, setProjectCategories] = useState([]);
  const [amenitiesList, setAmenitiesList] = useState([]);

  // --- FORM STATE ---
  const [mainCategoryId, setMainCategoryId] = useState("");
  const [projectCategoryId, setProjectCategoryId] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [listingType, setListingType] = useState("");
  const [propertySubType, setPropertySubType] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
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
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  const [galleryBoxes, setGalleryBoxes] = useState({ box1: null, box2: null, box3: null, box4: null });
  const [outdoorImages, setOutdoorImages] = useState(null);
  const [indoorImages, setIndoorImages] = useState(null);
  const [masterPlans, setMasterPlans] = useState(null);
  const [floorPlans, setFloorPlans] = useState(null);
  const [floorPlanTitle, setFloorPlanTitle] = useState("");
  const [brochures, setBrochures] = useState(null);
  const [brochureTitle, setBrochureTitle] = useState("");

  const [uploading, setUploading] = useState(false);

  // --- AUTH GUARD ---
  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");
    if (!storedToken) {
      router.replace("/login?redirect=/myProperty");
      return;
    }
    setToken(storedToken);
    setAuthChecked(true);
  }, [router]);

  // Prefill from the "quick post" intent captured at registration (see /login)
  useEffect(() => {
    const initialListingType = searchParams.get("listing_type");
    const initialPropertyType = searchParams.get("property_type");
    const initialSubType = searchParams.get("property_sub_type");

    if (initialListingType || initialPropertyType || initialSubType) {
      if (initialListingType) setListingType(initialListingType);
      if (initialPropertyType) setPropertyType(initialPropertyType);
      if (initialSubType) setPropertySubType(initialSubType);
      setView("form");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMyProperties = async (activeToken) => {
    setIsLoadingList(true);
    try {
      const res = await fetch("/api/seller/properties", {
        headers: { Authorization: `Bearer ${activeToken}` },
      });
      const data = await res.json();
      if (data.success) setMyProperties(data.data);
      else if (res.status === 401) router.replace("/login?redirect=/myProperty");
    } catch (error) {
      console.error("Failed to fetch my properties:", error);
    } finally {
      setIsLoadingList(false);
    }
  };

  const fetchFormData = async () => {
    try {
      const [mainRes, projRes, amenRes] = await Promise.all([
        fetch("/api/admin/main-categories").then((res) => res.json()),
        fetch("/api/admin/project-categories").then((res) => res.json()),
        fetch("/api/admin/amenities").then((res) => res.json()),
      ]);
      if (mainRes.success) setMainCategories(mainRes.data);
      if (projRes.success) setProjectCategories(projRes.data);
      if (amenRes.success) setAmenitiesList(amenRes.data.filter((a) => a.status === "ACTIVE"));
    } catch (error) {
      console.error("Failed to fetch form data:", error);
    }
  };

  useEffect(() => {
    if (authChecked && token) {
      fetchMyProperties(token);
      fetchFormData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecked, token]);

  const resetForm = () => {
    setMainCategoryId(""); setProjectCategoryId(""); setPropertyType(""); setListingType("");
    setPropertySubType(""); setTitle(""); setSlug(""); setDescription(""); setCity("");
    setLocation(""); setPrice(""); setSecurityDeposit(""); setMaintenanceCharge("");
    setLeaseDuration(""); setAvailableFrom(""); setFurnishing(""); setOwnership("");
    setFacing(""); setParking(""); setBedrooms(""); setBathrooms(""); setAreaSqft("");
    setSelectedAmenities([]);
    setGalleryBoxes({ box1: null, box2: null, box3: null, box4: null });
    setOutdoorImages(null); setIndoorImages(null); setMasterPlans(null);
    setFloorPlans(null); setBrochures(null); setFloorPlanTitle(""); setBrochureTitle("");
  };

  const handleGalleryChange = (boxKey, file) => {
    if (file) setGalleryBoxes((prev) => ({ ...prev, [boxKey]: file }));
  };

  const removeGalleryImage = (boxKey) => {
    setGalleryBoxes((prev) => ({ ...prev, [boxKey]: null }));
    const input = document.getElementById(`gallery-upload-${boxKey}`);
    if (input) input.value = "";
  };

  const toggleAmenity = (id) => {
    setSelectedAmenities((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const appendFiles = (formData, key, files) => {
    if (files) Array.from(files).forEach((file) => formData.append(key, file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!mainCategoryId || !projectCategoryId || !propertyType || !listingType || !propertySubType || !title) {
      alert("Please fill all required core fields (Categories, Types, Sub-Type, Title).");
      return;
    }
    if (listingType === "RENT" && (!price || !securityDeposit || !availableFrom)) {
      alert("Price, Security Deposit, and Available From are required for Rent listings.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("main_category_id", mainCategoryId);
      formData.append("project_category_id", projectCategoryId);
      formData.append("property_type", propertyType);
      formData.append("listing_type", listingType);
      formData.append("property_sub_type", propertySubType);
      formData.append("title", title);

      if (slug) formData.append("slug", slug);
      if (description) formData.append("description", description);
      if (city) formData.append("city", city);
      if (location) formData.append("location", location);
      if (price) formData.append("price", price);

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

      if (selectedAmenities.length > 0) formData.append("amenities", selectedAmenities.join(","));

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

      const response = await fetch("/api/seller/properties", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.status === 401) {
        router.replace("/login?redirect=/myProperty");
        return;
      }

      const data = await response.json();
      if (data.success) {
        alert("Property submitted for review! It will appear on the site once approved by our team.");
        resetForm();
        setView("list");
        fetchMyProperties(token);
      } else {
        alert(`Submission failed: ${data.error || "Please check your details and try again."}`);
      }
    } catch (error) {
      console.error("Submit Error:", error);
      alert("An error occurred while saving data.");
    } finally {
      setUploading(false);
    }
  };

  const propertyTypeOptions = [
    { id: "RESIDENTIAL", name: "Residential" },
    { id: "COMMERCIAL", name: "Commercial" },
  ];
  const listingTypeOptions = [
    { id: "SELL", name: "Sell" },
    { id: "RENT", name: "Rent" },
  ];
  const furnishingOptions = [
    { id: "UNFURNISHED", name: "Unfurnished" },
    { id: "SEMI_FURNISHED", name: "Semi-Furnished" },
    { id: "FULLY_FURNISHED", name: "Fully-Furnished" },
  ];

  if (!authChecked) {
    return (
      <main className="min-h-screen bg-[#f8fafc] font-sans">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <span className="text-sm">Checking your session...</span>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] font-sans">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10">
        {view === "list" ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#0a1629]">My Properties</h1>
                <p className="text-sm text-slate-500 mt-1">
                  {isLoadingList ? "Loading..." : `You have added ${myProperties.length} propert${myProperties.length === 1 ? "y" : "ies"}.`}
                </p>
              </div>
              <button
                onClick={() => { resetForm(); setView("form"); }}
                className="bg-[#0a1629] hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm whitespace-nowrap"
              >
                <Plus className="w-4 h-4" /> Add New Property
              </button>
            </div>

            <div className="p-6">
              {isLoadingList ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-2" />
                </div>
              ) : myProperties.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Building2 className="w-12 h-12 text-slate-300 mb-4" />
                  <h3 className="text-lg font-bold text-[#0a1629] mb-1">No Properties Yet</h3>
                  <p className="text-sm text-slate-500 mb-6">Add your first property to get started.</p>
                  <button
                    onClick={() => { resetForm(); setView("form"); }}
                    className="bg-[#0a1629] hover:bg-slate-800 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors"
                  >
                    Add Propertyy
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {myProperties.map((prop) => {
                    const card = (
                      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow h-full">
                        <div className="relative h-40 w-full bg-slate-100">
                          {prop.image ? (
                            <img src={prop.image} alt={prop.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <ImageIcon className="w-8 h-8" />
                            </div>
                          )}
                          <span className={`absolute top-3 left-3 inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border ${STATUS_STYLES[prop.status] || STATUS_STYLES.PENDING}`}>
                            {prop.status || "PENDING"}
                          </span>
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-[#0a1629] mb-1 truncate">{prop.title}</h3>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{[prop.location, prop.city].filter(Boolean).join(", ") || "Location not specified"}</span>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                            <span className="text-sm font-bold text-[#0a1629]">
                              {prop.price ? `₹${Number(prop.price).toLocaleString("en-IN")}` : "N/A"}
                            </span>
                            <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                              <Eye className="w-3.5 h-3.5" /> {prop.views || 0} views
                            </span>
                          </div>
                        </div>
                      </div>
                    );

                    return prop.status === "ACTIVE" ? (
                      <Link href={`/property/${prop.id}`} key={prop.id}>{card}</Link>
                    ) : (
                      <div key={prop.id}>{card}</div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100">
              <button
                onClick={() => { resetForm(); setView("list"); }}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 mb-4 flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to My Properties
              </button>
              <h1 className="text-2xl font-semibold tracking-tight text-[#0a1629]">Add New Property</h1>
              <p className="text-sm text-slate-500 mt-1">
                Fill in the details below. Your listing will be reviewed by our team before it goes live (status: <span className="font-semibold text-amber-600">Pending</span>).
              </p>
            </div>

            <form onSubmit={handleSubmit} className="px-8 py-8 space-y-12">
              <section>
                <h2 className="text-lg font-semibold text-slate-800 mb-6 pb-2 border-b border-slate-100">
                  1. Property Classification
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <SelectField label="Main Category" required value={mainCategoryId} onChange={(e) => setMainCategoryId(e.target.value)} options={mainCategories} />
                  <SelectField label="Project Category" required value={projectCategoryId} onChange={(e) => setProjectCategoryId(e.target.value)} options={projectCategories} />
                  <SelectField label="Property Type" required value={propertyType} onChange={(e) => setPropertyType(e.target.value)} options={propertyTypeOptions} />
                  <SelectField label="Listing Type" required value={listingType} onChange={(e) => setListingType(e.target.value)} options={listingTypeOptions} />
                  <InputField label="Property Sub-Type" required value={propertySubType} onChange={(e) => setPropertySubType(e.target.value)} placeholder="e.g. Apartment, Villa, Shop" />
                  <InputField label="Property Title" type="text" required value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
              </section>

              <section>
                <h2 className="text-lg font-semibold text-slate-800 mb-6 pb-2 border-b border-slate-100">
                  2. Property Details &amp; Pricing
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <InputField label="Price (₹)" type="number" required={listingType === "RENT"} value={price} onChange={(e) => setPrice(e.target.value)} />

                  {listingType === "RENT" && (
                    <>
                      <InputField label="Security Deposit (₹)" type="number" required value={securityDeposit} onChange={(e) => setSecurityDeposit(e.target.value)} />
                      <InputField label="Maintenance Charge (₹)" type="number" value={maintenanceCharge} onChange={(e) => setMaintenanceCharge(e.target.value)} />
                      <InputField label="Lease Duration" type="text" placeholder="e.g. 11 Months" value={leaseDuration} onChange={(e) => setLeaseDuration(e.target.value)} />
                      <InputField label="Available From" type="date" required value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} />
                    </>
                  )}

                  <InputField label="Area (Sq. Ft.)" type="number" value={areaSqft} onChange={(e) => setAreaSqft(e.target.value)} />
                  <InputField label="Bedrooms" type="number" disabled={propertyType === "COMMERCIAL"} value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} />
                  <InputField label="Bathrooms" type="number" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} />
                  <SelectField label="Furnishing" value={furnishing} onChange={(e) => setFurnishing(e.target.value)} options={furnishingOptions} />
                  <InputField label="Ownership" type="text" placeholder="e.g. Freehold" value={ownership} onChange={(e) => setOwnership(e.target.value)} />
                  <InputField label="Facing" type="text" placeholder="e.g. North-East" value={facing} onChange={(e) => setFacing(e.target.value)} />
                  <InputField label="Parking (No. of spots)" type="number" min="0" placeholder="e.g. 1" value={parking} onChange={(e) => setParking(e.target.value)} />
                  <InputField label="City" type="text" value={city} onChange={(e) => setCity(e.target.value)} />

                  <div className="md:col-span-3">
                    <InputField label="Location (Address)" type="text" value={location} onChange={(e) => setLocation(e.target.value)} />
                  </div>

                  <div className="md:col-span-3 mt-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
                    <textarea
                      rows="4"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-[#d9982b] focus:ring-1 focus:ring-[#d9982b] transition-colors resize-none"
                    ></textarea>
                  </div>

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
                                  ? "bg-[#0a1629] text-white border-[#0a1629] shadow-sm"
                                  : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50 hover:border-slate-400"
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
                  4. Additional Media &amp; Documents
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
                      <input type="text" placeholder="Title (e.g., Ground Floor)" value={floorPlanTitle} onChange={(e) => setFloorPlanTitle(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-[#d9982b] focus:ring-1 focus:ring-[#d9982b]" />
                    </div>
                    <div className="p-5 border border-slate-200 rounded-lg bg-slate-50/50 space-y-4">
                      <h3 className="text-sm font-semibold text-slate-800">Brochures (PDF)</h3>
                      <input type="file" multiple accept=".pdf" onChange={(e) => setBrochures(e.target.files)} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-white file:text-slate-700 file:border file:border-slate-300 hover:file:bg-slate-50 cursor-pointer" />
                      <input type="text" placeholder="Title (e.g., Luxury Specs)" value={brochureTitle} onChange={(e) => setBrochureTitle(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-[#d9982b] focus:ring-1 focus:ring-[#d9982b]" />
                    </div>
                  </div>
                </div>
              </section>

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
                  className="md:min-w-[240px] bg-[#0a1629] hover:bg-slate-800 disabled:bg-slate-400 text-white font-medium py-3 px-8 rounded-md transition-colors shadow-sm flex justify-center items-center"
                >
                  {uploading ? "Submitting..." : "Submit Property"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}

export default function MyPropertyPage() {
  return (
    <Suspense fallback={null}>
      <MyPropertyPageContent />
    </Suspense>
  );
}
