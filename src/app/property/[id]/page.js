"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import {
  MapPin, BedDouble, Bath, Maximize, Compass, Car, Building2, Sofa, KeyRound, CalendarDays,
  ChevronRight, ChevronLeft, Loader2, FileText, Image as ImageIcon, Phone, CheckCircle2,
  X, ShieldCheck, Heart, Share2, Eye, IndianRupee, Clock, Dumbbell, Waves, Trees, Wifi,
  Zap, Baby, Shield, ArrowUpDown, Droplets, Camera, Flame, Trophy, Send,
} from "lucide-react";

const SUPPORT_PHONE = "+91 98765 43210";
const SUPPORT_PHONE_HREF = "tel:+919876543210";

// Amenity icons are stored as FontAwesome class names; map the common ones to lucide icons.
const AMENITY_ICONS = {
  "fa-dumbbell": Dumbbell, "fa-shield-alt": Shield, "fa-shield": Shield, "fa-car": Car,
  "fa-swimming-pool": Waves, "fa-swimmer": Waves, "fa-tree": Trees, "fa-leaf": Trees,
  "fa-wifi": Wifi, "fa-bolt": Zap, "fa-plug": Zap, "fa-child": Baby, "fa-baby": Baby,
  "fa-elevator": ArrowUpDown, "fa-arrows-alt-v": ArrowUpDown, "fa-tint": Droplets,
  "fa-video": Camera, "fa-camera": Camera, "fa-fire": Flame, "fa-fire-extinguisher": Flame,
  "fa-futbol": Trophy, "fa-basketball-ball": Trophy, "fa-building": Building2,
};

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "details", label: "More Details" },
  { id: "amenities", label: "Amenities" },
  { id: "plans", label: "Floor Plans" },
  { id: "documents", label: "Brochures" },
  { id: "similar", label: "Similar Properties" },
];

// ₹1.25 Cr / ₹45 Lac / ₹25,000 — the way Indian property portals show prices
function formatPrice(value) {
  const n = Number(value);
  if (!n) return null;
  const trim = (x) => x.toFixed(2).replace(/\.?0+$/, "");
  if (n >= 1e7) return `₹${trim(n / 1e7)} Cr`;
  if (n >= 1e5) return `₹${trim(n / 1e5)} Lac`;
  return `₹${n.toLocaleString("en-IN")}`;
}

const prettify = (s) => (s ? String(s).replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : null);
const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null);

