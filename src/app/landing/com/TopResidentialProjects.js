"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import PropertyCard from '@/components/PropertyCard';

export default function TopResidentialProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch('/api/admin/top-residential-projects');
        const data = await res.json();
        if (data.success) {
          setProjects(data.data.filter((p) => p.status === 'ACTIVE'));
        }
      } catch (err) {
        console.error('Failed to fetch top residential projects:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -450 : 450;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!loading && projects.length === 0) return null;

  return (
    <div className="w-full bg-white font-sans py-12 overflow-hidden">
      <section className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 relative">

        {/* Header Area */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-slate-500 font-bold text-xs sm:text-sm tracking-[0.15em] uppercase mb-1.5 block">
              Top Picks
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-[#0a1629]">
              Top Residential Projects
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/allproject" className="border border-slate-200 text-slate-700 font-semibold text-sm px-5 py-2 rounded-lg hover:bg-slate-50 transition-colors bg-white shadow-sm">
              View All Projects
            </Link>
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => scroll('left')}
                className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 hover:text-[#d9982b] transition-colors shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scroll('right')}
                className="w-9 h-9 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 hover:text-[#d9982b] transition-colors shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <span className="text-sm">Loading top projects...</span>
          </div>
        ) : (
          <div className="relative group">
            <button
              onClick={() => scroll('left')}
              className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white shadow-[0_4px_15px_rgb(0,0,0,0.1)] rounded-full hidden lg:group-hover:flex items-center justify-center text-slate-600 hover:text-[#d9982b] border border-slate-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory py-4"
            >
              {projects.map((project) => (
                <div key={project.id} className="min-w-[190px] md:min-w-[220px] snap-start shrink-0">
                  <PropertyCard property={project} id={project.property_id} />
                </div>
              ))}
            </div>

            <button
              onClick={() => scroll('right')}
              className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white shadow-[0_4px_15px_rgb(0,0,0,0.1)] rounded-full hidden lg:group-hover:flex items-center justify-center text-slate-600 hover:text-[#d9982b] border border-slate-100"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

      </section>
    </div>
  );
}
