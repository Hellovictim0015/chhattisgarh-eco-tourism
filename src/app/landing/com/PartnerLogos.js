"use client";

export default function PartnerLogos() {
  // Developer brands data based on the image
  const developers = [
    { id: 1, name: "DLF", src: "/logos/dlf.svg" },
    { id: 2, name: "Godrej Properties", src: "/logos/godrej.svg" },
    { id: 3, name: "Prestige Group", src: "/logos/prestige.svg" },
    { id: 4, name: "Brigade", src: "/logos/brigade.svg" },
    { id: 5, name: "Sobha", src: "/logos/sobha.svg" },
    { id: 6, name: "Puravankara", src: "/logos/puravankara.svg" },
    { id: 7, name: "Mahindra Lifespaces", src: "/logos/mahindra.svg" }
  ];

  return (
    <section className="w-full bg-[#fcfcfc] border-b border-slate-200 py-6 md:py-8 overflow-hidden">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Logos Container */}
        <div className="flex flex-wrap justify-center md:justify-between items-center gap-8 md:gap-4">
          {developers.map((brand) => (
            <div 
              key={brand.id} 
              className="flex items-center justify-center w-[100px] md:w-[130px] h-12 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer"
            >
              {/* Note: Replace 'src' paths in the array with your actual logo image paths. 
                  For now, I've added a fallback styling showing the name if the image isn't found. */}
              <img 
                src={brand.src} 
                alt={`${brand.name} Logo`} 
                className="max-h-full max-w-full object-contain"
                // Fallback text setup in case images are missing in your local environment
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              {/* Fallback Text (Hidden by default, shows if img fails) */}
              <span className="hidden text-sm font-bold text-slate-500 uppercase tracking-wider text-center">
                {brand.name}
              </span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}