export default function PropertyDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [similar, setSimilar] = useState([]);
  const [isFavorited, setIsFavorited] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const [lead, setLead] = useState({ name: "", phone: "", email: "", message: "" });
  const [leadStatus, setLeadStatus] = useState({ state: "idle", message: "" }); // idle | sending | sent | error

  useEffect(() => {
    const fetchProperty = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const token = localStorage.getItem("authToken");
        const res = await fetch(`/api/properties/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (!data.success) {
          setNotFound(true);
          return;
        }
        const p = data.data;
        setProperty(p);
        setActiveImage(0);
        setIsFavorited(!!p.is_favorited);

        // Prefill the contact form for logged-in users
        let user = null;
        try { user = JSON.parse(localStorage.getItem("authUser") || "null"); } catch { user = null; }
        setLead({
          name: user?.name || "",
          phone: user?.phone || "",
          email: user?.email || "",
          message: `I am interested in "${p.title}". Please share more details.`,
        });

        // Similar: same city + listing type, falling back to just the listing type
        const params = new URLSearchParams({ listing_type: p.listing_type || "", limit: "9" });
        if (p.city) params.set("city", p.city);
        const simRes = await fetch(`/api/properties?${params.toString()}`).then((r) => r.json()).catch(() => null);
        setSimilar((simRes?.data || []).filter((s) => String(s.id) !== String(p.id)).slice(0, 8));
      } catch (err) {
        console.error("Failed to fetch property:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProperty();
  }, [id]);

  const toggleFavorite = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push(`/login?redirect=/property/${id}`);
      return;
    }
    const next = !isFavorited;
    setIsFavorited(next);
    try {
      const res = next
        ? await fetch("/api/favorites", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ property_id: property.id }),
          })
        : await fetch(`/api/favorites/${property.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) setIsFavorited(!next);
    } catch {
      setIsFavorited(!next);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: property.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }
    } catch {
      // user cancelled the share sheet
    }
  };

  const submitLead = async (e) => {
    e.preventDefault();
    if (!lead.name.trim() || !lead.phone.trim()) {
      setLeadStatus({ state: "error", message: "Please enter your name and phone number." });
      return;
    }
    setLeadStatus({ state: "sending", message: "" });
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ property_id: property.id, ...lead }),
      });
      const data = await res.json();
      if (data.success) setLeadStatus({ state: "sent", message: data.message });
      else setLeadStatus({ state: "error", message: data.message || "Could not send your enquiry." });
    } catch {
      setLeadStatus({ state: "error", message: "Something went wrong. Please try again." });
    }
  };

  const scrollTo = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 font-sans">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mb-3" />
          <span className="text-sm">Loading property...</span>
        </div>
        <Footer />
      </main>
    );
  }

  if (notFound || !property) {
    return (
      <main className="min-h-screen bg-slate-50 font-sans">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 text-center px-4">
          <Building2 className="w-12 h-12 text-slate-300 mb-4" />
          <h1 className="text-xl font-bold text-[#0a1629] mb-2">Property Not Found</h1>
          <p className="text-sm text-slate-500 mb-6">This listing may have been removed or is not yet approved.</p>
          <Link href="/allproject" className="bg-[#0a1629] hover:bg-[#16243d] text-white text-sm font-semibold px-6 py-3 rounded-lg transition-colors">
            Browse All Properties
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  // ---------- derived values ----------
  const isRent = property.listing_type === "RENT";
  const images = property.images || [];
  const price = formatPrice(property.price);
  const pricePerSqft =
    !isRent && property.price && property.area_sqft
      ? `₹${Math.round(Number(property.price) / Number(property.area_sqft)).toLocaleString("en-IN")} per sq.ft.`
      : null;
  const bhk = property.bedrooms ? `${property.bedrooms} BHK` : null;
  const place = [property.location, property.city].filter(Boolean).join(", ");
  const headline = [bhk, prettify(property.property_sub_type) || prettify(property.property_type) || "Property", isRent ? "for Rent" : "for Sale", place && `in ${place}`]
    .filter(Boolean)
    .join(" ");

  const overview = [
    { icon: BedDouble, label: "Configuration", value: [property.bedrooms && `${property.bedrooms} Bedrooms`, property.bathrooms && `${property.bathrooms} Bathrooms`].filter(Boolean).join(", ") },
    { icon: Maximize, label: "Area", value: property.area_sqft && `${Number(property.area_sqft).toLocaleString("en-IN")} sq.ft.` },
    { icon: IndianRupee, label: isRent ? "Monthly Rent" : "Price", value: price ? `${price}${pricePerSqft ? ` (${pricePerSqft})` : ""}` : "Price on Request" },
    { icon: Sofa, label: "Furnishing", value: prettify(property.furnishing) },
    { icon: Compass, label: "Facing", value: property.facing },
    { icon: Car, label: "Parking", value: property.parking },
    { icon: KeyRound, label: "Ownership", value: property.ownership },
    { icon: Building2, label: "Property Type", value: [prettify(property.property_type), prettify(property.property_sub_type)].filter(Boolean).join(" · ") },
    isRent && { icon: CalendarDays, label: "Available From", value: formatDate(property.available_from) },
    isRent && { icon: Clock, label: "Lease Duration", value: property.lease_duration },
  ].filter((item) => item && item.value);

  const details = [
    ["Price", price || "Price on Request"],
    isRent && ["Security Deposit", formatPrice(property.security_deposit)],
    isRent && ["Maintenance", property.maintenance_charge && `${formatPrice(property.maintenance_charge)} / month`],
    ["Address", place],
    ["Category", [property.main_category_name, property.project_category_name].filter(Boolean).join(" · ")],
    ["Furnishing", prettify(property.furnishing)],
    ["Ownership", property.ownership],
    ["Facing", property.facing],
    ["Posted On", formatDate(property.created_at)],
    ["Property ID", `#${property.id}`],
  ].filter((row) => row && row[1]);

  const plans = [...(property.floor_plans || []).map((fp) => ({ ...fp, kind: "Floor Plan" })), ...(property.master_plans || []).map((mp) => ({ ...mp, kind: "Master Plan" }))];
  const visibleSections = SECTIONS.filter(({ id: sid }) => {
    if (sid === "amenities") return property.amenities?.length > 0;
    if (sid === "plans") return plans.length > 0;
    if (sid === "documents") return property.brochures?.length > 0;
    if (sid === "similar") return similar.length > 0;
    return true;
  });

  const openGalleryAt = (idx) => {
    setActiveImage(idx);
    setGalleryOpen(true);
  };

  const card = "bg-white rounded-xl border border-slate-200";

  return (
    <main className="min-h-screen bg-slate-50 font-sans pb-24 lg:pb-0">
      <Navbar />

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3 overflow-hidden">
          <Link href="/" className="hover:text-[#d9982b] shrink-0">Home</Link>
          <ChevronRight className="w-3 h-3 shrink-0" />
          <Link href={`/allproject?listing_type=${property.listing_type}`} className="hover:text-[#d9982b] shrink-0">
            {isRent ? "Property for Rent" : "Property for Sale"}
          </Link>
          {property.city && (
            <>
              <ChevronRight className="w-3 h-3 shrink-0" />
              <Link href={`/allproject?listing_type=${property.listing_type}&q=${encodeURIComponent(property.city)}`} className="hover:text-[#d9982b] shrink-0">
                {property.city}
              </Link>
            </>
          )}
          <ChevronRight className="w-3 h-3 shrink-0" />
          <span className="text-slate-700 truncate">{property.title}</span>
        </nav>

        {/* ================= HEADER + GALLERY + OVERVIEW ================= */}
        <section id="overview" className={`${card} scroll-mt-32`}>
          {/* Price + title row */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 p-5 md:p-6 border-b border-slate-100">
            <div className="md:pr-6 md:border-r md:border-slate-200 shrink-0">
              <div className="text-2xl md:text-3xl font-extrabold text-[#0a1629] leading-none">
                {price || "Price on Request"}
                {isRent && price && <span className="text-base font-semibold text-slate-500"> /month</span>}
              </div>
              {pricePerSqft && <div className="text-xs text-slate-500 mt-1.5">@ {pricePerSqft}</div>}
              {isRent && property.security_deposit && (
                <div className="text-xs text-slate-500 mt-1.5">Deposit {formatPrice(property.security_deposit)}</div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-lg md:text-xl font-bold text-[#0a1629] leading-snug">{headline}</h1>
              <p className="text-sm text-slate-600 mt-1 truncate">{property.title}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-[#d9982b]" />{place || "Location not specified"}</span>
                <span className="flex items-center gap-1 text-emerald-700"><ShieldCheck className="w-3.5 h-3.5" />Verified listing</span>
                {property.views > 0 && <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{property.views} views</span>}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={toggleFavorite}
                className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${
                  isFavorited ? "border-red-200 bg-red-50 text-red-500" : "border-slate-200 text-slate-500 hover:text-red-500"
                }`}
                title={isFavorited ? "Remove from shortlist" : "Shortlist"}
              >
                <Heart className={`w-4.5 h-4.5 ${isFavorited ? "fill-current" : ""}`} />
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="relative w-10 h-10 rounded-full border border-slate-200 text-slate-500 hover:text-[#0a1629] flex items-center justify-center transition-colors"
                title="Share"
              >
                <Share2 className="w-4.5 h-4.5" />
                {shareCopied && (
                  <span className="absolute -bottom-8 right-0 whitespace-nowrap bg-[#0a1629] text-white text-[11px] px-2 py-1 rounded">Link copied</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => scrollTo("contact")}
                className="hidden md:flex items-center gap-2 bg-[#0a1629] hover:bg-[#16243d] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
              >
                <Phone className="w-4 h-4" /> Contact Owner
              </button>
            </div>
          </div>

          {/* Gallery: one large photo + two stacked */}
          <div className="p-4 md:p-5">
            {images.length === 0 ? (
              <div className="w-full h-[240px] md:h-[400px] bg-slate-100 rounded-lg flex flex-col items-center justify-center text-slate-300">
                <ImageIcon className="w-12 h-12 mb-2" />
                <span className="text-sm font-medium">No photos available</span>
              </div>
            ) : (
              <div className="grid grid-cols-3 grid-rows-2 gap-2 h-[240px] sm:h-[320px] md:h-[400px]">
                <button
                  type="button"
                  onClick={() => openGalleryAt(0)}
                  className={`relative overflow-hidden rounded-lg bg-slate-100 group row-span-2 ${images.length > 1 ? "col-span-3 md:col-span-2" : "col-span-3"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={images[0].image} alt={property.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                  <span className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/60 text-white text-xs font-semibold px-2.5 py-1 rounded">
                    <Camera className="w-3.5 h-3.5" /> {images.length} Photos
                  </span>
                </button>
                {images.slice(1, 3).map((img, i) => {
                  const remaining = images.length - 3;
                  return (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => openGalleryAt(i + 1)}
                      className={`hidden md:block relative overflow-hidden rounded-lg bg-slate-100 group ${images.length === 2 ? "row-span-2" : ""}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.image} alt="" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                      {i === 1 && remaining > 0 && (
                        <span className="absolute inset-0 bg-black/55 flex items-center justify-center text-white font-bold text-lg">
                          +{remaining} Photos
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Overview facts */}
          {overview.length > 0 && (
            <div className="px-5 md:px-6 pb-6">
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-5 pt-5 border-t border-slate-100">
                {overview.map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <span className="w-9 h-9 rounded-lg bg-[#fbf6ec] flex items-center justify-center shrink-0">
                      <item.icon className="w-4.5 h-4.5 text-[#d9982b]" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs text-slate-500">{item.label}</div>
                      <div className="text-sm font-semibold text-[#0a1629] break-words">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ================= STICKY SECTION TABS ================= */}
        <div className="sticky top-16 z-30 -mx-4 sm:mx-0 mt-4 bg-white sm:rounded-xl border-y sm:border border-slate-200 shadow-sm">
          <div className="flex overflow-x-auto no-scrollbar px-2">
            {visibleSections.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => scrollTo(s.id)}
                className="shrink-0 px-4 py-3.5 text-sm font-semibold text-slate-600 hover:text-[#0a1629] border-b-2 border-transparent hover:border-[#d9982b] transition-colors"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 mt-4 pb-12">
          {/* ================= LEFT: CONTENT ================= */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* More details */}
            <section id="details" className={`${card} p-5 md:p-6 scroll-mt-32`}>
              <h2 className="text-lg font-bold text-[#0a1629] mb-4">More Details</h2>
              <dl className="grid xl:grid-cols-2 gap-x-8">
                {details.map(([label, value]) => (
                  <div key={label} className="flex gap-4 py-2.5 border-b border-slate-100 text-sm">
                    <dt className="w-32 shrink-0 text-slate-500">{label}</dt>
                    <dd className="font-semibold text-[#0a1629] min-w-0 break-words">{value}</dd>
                  </div>
                ))}
              </dl>

              {property.description && (
                <div className="mt-6">
                  <h3 className="text-sm font-bold text-[#0a1629] mb-2">About this property</h3>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{property.description}</p>
                </div>
              )}
            </section>

            {/* Amenities */}
            {property.amenities?.length > 0 && (
              <section id="amenities" className={`${card} p-5 md:p-6 scroll-mt-32`}>
                <h2 className="text-lg font-bold text-[#0a1629] mb-4">Amenities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                  {property.amenities.map((a) => {
                    const Icon = AMENITY_ICONS[a.icon] || CheckCircle2;
                    return (
                      <div key={a.id} className="flex items-center gap-3 border border-slate-200 rounded-lg px-3 py-3 text-sm text-slate-700">
                        <Icon className="w-5 h-5 text-[#d9982b] shrink-0" />
                        <span className="truncate">{a.name}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Floor & master plans */}
            {plans.length > 0 && (
              <section id="plans" className={`${card} p-5 md:p-6 scroll-mt-32`}>
                <h2 className="text-lg font-bold text-[#0a1629] mb-4">Floor Plans & Master Plan</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {plans.map((plan) => (
                    <a
                      key={`${plan.kind}-${plan.id}`}
                      href={plan.image}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="h-48 bg-slate-50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={plan.image} alt={plan.title || plan.kind} className="w-full h-full object-contain" />
                      </div>
                      <div className="px-3 py-2.5 text-sm font-medium text-slate-700 border-t border-slate-100 group-hover:text-[#d9982b]">
                        {plan.title || plan.kind}
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Brochures */}
            {property.brochures?.length > 0 && (
              <section id="documents" className={`${card} p-5 md:p-6 scroll-mt-32`}>
                <h2 className="text-lg font-bold text-[#0a1629] mb-4">Brochures</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {property.brochures.map((b) => (
                    <a
                      key={b.id}
                      href={b.pdf_file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg px-4 py-3 hover:border-[#d9982b] hover:text-[#d9982b] transition-colors"
                    >
                      <FileText className="w-5 h-5 shrink-0 text-red-500" /> {b.title || "Download Brochure"}
                    </a>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ================= RIGHT: CONTACT CARD ================= */}
          <aside id="contact" className="lg:w-[360px] shrink-0 scroll-mt-32">
            <div className={`${card} p-5 lg:sticky lg:top-36`}>
              <h2 className="text-base font-bold text-[#0a1629]">Contact Owner</h2>
              <p className="text-xs text-slate-500 mt-1 mb-4">Share your details and our team will call you back.</p>

              {leadStatus.state === "sent" ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-[#0a1629]">Enquiry sent!</p>
                  <p className="text-xs text-slate-500 mt-1">{leadStatus.message}</p>
                </div>
              ) : (
                <form onSubmit={submitLead} className="space-y-3">
                  <input
                    type="text"
                    required
                    placeholder="Your name *"
                    value={lead.name}
                    onChange={(e) => setLead({ ...lead, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#0a1629] focus:ring-1 focus:ring-[#0a1629]"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Phone number *"
                    value={lead.phone}
                    onChange={(e) => setLead({ ...lead, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#0a1629] focus:ring-1 focus:ring-[#0a1629]"
                  />
                  <input
                    type="email"
                    placeholder="Email (optional)"
                    value={lead.email}
                    onChange={(e) => setLead({ ...lead, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-[#0a1629] focus:ring-1 focus:ring-[#0a1629]"
                  />
                  <textarea
                    rows={3}
                    value={lead.message}
                    onChange={(e) => setLead({ ...lead, message: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:border-[#0a1629] focus:ring-1 focus:ring-[#0a1629]"
                  />
                  {leadStatus.state === "error" && <p className="text-xs text-red-600">{leadStatus.message}</p>}
                  <button
                    type="submit"
                    disabled={leadStatus.state === "sending"}
                    className="w-full flex items-center justify-center gap-2 bg-[#0a1629] hover:bg-[#16243d] disabled:bg-slate-400 text-white font-semibold text-sm py-3 rounded-lg transition-colors"
                  >
                    {leadStatus.state === "sending" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {leadStatus.state === "sending" ? "Sending..." : "Get Contact Details"}
                  </button>
                </form>
              )}

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">Or call us</span>
                <a href={SUPPORT_PHONE_HREF} className="flex items-center gap-1.5 text-sm font-semibold text-[#0a1629] hover:text-[#d9982b]">
                  <Phone className="w-4 h-4 text-[#d9982b]" /> {SUPPORT_PHONE}
                </a>
              </div>
            </div>
          </aside>
        </div>

        {/* ================= SIMILAR PROPERTIES ================= */}
        {similar.length > 0 && (
          <section id="similar" className="pb-14 scroll-mt-32">
            <div className="flex items-end justify-between mb-5">
              <div>
                <p className="text-slate-500 font-bold text-xs tracking-[0.15em] uppercase mb-1">You may also like</p>
                <h2 className="text-2xl font-bold text-[#0a1629]">Similar Properties</h2>
              </div>
              <Link
                href={`/allproject?listing_type=${property.listing_type}${property.city ? `&q=${encodeURIComponent(property.city)}` : ""}`}
                className="text-sm font-semibold text-[#d9982b] hover:text-[#b87d1c] flex items-center gap-1"
              >
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {similar.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ================= MOBILE STICKY BOTTOM BAR ================= */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 px-4 py-3 flex items-center justify-between gap-3 shadow-[0_-4px_20px_rgb(0,0,0,0.06)] z-40">
        <div className="min-w-0">
          <div className="text-lg font-extrabold text-[#0a1629] truncate">
            {price || "Price on Request"}
            {isRent && price && <span className="text-xs font-semibold text-slate-500"> /month</span>}
          </div>
          {pricePerSqft && <div className="text-[11px] text-slate-500">@ {pricePerSqft}</div>}
        </div>
        <button
          type="button"
          onClick={() => scrollTo("contact")}
          className="flex items-center gap-2 bg-[#0a1629] text-white font-semibold text-sm px-5 py-3 rounded-lg shrink-0"
        >
          <Phone className="w-4 h-4" /> Contact Owner
        </button>
      </div>

      {/* ================= FULLSCREEN GALLERY ================= */}
      {galleryOpen && images.length > 0 && (
        <div className="fixed inset-0 bg-black/95 z-[60] flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 text-white">
            <span className="text-sm font-medium">{activeImage + 1} / {images.length}</span>
            <button type="button" onClick={() => setGalleryOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors" aria-label="Close gallery">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center relative px-4 min-h-0">
            <button
              type="button"
              onClick={() => setActiveImage((prev) => (prev - 1 + images.length) % images.length)}
              className="absolute left-2 md:left-6 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={images[activeImage].image} alt="" className="max-h-full max-w-full object-contain rounded-lg" />
            <button
              type="button"
              onClick={() => setActiveImage((prev) => (prev + 1) % images.length)}
              className="absolute right-2 md:right-6 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              aria-label="Next photo"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar px-5 py-4">
            {images.map((img, idx) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setActiveImage(idx)}
                className={`w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                  idx === activeImage ? "border-[#d9982b]" : "border-transparent opacity-60"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.image} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
