import React from 'react';
import { ArrowUpRight, ArrowDownRight, UserPlus, UserMinus } from 'lucide-react';

const STATUS_THEMES = {
  QUIET: {
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    bar: 'bg-emerald-500',
    glow: 'from-emerald-500/10',
    label: 'Quiet & Calm'
  },
  MODERATE: {
    badge: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    bar: 'bg-sky-500',
    glow: 'from-sky-500/10',
    label: 'Moderate Footfall'
  },
  BUSY: {
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    bar: 'bg-amber-500',
    glow: 'from-amber-500/10',
    label: 'Busy / Vibrant'
  },
  VERY_BUSY: {
    badge: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    bar: 'bg-orange-500',
    glow: 'from-orange-500/10',
    label: 'High Density'
  },
  NEAR_CAPACITY: {
    badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    bar: 'bg-rose-500',
    glow: 'from-rose-500/10',
    label: 'Near Capacity'
  },
  CAPACITY_ANOMALY: {
    badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    bar: 'bg-purple-500',
    glow: 'from-purple-500/10',
    label: 'Capacity Overflow'
  }
};

export default function VenueCard({ venue, previousOccupancy, onManualEvent, onSelect, isSelected }) {
  const theme = STATUS_THEMES[venue.crowdStatus] || STATUS_THEMES.QUIET;
  
  let trend = 'stable';
  if (previousOccupancy !== undefined) {
    if (venue.currentOccupancy > previousOccupancy) trend = 'up';
    else if (venue.currentOccupancy < previousOccupancy) trend = 'down';
  }

  const percentage = Math.min(100, Math.max(0, venue.capacityPercentage));

  return (
    <div 
      onClick={() => onSelect(venue.venueId)}
      className={`relative cursor-pointer rounded-2xl border p-5 transition-all duration-200 backdrop-blur-sm ${
        isSelected 
          ? 'border-blue-500 bg-slate-900/90 shadow-xl shadow-blue-500/10 ring-1 ring-blue-500/50' 
          : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60'
      }`}
    >
      <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${theme.glow} to-transparent rounded-t-2xl pointer-events-none opacity-40`} />

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                {venue.type}
              </span>
              {trend === 'up' && (
                <span className="flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1 rounded">
                  <ArrowUpRight className="h-3 w-3 mr-0.5" /> INFLOW
                </span>
              )}
              {trend === 'down' && (
                <span className="flex items-center text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1 rounded">
                  <ArrowDownRight className="h-3 w-3 mr-0.5" /> OUTFLOW
                </span>
              )}
            </div>
            <h3 className="mt-1 text-lg font-bold text-white tracking-tight">{venue.name}</h3>
          </div>

          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${theme.badge}`}>
            {theme.label}
          </span>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <div>
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {venue.currentOccupancy.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-medium ml-1.5">
              / {venue.capacity.toLocaleString()} max
            </span>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-slate-200">
              {venue.capacityPercentage}%
            </span>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Occupied</p>
          </div>
        </div>

        <div className="mt-3 w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-700/50">
          <div 
            className={`h-full rounded-full transition-all duration-500 ease-out ${theme.bar}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
          <span className="text-xs text-slate-400 font-medium">Gate Test (+1/-1):</span>
          <div className="flex space-x-2">
            <button
              onClick={() => onManualEvent(venue.venueId, 'ENTRY')}
              className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-colors"
              title="Simulate 1 person entering"
            >
              <UserPlus className="h-3.5 w-3.5 mr-1" /> Entry
            </button>
            <button
              onClick={() => onManualEvent(venue.venueId, 'EXIT')}
              disabled={venue.currentOccupancy <= 0}
              className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                venue.currentOccupancy <= 0
                  ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500 border-slate-700'
                  : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
              }`}
              title={venue.currentOccupancy <= 0 ? "Cannot exit at zero occupancy" : "Simulate 1 person exiting"}
            >
              <UserMinus className="h-3.5 w-3.5 mr-1" /> Exit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
