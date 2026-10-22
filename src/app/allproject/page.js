"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PropertyCard from '@/components/PropertyCard';
import {
  ChevronRight, Building2, Home, Maximize,
  BedDouble, Bath, Compass, Construction, RotateCcw,
  Grid, List, ChevronDown, ChevronLeft, IndianRupee, Filter,
  Loader2, SlidersHorizontal
} from 'lucide-react';

const PRICE_LABELS = {
  '1000000': '₹10 L', '2500000': '₹25 L', '5000000': '₹50 L', '7500000': '₹75 L',
  '10000000': '₹1 Cr', '20000000': '₹2 Cr', '50000000': '₹5 Cr+',
};

function AllProjectsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [showFilters, setShowFilters] = useState(false); // mobile only; always visible on desktop

  const q = searchParams.get('q') || '';
  const propertyType = searchParams.get('property_type') || '';
  const listingType = searchParams.get('listing_type') || '';
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';
  const sort = searchParams.get('sort') || 'newest';
  const limit = searchParams.get('limit') || '12';
  const page = searchParams.get('page') || '1';

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams(searchParams.toString());
        if (!params.get('limit')) params.set('limit', '12');
        if (!params.get('page')) params.set('page', '1');

        const res = await fetch(`/api/properties?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          setProperties(data.data);
          setPagination(data.pagination);
        }
      } catch (err) {
        console.error('Failed to fetch properties:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, [searchParams]);

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete('page'); // reset to page 1 on filter change
    router.push(`/allproject?${params.toString()}`);
  };

  const removeFilter = (key) => updateParam(key, '');

  const goToPage = (newPage) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    router.push(`/allproject?${params.toString()}`);
  };

  const activeFilters = [
    q && { key: 'q', label: q },
    propertyType && { key: 'property_type', label: propertyType === 'RESIDENTIAL' ? 'Residential' : 'Commercial' },
    listingType && { key: 'listing_type', label: listingType === 'RENT' ? 'For Rent' : 'For Sale' },
    minPrice && { key: 'min_price', label: `Min ${PRICE_LABELS[minPrice] || minPrice}` },
    maxPrice && { key: 'max_price', label: `Max ${PRICE_LABELS[maxPrice] || maxPrice}` },
  ].filter(Boolean);

  const filters = [
    { label: "Budget", icon: IndianRupee, placeholder: "Select Budget" },
    { label: "City", icon: Building2, placeholder: "Select City" },
    { label: "Property Type", icon: Home, placeholder: "Select Property Type" },
    { label: "Size", icon: Maximize, placeholder: "Select Size" },
    { label: "Bedrooms", icon: BedDouble, placeholder: "Select Bedrooms" },
    { label: "Bathrooms", icon: Bath, placeholder: "Select Bathrooms" },
    { label: "Facing", icon: Compass, placeholder: "Select Facing" },
    { label: "Construction Status", icon: Construction, placeholder: "Select Status" },
  ];

  const pageNumbers = [];
  for (let i = Math.max(1, pagination.page - 2); i <= Math.min(pagination.totalPages, pagination.page + 2); i++) {
    pageNumbers.push(i);
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] font-sans pb-20">
      <div className="max-w-[95rem] mx-auto px-4 md:px-8 pt-6">

        {/* TOP HEADER AREA */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-6 gap-4 lg:gap-6">

          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
              <Link href="/" className="hover:text-[#d9982b] cursor-pointer">Home</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-[#0a1629] font-semibold">All Projects</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0a1629] mb-1">All Projects</h1>
            <p className="text-sm text-slate-500">Explore our wide range of residential and commercial projects.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="hidden sm:flex bg-white border border-slate-100 rounded-xl px-5 py-2.5 items-center gap-3 shadow-sm mr-4">
              <Building2 className="w-6 h-6 text-[#d9982b]" />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[#0a1629] leading-tight">{pagination.total}</span>
                <span className="text-[11px] text-slate-500">Projects Available</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className="lg:hidden flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-semibold text-[#0a1629] shadow-sm"
              aria-expanded={showFilters}
            >
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </button>

            <div className="flex items-center gap-2 sm:gap-3 flex-1 sm:flex-none min-w-0">
              <span className="hidden sm:inline text-sm text-slate-600 font-medium">Sort By:</span>
              <div className="relative w-full sm:w-44">
                <select
                  value={sort}
                  onChange={(e) => updateParam('sort', e.target.value === 'newest' ? '' : e.target.value)}
                  className="w-full appearance-none bg-white border border-slate-200 rounded-lg py-2 pl-3 pr-8 text-sm text-[#0a1629] font-medium outline-none shadow-sm cursor-pointer focus:border-[#d9982b]"
                >
                  <option value="newest">Newest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2">
              <button className="w-10 h-10 rounded-lg bg-[#0a1629] text-white flex items-center justify-center shadow-md">
                <Grid className="w-4 h-4" />
              </button>
              <button className="w-10 h-10 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-[#0a1629] flex items-center justify-center shadow-sm transition-colors">
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>


        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* LEFT SIDEBAR: Filters */}
          <aside className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-1/4 xl:w-[22%] shrink-0`}>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6 lg:sticky lg:top-20">

              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-[#0a1629] flex items-center gap-2">
                  Filter Projects
                </h2>
                <button onClick={() => router.push('/allproject')} className="text-[#d9982b] text-sm font-semibold flex items-center gap-1.5 hover:text-amber-600 transition-colors">
                  <RotateCcw className="w-3.5 h-3.5" /> Reset All
                </button>
              </div>

              <div className="flex flex-col gap-5">
                {filters.map((filter, idx) => {
                  const Icon = filter.icon;
                  return (
                    <div key={idx} className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-[#0a1629]">{filter.label}</label>
                      <div className="relative">
                        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <select className="w-full appearance-none bg-white border border-slate-200 rounded-lg py-2.5 pl-9 pr-8 text-sm text-slate-600 outline-none cursor-pointer hover:border-[#d9982b] focus:border-[#d9982b] focus:ring-1 focus:ring-[#d9982b] transition-all">
                          <option value="">{filter.placeholder}</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-400 mt-4">More filters coming soon. Use the homepage search bar above for Location, Property Type &amp; Price.</p>
            </div>
          </aside>


          {/* RIGHT CONTENT: Grid & Pagination */}
          <div className="w-full lg:w-3/4 xl:w-[78%] flex flex-col">

            {/* Active Filters Bar */}
            {activeFilters.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 sm:p-4 flex flex-wrap items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
                <span className="text-sm font-bold text-[#0a1629]">Active Filters:</span>

                <div className="flex flex-wrap items-center gap-2">
                  {activeFilters.map((f) => (
                    <span key={f.key} className="bg-slate-100 text-slate-600 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-2">
                      {f.label} <button onClick={() => removeFilter(f.key)} className="hover:text-red-500">×</button>
                    </span>
                  ))}
                </div>

                <button onClick={() => router.push('/allproject')} className="text-[#d9982b] text-xs font-bold hover:underline ml-2">
                  Clear All
                </button>
              </div>
            )}

            <p className="text-sm text-slate-500 mb-4">
              {loading ? 'Loading...' : pagination.total === 0
                ? 'No projects found'
                : `Showing ${(pagination.page - 1) * pagination.limit + 1} - ${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} Projects`}
            </p>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <span className="text-sm">Loading projects...</span>
              </div>
            ) : properties.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 sm:p-16 flex flex-col items-center justify-center text-center">
                <Building2 className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-[#0a1629] mb-1">No Projects Found</h3>
                <p className="text-sm text-slate-500 mb-6">Try adjusting your filters or search terms.</p>
                <button onClick={() => router.push('/allproject')} className="bg-[#0a1629] hover:bg-slate-800 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors">
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                {/* Property Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 mb-12">
                  {properties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>

                {/* Pagination & Show Per Page */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">

                  <div className="flex items-center gap-1.5 mx-auto sm:mx-0">
                    <button
                      onClick={() => goToPage(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="w-10 h-10 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {pageNumbers.map((n) => (
                      <button
                        key={n}
                        onClick={() => goToPage(n)}
                        className={`w-10 h-10 rounded-lg font-bold text-sm flex items-center justify-center transition-colors ${
                          n === pagination.page
                            ? 'bg-[#0a1629] text-white shadow-md'
                            : 'border border-slate-200 bg-white text-slate-600 font-medium hover:bg-slate-50'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      onClick={() => goToPage(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      className="w-10 h-10 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-500 font-medium">Show:</span>
                    <div className="relative w-36">
                      <select
                        value={limit}
                        onChange={(e) => updateParam('limit', e.target.value)}
                        className="w-full appearance-none bg-white border border-slate-200 rounded-lg py-2 pl-4 pr-8 text-sm text-[#0a1629] font-medium outline-none cursor-pointer focus:border-[#d9982b]"
                      >
                        <option value="12">12 Per Page</option>
                        <option value="24">24 Per Page</option>
                        <option value="48">48 Per Page</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>

                </div>
              </>
            )}

          </div>
        </div>

      </div>
    </main>
  );
}

export default function AllProjectsPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={null}>
        <AllProjectsContent />
      </Suspense>
      <Footer />
    </>
  );
}
