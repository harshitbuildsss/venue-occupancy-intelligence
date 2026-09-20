import React from 'react';
import { Activity, Clock, Users, Heart } from 'lucide-react';

export default function ValueStrip() {
  const values = [
    { icon: <Activity className="w-3.5 h-3.5 text-emerald-800" />, title: 'Real-time Data', desc: 'Live occupancy updates from multiple venues' },
    { icon: <Clock className="w-3.5 h-3.5 text-emerald-800" />, title: 'Smart Forecasts', desc: '30 & 60 minute predictions' },
    { icon: <Users className="w-3.5 h-3.5 text-emerald-800" />, title: 'Better Decisions', desc: 'Plan your visit, avoid the rush' },
    { icon: <Heart className="w-3.5 h-3.5 text-emerald-800" />, title: 'Happier Experiences', desc: 'Spend your time where it matters' }
  ];

  return (
    <footer className="w-full border-t border-[#E3E2DA] bg-[#ECEBE4] pt-12 pb-8 px-6 sm:px-12 mt-12 relative overflow-hidden flex flex-col justify-end">
      
      {/* Indian Heritage Skyline Watermark */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.35] hidden md:block">
        <img 
          src="/skyline.jpg" 
          alt="Bharat Skyline" 
          className="w-full h-full object-fill mix-blend-multiply" 
        />
      </div>

      <div className="max-w-7xl mx-auto w-full space-y-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {values.map((v, i) => (
            <div key={i} className="flex items-start space-x-2.5 bg-[#FAF9F5]/90 backdrop-blur-md p-3 rounded-xl border border-[#DFDED5] shadow-sm transition-all hover:bg-white hover:-translate-y-1 hover:shadow-md duration-300">
              {/* Scaled down icon container */}
              <div className="w-7 h-7 rounded-full bg-[#EAF5EF] flex items-center justify-center shrink-0 shadow-sm">
                {v.icon}
              </div>
              <div>
                {/* Scaled down text sizing */}
                <h4 className="text-xs font-bold text-[#171918]">{v.title}</h4>
                <p className="text-[11px] text-stone-500 leading-snug mt-0.5">{v.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Elevated Credits Section */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-stone-600">
          <p className="font-medium bg-[#ECEBE4]/50 backdrop-blur-sm px-3 py-1.5 rounded-lg inline-block">
            © 2026 Bharat Occupancy. Autonomous civic telemetry platform.
          </p>
          
          <div className="flex items-center space-x-2 mt-4 sm:mt-0 bg-white/95 backdrop-blur-md px-5 py-2.5 rounded-full border border-[#DFDED5] shadow-sm hover:shadow-md transition-shadow">
            <span className="font-medium text-stone-500">Designed & Engineered by</span>
            <span className="font-extrabold text-[#1E3A2F] text-sm tracking-tight">Harshit Kumar Singh</span>
          </div>
        </div>
      </div>
    </footer>
  );
}