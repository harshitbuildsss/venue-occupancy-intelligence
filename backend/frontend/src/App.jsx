import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, Activity, Zap, Play, Square, Flame, Building2, 
  Dumbbell, BookOpen, Clock, ShieldCheck, CheckCircle2 
} from 'lucide-react';

const STATUS_THEMES = {
  QUIET: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
    bar: 'bg-emerald-500',
    glow: 'shadow-emerald-500/20',
    tag: 'Quiet • Minimal Crowds'
  },
  MODERATE: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    dot: 'bg-blue-400',
    bar: 'bg-blue-500',
    glow: 'shadow-blue-500/20',
    tag: 'Moderate • Healthy Flow'
  },
  BUSY: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    dot: 'bg-amber-400',
    bar: 'bg-amber-500',
    glow: 'shadow-amber-500/20',
    tag: 'Busy • Lively Atmosphere'
  },
  VERY_BUSY: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    dot: 'bg-orange-400',
    bar: 'bg-orange-500',
    glow: 'shadow-orange-500/20',
    tag: 'Very Busy • Approaching Capacity'
  },
  NEAR_CAPACITY: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
    dot: 'bg-rose-400',
    bar: 'bg-rose-500',
    glow: 'shadow-rose-500/20',
    tag: 'Near Capacity • Expect Delays'
  },
  CAPACITY_ANOMALY: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    dot: 'bg-purple-400',
    bar: 'bg-purple-500',
    glow: 'shadow-purple-500/20',
    tag: 'Capacity Anomaly • Over Limit'
  }
};

const VENUE_ICONS = {
  MALL: Building2,
  GYM: Dumbbell,
  LIBRARY: BookOpen,
};

