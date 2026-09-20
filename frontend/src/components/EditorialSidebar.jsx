import React from 'react';
import { Search, MapPin, BarChart3, Layers } from 'lucide-react';

export default function EditorialSidebar({ onFocusSearch }) {
  return (
    <aside className="hidden xl:flex flex-col justify-between w-[340px] shrink-0 bg-[#FAF9F5] border border-[#EAE9E4] rounded-3xl overflow-hidden shadow-sm relative">
      
      {/* Top Content Area */}
      <div className="p-7 space-y-6 z-10">
        
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#EAF5EF] border border-[#D2E7DA]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2D7A51]" />
          <span className="text-[10px] font-bold tracking-widest text-[#2D7A51] uppercase font-mono">
            Live Insights For a Busier India
          </span>
        </div>

        <div className="space-y-3">
          <h1 className="text-[42px] leading-[1.08] font-serif font-normal text-[#171918] tracking-tight">
            Know the <br />
            space <span className="italic font-normal text-[#1E3A2F]">before</span> <br />
            you step into it.
          </h1>
          <p className="text-xs text-stone-500 font-sans leading-relaxed pt-1">
            Real-time occupancy. Smarter decisions. <br />
            Happier experiences.
          </p>
        </div>

        {/* Consumer-Facing Search CTA */}
        <button
          onClick={onFocusSearch}
          className="w-full flex items-center justify-center space-x-2.5 bg-[#183B2B] hover:bg-[#132E27] text-white py-3.5 rounded-full text-xs font-semibold tracking-wide transition-all shadow-md hover:shadow-lg cursor-pointer active:scale-[0.98]"
        >
          <Search className="w-4 h-4 text-emerald-300" />
          <span>Search Destinations</span>
        </button>

        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#ECEBE6]">
          <div>
            <MapPin className="w-4 h-4 text-stone-800 mb-1.5" />
            <div className="font-extrabold text-xs text-[#171918]">100+</div>
            <div className="text-[10px] text-stone-400 font-medium">Venues</div>
          </div>
          <div>
            <BarChart3 className="w-4 h-4 text-stone-800 mb-1.5" />
            <div className="font-extrabold text-xs text-[#171918]">Real-time</div>
            <div className="text-[10px] text-stone-400 font-medium">Updates</div>
          </div>
          <div>
            <Layers className="w-4 h-4 text-stone-800 mb-1.5" />
            <div className="font-extrabold text-xs text-[#171918]">Powered by</div>
            <div className="text-[10px] text-stone-400 font-medium">Real-world data</div>
          </div>
        </div>
      </div>

      {/* Sweeping Arch Bottom Image Section */}
      <div className="relative w-full h-80 mt-2 overflow-hidden bg-stone-100">
        <div 
          className="absolute -top-1 left-[-20%] right-[-20%] h-14 bg-[#FAF9F5] z-10" 
          style={{ borderRadius: '0 0 50% 50% / 0 0 100% 100%' }}
        />
        <img
          src="https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?auto=format&fit=crop&w=800&q=80"
          alt="Modern Architecture"
          className="w-full h-full object-cover brightness-95"
        />
        <div 
          className="absolute bottom-0 right-0 bg-[#FAF9F5] pt-3 pl-5 pb-3 pr-4 shadow-sm z-10"
          style={{ borderTopLeftRadius: '2rem' }}
        >
          <div className="text-stone-600 font-serif italic text-xs leading-snug text-right">
            People move. <br />
            Cities live. <br />
            <span className="text-[#1E3A2F] font-medium">We make it clearer.</span>
          </div>
        </div>
      </div>
    </aside>
  );
}