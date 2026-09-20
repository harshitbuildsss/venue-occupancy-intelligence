import React from 'react';

export default function BrandLogo({ size = 'default' }) {
  const isSmall = size === 'sm';

  return (
    <div className="flex items-center gap-3 select-none">
      {/* Scaled-up Logo to anchor the full text height */}
      <img
        src="/logo.png"
        alt="Bharat Occupancy"
        className={`object-contain rounded-2xl shadow-sm shrink-0 ${
          isSmall ? 'w-9 h-9 rounded-xl' : 'w-[52px] h-[52px]'
        }`}
      />

      {/* Lockup Typography */}
      <div className="flex flex-col justify-center">
        <div 
          className="flex items-baseline tracking-tight text-[#143224] leading-[1.05]"
          style={{ fontFamily: "'Newsreader', serif" }}
        >
          <span className="text-[28px] font-bold italic mr-1.5">Bharat</span>
          <span className="text-[28px] font-normal">Occupancy</span>
        </div>
        <div className="text-[10px] font-sans uppercase font-semibold tracking-[0.22em] text-stone-500 mt-1 leading-none">
          Real-time venue intelligence
        </div>
      </div>
    </div>
  );
}