export default function App() {
  const [venues, setVenues] = useState([]);
  const [selectedId, setSelectedId] = useState('pacific_mall');
  const [currentVenue, setCurrentVenue] = useState(null);
  const [isSimRunning, setIsSimRunning] = useState(false);
  const [pulseCount, setPulseCount] = useState(false);
  const [lastVelocity, setLastVelocity] = useState(0);
  const prevOccupancyRef = useRef(null);

  const fetchVenues = async () => {
    try {
      const res = await fetch('/api/v1/venues');
      if (res.ok) {
        const data = await res.json();
        setVenues(data);
        if (!selectedId && data.length > 0) {
          setSelectedId(data[0].venueId);
        }
      }
    } catch (e) {
      console.error("API unreachable", e);
    }
  };

  const fetchActiveVenue = async () => {
    if (!selectedId) return;
    try {
      const res = await fetch(`/api/v1/venues/${selectedId}`);
      if (res.ok) {
        const data = await res.json();
        if (prevOccupancyRef.current !== null && prevOccupancyRef.current !== data.currentOccupancy) {
          setLastVelocity(data.currentOccupancy - prevOccupancyRef.current);
          setPulseCount(true);
          setTimeout(() => setPulseCount(false), 400);
        }
        prevOccupancyRef.current = data.currentOccupancy;
        setCurrentVenue(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const checkSimStatus = async () => {
    if (!selectedId) return;
    try {
      const res = await fetch(`/api/v1/simulator/status/${selectedId}`);
      if (res.ok) {
        const data = await res.json();
        setIsSimRunning(data.running);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  useEffect(() => {
    prevOccupancyRef.current = null;
    fetchActiveVenue();
    checkSimStatus();
    const interval = setInterval(fetchActiveVenue, 600);
    return () => clearInterval(interval);
  }, [selectedId]);

  const toggleSimulator = async () => {
    const endpoint = isSimRunning ? `/api/v1/simulator/stop/${selectedId}` : `/api/v1/simulator/start/${selectedId}?intervalMs=300`;
    await fetch(endpoint, { method: 'POST' });
    setIsSimRunning(!isSimRunning);
  };

  const triggerBurst = async () => {
    await fetch(`/api/v1/simulator/burst/${selectedId}`, { method: 'POST' });
    fetchActiveVenue();
  };

  const theme = currentVenue ? (STATUS_THEMES[currentVenue.crowdStatus] || STATUS_THEMES.MODERATE) : STATUS_THEMES.MODERATE;
  const VenueIcon = currentVenue ? (VENUE_ICONS[currentVenue.type] || Building2) : Building2;

  return (
    <div className="min-h-screen bg-[#070A12] text-slate-100 flex flex-col antialiased">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-[#0B0F1C]/90 backdrop-blur sticky top-0 z-30 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                Bharat Builds <span className="text-cyan-400 text-xs px-2 py-0.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 font-mono">LIVE INTELLIGENCE</span>
              </h1>
              <p className="text-xs text-slate-400">Deterministic Privacy-Preserving Venue Counter</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
            {venues.map((v) => (
              <button
                key={v.venueId}
                onClick={() => setSelectedId(v.venueId)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedId === v.venueId 
                    ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 shadow' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {v.name.split(' (')[0]}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Experience: Answer "How crowded is this place right now?" */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 flex flex-col justify-center gap-6">
        
        {currentVenue ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Main Stage Card */}
            <div className="lg:col-span-8 bg-[#0F1629] border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between">
              
              {/* Background ambient lighting */}
              <div className={`absolute -right-20 -top-20 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none ${theme.bar}`} />
              
              <div>
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 tracking-wider uppercase">
                    <VenueIcon className="h-4 w-4 text-cyan-400" />
                    <span>{currentVenue.type}</span>
                    <span>•</span>
                    <span className="font-mono text-slate-500">{currentVenue.venueId}</span>
                  </div>

                  {/* Status Pill */}
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${theme.bg} ${theme.border} ${theme.text}`}>
                    <span className={`h-2 w-2 rounded-full ${theme.dot} animate-pulse`} />
                    {theme.tag}
                  </div>
                </div>

                <h2 className="text-3xl font-extrabold text-white tracking-tight">
                  {currentVenue.name}
                </h2>

                <p className="text-sm text-slate-400 mt-1">
                  How crowded is it <span className="text-white font-semibold underline decoration-cyan-400 decoration-2 underline-offset-4">right now</span> before you go?
                </p>
              </div>

              {/* Big Focus Numbers */}
              <div className="my-10 flex flex-col sm:flex-row sm:items-baseline gap-4 sm:gap-6">
                <div className="flex items-baseline gap-2">
                  <span className={`text-7xl sm:text-8xl font-black font-mono tracking-tighter transition-transform duration-200 ${
                    pulseCount ? 'scale-105 text-cyan-300' : 'text-white'
                  }`}>
                    {currentVenue.currentOccupancy.toLocaleString()}
                  </span>
                  <span className="text-2xl font-bold text-slate-500 font-mono">
                    / {currentVenue.capacity.toLocaleString()}
                  </span>
                </div>

                {lastVelocity !== 0 && (
                  <div className={`text-xs font-mono font-bold px-2 py-1 rounded-md self-start sm:self-center ${
                    lastVelocity > 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {lastVelocity > 0 ? `+${lastVelocity} arriving` : `${lastVelocity} leaving`}
                  </div>
                )}
              </div>

              {/* Progress Bar & Capacity Analytics */}
              <div>
                <div className="flex justify-between items-center text-xs font-bold mb-2">
                  <span className="text-slate-400 uppercase tracking-wider">Current Capacity</span>
                  <span className={`font-mono text-base ${theme.text}`}>{currentVenue.capacityPercentage}% Full</span>
                </div>

                <div className="w-full bg-slate-900 h-4 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${theme.bar}`}
                    style={{ width: `${Math.min(100, currentVenue.capacityPercentage)}%` }}
                  />
                </div>

                <div className="flex justify-between text-[11px] font-mono text-slate-500 mt-2">
                  <span>0 Empty</span>
                  <span>50% Balanced</span>
                  <span>100% Limit</span>
                </div>
              </div>

            </div>

            {/* Side Control & Intelligence Panel */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              
              {/* Simulator Controls Card */}
              <div className="bg-[#0F1629] border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between flex-1">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                      <Zap className="h-4 w-4 text-cyan-400" /> Live Simulation Feed
                    </span>
                    <span className={`h-2 w-2 rounded-full ${isSimRunning ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Replaces physical optical turnstiles with autonomous gate events (+1 ENTRY / -1 EXIT) streaming into the occupancy engine.
                  </p>
                </div>

                <div className="flex flex-col gap-3 my-6">
                  <button
                    onClick={toggleSimulator}
                    className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${
                      isSimRunning 
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                        : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold shadow-cyan-500/25'
                    }`}
                  >
                    {isSimRunning ? (
                      <>
                        <Square className="h-4 w-4 fill-current" /> Pause Live Feed
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 fill-current" /> Start Multi-Gate Stream
                      </>
                    )}
                  </button>

                  <button
                    onClick={triggerBurst}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-slate-700/80 text-white border border-slate-700/80 flex items-center justify-center gap-2 transition"
                  >
                    <Flame className="h-4 w-4 text-amber-400" /> Inject Rush Burst (+/- Rapid)
                  </button>
                </div>

                <div className="bg-slate-900/70 border border-slate-800/80 rounded-xl p-3 text-[11px] text-slate-400 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>100% Privacy Preserved. Zero facial recognition or biometrics required.</span>
                </div>
              </div>

              {/* Status Verification Checklist */}
              <div className="bg-[#0F1629]/60 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-400 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-slate-300 font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" /> Invariant Guardrails Active
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono">
                  <span>• Idempotency ON</span>
                  <span>• Non-Negative Floor</span>
                  <span>• Anomaly Detection</span>
                  <span>• 350ms Polling</span>
                </div>
              </div>

            </div>

          </div>
        ) : (
          <div className="h-96 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Activity className="h-8 w-8 animate-spin text-cyan-400" />
            <p className="text-sm">Connecting to Occupancy Engine...</p>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-4 px-6 text-center text-xs text-slate-400">
        AWS Bharat Builds Tour • First Commit Hackathon • Real-Time Occupancy Intelligence
      </footer>
    </div>
  );
}
