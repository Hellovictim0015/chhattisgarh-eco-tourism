import { ShieldCheck, HandCoins, Headset, FileCheck2 } from 'lucide-react';

export default function TrustBanner() {
  const features = [
    {
      id: 1,
      icon: ShieldCheck,
      title: "Verified Properties",
      subtitle: "100% Verified",
    },
    {
      id: 2,
      icon: HandCoins, 
      title: "Best Price Guarantee",
      subtitle: "Unbeatable Prices",
    },
    {
      id: 3,
      icon: Headset,
      title: "Expert Support",
      subtitle: "24/7 Assistance",
    },
    {
      id: 4,
      icon: FileCheck2,
      title: "Easy & Secure",
      subtitle: "Safe & Hassle Free",
    },
  ];

  return (
    <section className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 font-sans">
      {/* Main Container */}
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50 py-2 px-4 lg:py-0">
        
        {/* Grid layout with automatic Tailwind dividers */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:gap-y-4 lg:gap-y-0 lg:divide-x divide-slate-100">
          
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div 
                key={feature.id} 
                className="flex items-center gap-5 px-6 py-5 lg:py-6"
              >
                {/* Icon Circle */}
                <div className="w-14 h-14 rounded-full bg-white shadow-[0_4px_15px_rgb(0,0,0,0.05)] border border-slate-50 flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6 text-amber-500" strokeWidth={1.5} />
                </div>
                
                {/* Text Content */}
                <div className="flex flex-col">
                  <h4 className="text-[15px] font-bold text-slate-800 leading-snug">
                    {feature.title}
                  </h4>
                  <p className="text-[13px] text-slate-500 font-medium mt-0.5">
                    {feature.subtitle}
                  </p>
                </div>
              </div>
            );
          })}

        </div>
      </div>
    </section>
  );
}