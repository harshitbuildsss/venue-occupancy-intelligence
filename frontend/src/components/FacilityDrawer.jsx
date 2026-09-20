import React from 'react';
import { X, Clock, TrendingUp, Users, AlertCircle, ArrowUpRight } from 'lucide-react';

// Added venuePhoto to the props
export default function FacilityDrawer({ venue, venuePhoto, onClose }) {
  if (!venue) return null;

  const occ = venue.currentOccupancy || 0;
  const cap = venue.capacity || 1;
  const pct = Math.min(100, Math.round((occ / cap) * 100));

  let badge = { label: 'QUIET', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
  if (pct >= 75) {
    badge = { label: 'BUSY', bg: 'bg-rose-50 text-rose-800 border-rose-200' };
  } else if (pct >= 45) {
    badge = { label: 'MODERATE', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/30 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF9F5] border-l border-[#EAE9E4] shadow-2xl flex flex-col justify-between">
          
          {/* Header with Photo Background */}
          <div className="relative p-6 border-b border-[#EAE9E4] flex items-center justify-between overflow-hidden">
            {/* Background Image & Overlay */}
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${venuePhoto})` }}
            />
            <div className="absolute inset-0 bg-black/60 backdrop-brightness-90" />
            
            <div className="relative z-10">
              <span className="text-[10px] font-mono tracking-widest text-emerald-300 uppercase font-bold drop-shadow-sm">
                {venue.type} TELEMETRY DECK
              </span>
              <h2 className="text-xl font-bold font-serif text-white mt-0.5 drop-shadow-md">{venue.name}</h2>
            </div>
            
            <button
              onClick={onClose}
              className="relative z-10 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-colors shadow-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Current Density Card */}
            <div className="bg-white border border-[#EAE9E4] rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-center text-xs font-semibold text-stone-500">
                <span>CURRENT DENSITY</span>
                <span className="font-mono text-stone-700">{occ.toLocaleString()} / {cap.toLocaleString()} visitors</span>
              </div>
              <div className="flex items-baseline space-x-3">
                <span className="text-4xl font-black text-[#171918] font-sans">{pct}%</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                  {badge.label}
                </span>
              </div>
              <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    pct >= 75 ? 'bg-rose-500' : pct >= 45 ? 'bg-amber-500' : 'bg-emerald-600'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                Status is marked as <strong className="text-stone-800">{venue.crowdStatus || badge.label}</strong> with continuous predictive velocity damping.
              </p>
            </div>

            {/* Forecast Dual Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-[#EAE9E4] rounded-2xl p-4 shadow-sm">
                <div className="flex items-center space-x-1.5 text-stone-400 text-xs font-medium">
                  <Clock className="w-3.5 h-3.5 text-[#1E3A2F]" />
                  <span>In 30 Min</span>
                </div>
                <div className="text-2xl font-bold text-[#171918] mt-1 font-sans">
                  {venue.predictedOccupancyIn30Min ?? occ}
                </div>
                <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                  {Math.round(((venue.predictedOccupancyIn30Min ?? occ) / cap) * 100)}% capacity
                </div>
              </div>

              <div className="bg-white border border-[#EAE9E4] rounded-2xl p-4 shadow-sm">
                <div className="flex items-center space-x-1.5 text-stone-400 text-xs font-medium">
                  <Clock className="w-3.5 h-3.5 text-[#1E3A2F]" />
                  <span>In 60 Min</span>
                </div>
                <div className="text-2xl font-bold text-[#171918] mt-1 font-sans">
                  {venue.predictedOccupancyIn60Min ?? occ}
                </div>
                <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                  {Math.round(((venue.predictedOccupancyIn60Min ?? occ) / cap) * 100)}% capacity
                </div>
              </div>
            </div>

            {/* Typical Rush Curve */}
            <div className="bg-white border border-[#EAE9E4] rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-center text-xs font-bold text-stone-700">
                <span>TYPICAL DAILY CURVE</span>
                <span className="text-emerald-700 font-semibold text-[11px]">Live Sensor Stream</span>
              </div>
              <div className="flex items-end justify-between h-20 gap-1 pt-2 px-2">
                {[20, 35, 60, 85, 70, 45, 25].map((val, idx) => (
                  <div
                    key={idx}
                    className={`flex-1 rounded-t-sm transition-all duration-300 ${
                      idx === 3 ? 'bg-[#1E3A2F]' : 'bg-stone-200'
                    }`}
                    style={{ height: `${val}%` }}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                <span>10 AM</span>
                <span>12 PM</span>
                <span>2 PM</span>
                <span>4 PM</span>
                <span>6 PM</span>
                <span>8 PM</span>
              </div>
              <p className="text-[11px] text-stone-500 leading-snug pt-1">
                Facility experiences lowest crowd density before 11:00 AM and after 8:30 PM.
              </p>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="p-6 border-t border-[#EAE9E4] bg-white">
            <button
              onClick={onClose}
              className="w-full py-3 rounded-full bg-[#1E3A2F] hover:bg-[#132E27] text-white font-semibold text-xs tracking-wider transition-colors shadow-sm"
            >
              Close Details
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}