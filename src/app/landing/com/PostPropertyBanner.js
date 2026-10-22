"use client";

import { useRouter } from 'next/navigation';
import { ArrowRight, Users, ShieldCheck, Zap } from 'lucide-react';

export default function PostPropertyBanner() {
  const router = useRouter();

  const handlePost = () => {
    const token = localStorage.getItem('authToken');
    router.push(token ? '/myProperty' : '/login?redirect=/myProperty');
  };

  return (
    <section className="font-sans bg-slate-50 py-14">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-[#0a1629] px-6 py-10 sm:px-12 sm:py-12">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#d9982b]/20" />
          <div className="absolute right-24 -bottom-20 w-48 h-48 rounded-full bg-[#d9982b]/10" />

          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-xl">
              <span className="inline-block bg-emerald-500 text-white text-[11px] font-bold px-2 py-0.5 rounded mb-3">
                FREE
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                Have a property to sell or rent?
              </h2>
              <p className="mt-2 text-slate-300 text-sm md:text-base">
                List it with us for free and connect with genuine buyers and tenants faster.
              </p>
              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-200">
                <span className="flex items-center gap-2"><Users className="w-4 h-4 text-[#f2b544]" /> Wide reach</span>
                <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#f2b544]" /> Verified by our team</span>
                <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-[#f2b544]" /> Live in minutes</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePost}
              className="self-start lg:self-center inline-flex items-center gap-2 bg-[#d9982b] hover:bg-[#c4861f] text-white px-7 py-3.5 rounded-lg font-bold text-sm transition-colors shadow-lg whitespace-nowrap"
            >
              Post Property <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
