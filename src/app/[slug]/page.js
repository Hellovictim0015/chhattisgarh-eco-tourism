"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyCard from "@/components/PropertyCard";
import { ChevronRight, ChevronLeft, Building2, Loader2 } from "lucide-react";

function CategoryPageContent() {
  const { slug } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page"), 10) || 1;

  const [category, setCategory] = useState(null);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [properties, setProperties] = useState([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 48, total: 0, totalPages: 1 });

  // Resolve the slug against the same categories shown in the navbar
  useEffect(() => {
    const fetchCategory = async () => {
      setCategoryLoading(true);
      setNotFound(false);
      try {
        const res = await fetch("/api/navbarapi");
        const data = await res.json();
        const match = data.success ? data.data.find((c) => c.slug.trim() === slug) : null;
        if (match) {
          setCategory(match);
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("Failed to resolve category:", err);
        setNotFound(true);
      } finally {
        setCategoryLoading(false);
      }
    };

    if (slug) fetchCategory();
  }, [slug]);

  // Fetch properties for the resolved category
  useEffect(() => {
    if (!category) return;

    const fetchProperties = async () => {
      setPropertiesLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("project_category_id", category.id);
        params.set("limit", "48");
        params.set("page", String(page));

        const res = await fetch(`/api/properties?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          setProperties(data.data);
          setPagination(data.pagination);
        }
      } catch (err) {
        console.error("Failed to fetch properties:", err);
      } finally {
        setPropertiesLoading(false);
      }
    };

    fetchProperties();
  }, [category, page]);

  const goToPage = (newPage) => {
    router.push(`/${slug}?page=${newPage}`);
  };

  if (categoryLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-3" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center px-4">
        <Building2 className="w-12 h-12 text-slate-300 mb-4" />
        <h1 className="text-xl font-bold text-[#0a1629] mb-2">Category Not Found</h1>
        <p className="text-sm text-slate-500 mb-6">This category may have been removed or is no longer active.</p>
        <Link href="/allproject" className="bg-[#0a1629] hover:bg-slate-800 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors">
          Browse All Projects
        </Link>
      </div>
    );
  }

  const pageNumbers = [];
  for (let i = Math.max(1, pagination.page - 2); i <= Math.min(pagination.totalPages, pagination.page + 2); i++) {
    pageNumbers.push(i);
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] font-sans pb-20">
      <div className="max-w-[95rem] mx-auto px-4 md:px-8 pt-6">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
            <Link href="/" className="hover:text-[#d9982b]">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-[#0a1629] font-semibold">{category.name.trim()}</span>
          </div>
          <h1 className="text-3xl font-bold text-[#0a1629] mb-1">{category.name.trim()}</h1>
          <p className="text-sm text-slate-500">
            {propertiesLoading ? "Loading properties..." : `${pagination.total} propert${pagination.total === 1 ? "y" : "ies"} found`}
          </p>
        </div>

        {propertiesLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <span className="text-sm">Loading properties...</span>
          </div>
        ) : properties.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 flex flex-col items-center justify-center text-center">
            <Building2 className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-[#0a1629] mb-1">No Properties Found</h3>
            <p className="text-sm text-slate-500 mb-6">There are no properties listed under this category yet.</p>
            <Link href="/allproject" className="bg-[#0a1629] hover:bg-slate-800 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors">
              Browse All Projects
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 mb-12">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5">
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
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function CategoryPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={null}>
        <CategoryPageContent />
      </Suspense>
      <Footer />
    </>
  );
}
