import React, { useState, useEffect, useRef } from 'react';
import { ArrowUpRight, TrendingDown, TrendingUp } from 'lucide-react';

export default function VenueCard({ venue, isSelected, onSelect }) {
  // =======================================================
  // ANIMATED OCCUPANCY DIFF LOGIC (+1 / -1)
  // =======================================================
  const [diff, setDiff] = useState(null);
  const prevOccRef = useRef(venue.currentOccupancy);

  useEffect(() => {
    const current = venue.currentOccupancy;
    const previous = prevOccRef.current;

    if (current !== previous) {
      const difference = current - previous;
      setDiff(difference);

      // Clear the bubble after 1.5s
      const timer = setTimeout(() => {
        setDiff(null);
      }, 1500);

      prevOccRef.current = current;

      return () => clearTimeout(timer);
    }
  }, [venue.currentOccupancy]);

  const occ = venue.currentOccupancy || 0;
  const cap = venue.capacity || 1;
  const pct = Math.min(100, Math.round((occ / cap) * 100));

  let badge = {
    label: 'QUIET',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    bar: 'bg-emerald-500'
  };

  if (pct >= 75) {
    badge = {
      label: 'BUSY',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      bar: 'bg-rose-500'
    };
  } else if (pct >= 45) {
    badge = {
      label: 'MODERATE',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      bar: 'bg-amber-500'
    };
  }

  // =======================================================
  // VENUE PHOTOS
  // =======================================================
  const VENUE_PHOTOS = {
    gym_cult:
      'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=800&q=80',

    lib_central:
      'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80',

    mall_pacific:
      'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?auto=format&fit=crop&w=800&q=80',

    expo_pragati:
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80'
  };

  const photoUrl =
    VENUE_PHOTOS[venue.venueId] || VENUE_PHOTOS.mall_pacific;

  const isEmptying = venue.velocityPerMin < 0;

  return (
    <div
      onClick={() => onSelect(venue.venueId)}
      className={`bg-white rounded-[24px] border transition-all duration-500 cursor-pointer overflow-hidden group
        ${
          isSelected
            ? 'border-[#1E3A2F] shadow-md'
            : 'border-[#EAE9E4] hover:shadow-md'
        }
        ${
          diff !== null
            ? 'shadow-[0_8px_30px_rgba(0,0,0,0.12)] border-stone-300 scale-[1.01]'
            : ''
        }
      `}
    >
      {/* =======================================================
          TOP IMAGE AREA
          ======================================================= */}
      <div className="relative h-48 w-full bg-stone-100 overflow-hidden">
        <img
          src={photoUrl}
          alt={venue.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />

        <button className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform">
          <ArrowUpRight className="w-4 h-4 text-[#171918]" />
        </button>
      </div>

      <div className="p-5">

        {/* =======================================================
            TITLE & LOCATION
            ======================================================= */}
        <div className="mb-4">
          <h3 className="font-bold text-lg text-[#171918]">
            {venue.name}
          </h3>

          <p className="text-xs text-stone-500 capitalize">
            {venue.type?.toLowerCase()} • {venue.location || 'Delhi NCR'}
          </p>
        </div>

        {/* =======================================================
            OCCUPANCY & BADGE
            ORIGINAL LAYOUT
            ======================================================= */}
        <div className="flex items-center justify-between mb-1">

          {/* Relative wrapper for floating diff */}
          <div className="flex items-baseline relative">

            <span className="text-2xl font-black text-[#171918]">
              {occ.toLocaleString()}
            </span>

            <span className="text-sm font-medium text-stone-400 ml-1">
              / {cap.toLocaleString()}
            </span>

            {/* ===================================================
                SMALLER LIVE DIFF
                =================================================== */}
            <div
              className={`absolute left-full ml-1 bottom-[5px]
                transition-all duration-500 ease-out
                font-black text-[10px]
                pointer-events-none
                drop-shadow-sm
                whitespace-nowrap
                ${
                  diff !== null
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-1'
                }
                ${diff > 0 ? 'text-emerald-500' : 'text-rose-500'}
              `}
            >
              {diff > 0 ? `+${diff}` : diff}
            </div>
          </div>

          {/* Status badge stays exactly where it was */}
          <span
            className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase ${badge.bg} ${badge.text}`}
          >
            {badge.label}
          </span>
        </div>

        {/* =======================================================
            OCCUPANCY PERCENTAGE
            ======================================================= */}
        <div className="text-sm font-medium text-[#171918] mb-3">
          {pct}% occupied
        </div>

        {/* =======================================================
            PROGRESS BAR
            ======================================================= */}
        <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden mb-5">
          <div
            className={`h-full transition-all duration-500 ${badge.bar}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* =======================================================
            VELOCITY / TREND
            ======================================================= */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-4">

          <div
            className={`flex items-center space-x-1.5 text-xs font-semibold ${
              isEmptying
                ? 'text-emerald-600'
                : 'text-rose-600'
            }`}
          >
            {isEmptying ? (
              <TrendingDown className="w-3.5 h-3.5" />
            ) : (
              <TrendingUp className="w-3.5 h-3.5" />
            )}

            <span>
              {isEmptying ? 'Emptying out' : 'Filling up'}
            </span>
          </div>

          <span className="text-xs font-mono text-stone-500">
            {venue.velocityPerMin > 0
              ? `+${venue.velocityPerMin}`
              : venue.velocityPerMin}{' '}
            visitors/min
          </span>
        </div>

        {/* =======================================================
            FORECASTS
            ======================================================= */}
        <div className="grid grid-cols-2 gap-4 text-center">

          <div>
            <div className="text-[10px] text-stone-400 font-semibold mb-1 uppercase tracking-wider">
              30 Min
            </div>

            <div className="text-sm font-bold text-[#171918]">
              {Math.round(
                ((venue.predictedOccupancyIn30Min || occ) / cap) * 100
              )}
              %
            </div>
          </div>

          <div>
            <div className="text-[10px] text-stone-400 font-semibold mb-1 uppercase tracking-wider">
              60 Min
            </div>

            <div className="text-sm font-bold text-[#171918]">
              {Math.round(
                ((venue.predictedOccupancyIn60Min || occ) / cap) * 100
              )}
              %
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}