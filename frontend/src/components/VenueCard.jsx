import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Minus, Clock, ArrowRight } from 'lucide-react';

const VENUE_BACKGROUNDS = {
  gym_cult: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=900&q=80',
  // Classic university reading hall with bookshelves & study desks
  lib_central: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=900&q=80',
  // High-res modern shopping mall atrium with escalators and concourses
  mall_pacific: 'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?auto=format&fit=crop&w=900&q=80',
  // Convention auditorium hall
  expo_pragati: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=900&q=80'
};

export default function VenueCard({ venue, onSelect }) {
  const occ = venue.currentOccupancy || 0;
  const cap = venue.capacity || 1;
  const percentage = Math.min(100, Math.round((occ / cap) * 100));

  // 1-Second Soft White Shimmer Pulse on Headcount Update
  const [isUpdating, setIsUpdating] = useState(false);
  const prevOccRef = useRef(occ);

  useEffect(() => {
    if (prevOccRef.current !== occ) {
      setIsUpdating(true);
      const timer = setTimeout(() => {
        setIsUpdating(false);
      }, 900);

      prevOccRef.current = occ;
      return () => clearTimeout(timer);
    }
  }, [occ]);

  // Rush-reactive status badge & capacity bar
  let statusBadge = { label: 'QUIET', bg: 'bg-emerald-950/80', text: 'text-emerald-300', border: 'border-emerald-500/50' };
  let barColor = 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]';

  if (percentage >= 85) {
    statusBadge = { label: 'NEAR CAPACITY', bg: 'bg-rose-950/85', text: 'text-rose-300', border: 'border-rose-500/60' };
    barColor = 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.7)]';
  } else if (percentage >= 70) {
    statusBadge = { label: 'VERY BUSY', bg: 'bg-orange-950/85', text: 'text-orange-300', border: 'border-orange-500/60' };
    barColor = 'bg-orange-500 shadow-[0_0_10px_rgba(234,88,12,0.6)]';
  } else if (percentage >= 40) {
    statusBadge = { label: 'MODERATE', bg: 'bg-amber-950/85', text: 'text-amber-300', border: 'border-amber-500/60' };
    barColor = 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]';
  }

  // Velocity trend
  const velocity = venue.velocityPerMin ?? 0;
  let trendIcon = <Minus className="w-3.5 h-3.5 text-stone-300" />;
  let trendText = 'Stable';
  let trendColor = 'text-stone-300';

  if (velocity > 0.3) {
    trendIcon = <TrendingUp className="w-3.5 h-3.5 text-amber-300" />;
    trendText = 'Getting busier';
    trendColor = 'text-amber-300';
  } else if (velocity < -0.3) {
    trendIcon = <TrendingDown className="w-3.5 h-3.5 text-emerald-300" />;
    trendText = 'Clearing up';
    trendColor = 'text-emerald-300';
  }

  const bgImage = VENUE_BACKGROUNDS[venue.venueId] || VENUE_BACKGROUNDS.mall_pacific;

  return (
    <div
      onClick={() => onSelect(venue.venueId)}
      className={`group relative rounded-2xl border p-5 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden bg-[#0A0D0C] border-white/10 hover:border-white/30 hover:shadow-2xl hover:shadow-black active:scale-[0.99] outline-none select-none ${
        isUpdating ? 'border-white/50 shadow-[0_0_24px_rgba(255,255,255,0.12)]' : ''
      }`}
    >
      {/* 1. Visible, Vibrant Architectural Background Photo */}
      <img
        src={bgImage}
        alt={venue.name}
        className="absolute inset-0 w-full h-full object-cover opacity-65 contrast-110 saturate-110 transition-transform duration-700 group-hover:scale-105 pointer-events-none"
      />

      {/* 2. Frosted Scrim Overlay (Clean legibility without muddying the picture) */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#080A0B]/95 via-[#080A0B]/60 to-[#080A0B]/40 pointer-events-none" />

      {/* 3. Foreground Content */}
      <div className="relative z-10">
        {/* Card Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-300 font-semibold drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
              {venue.type || 'FACILITY'}
            </span>
            <h3 className="text-base font-bold text-white tracking-tight mt-0.5 group-hover:text-amber-200 transition-colors drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              {venue.name}
            </h3>
          </div>
          <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full font-bold border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border} backdrop-blur-md shadow-md`}>
            {statusBadge.label}
          </span>
        </div>

        {/* Occupancy Row */}
        <div className="mt-5 flex items-baseline justify-between">
          <div className="flex items-baseline">
            <span className="text-4xl font-extrabold tracking-tight font-sans text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
              {percentage}%
            </span>
            <span className="text-xs text-stone-200 ml-2.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">occupied</span>
          </div>

          {/* Shimmer on Headcount Change */}
          <span
            className={`text-xs font-mono px-2.5 py-1 rounded-md transition-all duration-300 backdrop-blur-md shadow-md ${
              isUpdating
                ? 'bg-white/35 text-white border border-white/60 shadow-white/20 font-bold scale-105'
                : 'bg-black/60 text-stone-200 border border-white/15'
            }`}
          >
            {occ.toLocaleString()} / {cap.toLocaleString()}
          </span>
        </div>

        {/* Dynamic Capacity Bar */}
        <div className="mt-2.5 w-full h-1.5 bg-black/60 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Forecast & Trend Footnote */}
      <div className="relative z-10 mt-5 pt-3.5 border-t border-white/10 flex items-center justify-between text-xs backdrop-blur-[2px]">
        <div className={`flex items-center space-x-1.5 ${trendColor} drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]`}>
          {trendIcon}
          <span className="font-medium text-[11px]">{trendText}</span>
        </div>

        <div className="flex items-center space-x-1 text-stone-200 group-hover:text-white transition-colors drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          <Clock className="w-3.5 h-3.5 text-stone-300" />
          <span className="text-[11px] font-mono">60m: {venue.predictedOccupancyIn60Min || occ}</span>
          <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
}