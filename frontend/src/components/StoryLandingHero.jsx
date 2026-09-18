import React, { useState } from 'react';
import { ArrowDown, Radio, Sparkles } from 'lucide-react';

export default function StoryLandingHero({ onEnterApp }) {
  const [hasEntered, setHasEntered] = useState(false);

  const handleEnter = () => {
    setHasEntered(true);
    if (onEnterApp) onEnterApp();
    const el = document.getElementById('dashboard-pulse-view');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative w-full min-h-screen flex flex-col justify-between items-center px-6 py-12 overflow-hidden bg-[#070908] text-white">
      {/* Background Architectural Canvas with subtle pulse */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-25 scale-105 transition-transform duration-1000 pointer-events-none"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=1600&q=80')`
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#070908]/90 via-[#070908]/75 to-[#070908] pointer-events-none" />

      {/* Top Floating Badge */}
      <div className="relative z-10 pt-4 flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
        <span className="h-2 w-2 rounded-full bg-[#FF7A1A] animate-ping" />
        <span className="text-[11px] font-mono tracking-widest text-stone-300 uppercase">
          Live City Telemetry • Delhi NCR
        </span>
      </div>

      {/* Central Hook Question & Pitch */}
      <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6 my-auto">
        <div className="inline-flex items-center gap-1.5 text-xs font-mono tracking-widest text-[#FF9A3D] uppercase border border-[#FF7A1A]/30 bg-[#FF7A1A]/10 px-3 py-1 rounded-full">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Predictive Saturation</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-serif font-light text-white tracking-tight leading-[1.15]">
          What if you knew <br />
          <span className="italic font-normal text-[#FFF2E0]">before you even stepped out?</span>
        </h1>

        <p className="text-sm sm:text-base text-stone-400 font-sans max-w-xl mx-auto leading-relaxed">
          Avoid turnstile queues, packed gyms, and saturated event halls with continuous 
          60-minute predictive footfall intelligence.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleEnter}
            className="group px-7 py-3.5 rounded-xl bg-[#FF7A1A] hover:bg-[#FF8D3B] text-[#080A0B] font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-xl shadow-[#FF7A1A]/20 flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <span>Enter Live Platform</span>
            <ArrowDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* Brand Reveal Transition Lockup */}
      <div className="relative z-10 w-full max-w-4xl border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400 gap-4">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-[#FF7A1A]/20 border border-[#FF7A1A]/30 flex items-center justify-center text-[#FF9A3D]">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="font-bold text-white tracking-wide uppercase text-[11px]">Bharat Occupancy</div>
            <div className="text-[10px] text-stone-400 font-mono">Real-time occupancy • Predictive insights • Better decisions</div>
          </div>
        </div>

        <div className="flex items-center gap-6 font-mono text-[11px]">
          <span>AWS DynamoDB Pipe</span>
          <span className="text-emerald-400">● 4 Venues Streaming</span>
        </div>
      </div>
    </section>
  );
}