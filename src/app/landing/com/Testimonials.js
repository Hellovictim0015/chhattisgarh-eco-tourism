"use client";

import { ArrowRight, ChevronLeft, ChevronRight, Star } from 'lucide-react';

export default function PromoAndTestimonial() {
  return (
    <section className="w-full bg-slate-50 font-sans py-16">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* =========================================
              LEFT: PROMO BANNER (Takes 7 columns)
              ========================================= */}
          <div className="lg:col-span-7 bg-[#0a1629] rounded-2xl overflow-hidden relative flex flex-col sm:flex-row items-center shadow-lg min-h-[300px]">
            
            {/* Content Area */}
            <div className="p-8 md:p-10 relative z-20 w-full sm:w-[55%] flex flex-col justify-center">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4 leading-tight">
                Explore Thousands of <br className="hidden md:block" />
                Properties With Us
              </h2>
              <p className="text-slate-300 text-sm md:text-base mb-8">
                Your dream home is just a search away.
              </p>
              <div>
                <button className="bg-[#d9982b] hover:bg-amber-500 transition-colors text-white px-6 py-3 rounded-lg font-semibold text-sm flex items-center gap-2 shadow-md">
                  Explore All Properties <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Image Area with Gradient Fade */}
            <div className="relative w-full sm:absolute sm:right-0 sm:top-0 sm:bottom-0 sm:w-[55%] h-64 sm:h-auto z-10">
              {/* Fade gradient to blend image smoothly into the dark blue background */}
              <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-[#0a1629] via-[#0a1629]/80 sm:via-[#0a1629]/40 to-transparent z-10"></div>
              
              <img 
                src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                alt="Modern luxury house at night" 
                className="w-full h-full object-cover object-left"
              />
            </div>
          </div>


          {/* =========================================
              RIGHT: TESTIMONIAL WIDGET (Takes 5 columns)
              ========================================= */}
          <div className="lg:col-span-5 flex flex-col w-full pl-0 lg:pl-4">
            
            <span className="text-[#d9982b] font-bold text-xs uppercase tracking-wider mb-4">
              What Our Clients Say
            </span>

            {/* Slider Container */}
            <div className="flex items-center gap-3 md:gap-5">
              
              {/* Left Arrow */}
              <button className="w-8 h-8 shrink-0 bg-[#0a1629] hover:bg-slate-800 transition-colors rounded-full flex items-center justify-center text-white shadow-md">
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Review Card */}
              <div className="bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-2xl p-6 md:p-8 flex-1 relative">
                
                {/* Custom SVG Quote Icon matching the image */}
                <div className="mb-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#d9982b]">
                    <path d="M9.983 3v7.391c0 5.704-3.731 9.57-8.983 10.609l-.995-2.151c2.432-.917 3.995-3.638 3.995-5.849h-4v-10h9.983zm14.017 0v7.391c0 5.704-3.748 9.571-9 10.609l-.996-2.151c2.433-.917 3.996-3.638 3.996-5.849h-3.983v-10h9.983z" fill="currentColor"/>
                  </svg>
                </div>

                <p className="text-slate-600 text-sm leading-relaxed mb-8">
                  "Dream Home Properties made finding my dream home so easy!" The team was professional, helpful and guided me at every step.
                </p>

                {/* Profile & Rating */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80" 
                      alt="Rohan Sharma" 
                      className="w-11 h-11 rounded-full object-cover shadow-sm"
                    />
                    <div>
                      <h4 className="font-bold text-[#0a1629] text-[15px]">Rohan Sharma</h4>
                      <span className="text-slate-500 text-[13px] font-medium">Happy Buyer</span>
                    </div>
                  </div>

                  {/* 5 Stars */}
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#d9982b] text-[#d9982b]" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Arrow */}
              <button className="w-8 h-8 shrink-0 bg-[#0a1629] hover:bg-slate-800 transition-colors rounded-full flex items-center justify-center text-white shadow-md">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Pagination Bars */}
            <div className="flex justify-center items-center gap-2 mt-6">
              <div className="w-6 h-1.5 rounded-full bg-[#d9982b] cursor-pointer"></div>
              <div className="w-6 h-1.5 rounded-full bg-slate-300 hover:bg-slate-400 cursor-pointer transition-colors"></div>
              <div className="w-6 h-1.5 rounded-full bg-slate-300 hover:bg-slate-400 cursor-pointer transition-colors"></div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}