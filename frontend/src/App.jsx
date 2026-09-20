import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import VenueCard from './components/VenueCard';
import EditorialSidebar from './components/EditorialSidebar';
import ValueStrip from './components/ValueStrip';
import FacilityDrawer from './components/FacilityDrawer';
import OperatorModal from './components/OperatorModal';
import ScrollHeroVideo from './components/ScrollHeroVideo';
import { fetchVenue, createVenue, sendOccupancyEvent } from './services/api';
import { Search, ChevronDown, Navigation, TrendingUp, AlertCircle } from 'lucide-react';

const AWS_BASE_URL = 'https://d35p0u4mf9.execute-api.ap-south-1.amazonaws.com';

const INITIAL_VENUES = [
  { venueId: 'mall_pacific', name: 'Pacific Mall', type: 'MALL', capacity: 2500, initialOccupancy: 840, location: 'Delhi NCR' },
  { venueId: 'gym_cult', name: 'Cult.fit Gym', type: 'GYM', capacity: 150, initialOccupancy: 146, location: 'Delhi NCR' },
  { venueId: 'lib_central', name: 'Central University Library', type: 'LIBRARY', capacity: 400, initialOccupancy: 110, location: 'Delhi NCR' },
  { venueId: 'expo_pragati', name: 'Pragati Maidan (Bharat Mandapam)', type: 'EXPO', capacity: 7000, initialOccupancy: 3850, location: 'Delhi NCR' }
];

const VENUE_PHOTOS = {
  gym_cult: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=800&q=80',
  lib_central: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80',
  mall_pacific: 'https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?auto=format&fit=crop&w=800&q=80',
  expo_pragati: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80'
};

const GATES = [
  { id: 'gate_main', name: 'Gate A (Main)', weight: 0.40 },
  { id: 'gate_food_court', name: 'Gate B (Concourse/Hall)', weight: 0.30 },
  { id: 'gate_parking', name: 'Gate C (Parking / Metro)', weight: 0.20 },
  { id: 'gate_rear', name: 'Gate D (Side / Gate 10)', weight: 0.10 }
];

export default function App() {
  const [backendMode, setBackendMode] = useState('AWS');
  const [venues, setVenues] = useState([]);
  const [selectedVenueId, setSelectedVenueId] = useState('mall_pacific');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [isSimulating, setIsSimulating] = useState(false);
  const [eventLog, setEventLog] = useState([]);
  const [backendError, setBackendError] = useState(null);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isOperatorOpen, setIsOperatorOpen] = useState(false);

  const venuesRef = useRef([]);
  venuesRef.current = venues;

  const backendModeRef = useRef(backendMode);
  useEffect(() => {
    backendModeRef.current = backendMode;
  }, [backendMode]);

  const selectedVenueIdRef = useRef(selectedVenueId);
  useEffect(() => {
    selectedVenueIdRef.current = selectedVenueId;
  }, [selectedVenueId]);

  const searchInputRef = useRef(null);

  useEffect(() => {
    async function initVenues() {
      if (backendModeRef.current === 'LOCAL') {
        try {
          for (const initial of INITIAL_VENUES) {
            const existing = await fetchVenue(initial.venueId);
            if (!existing) await createVenue(initial);
          }
        } catch (err) {
          console.warn('Local init error:', err);
        }
      }
      await loadAllVenues(backendModeRef.current);
    }
    initVenues();
  }, [backendMode]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadAllVenues(backendModeRef.current);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const ambientTimer = setInterval(() => {
      const currentVenues = venuesRef.current;
      if (currentVenues.length === 0) return;

      const randomVenue = currentVenues[Math.floor(Math.random() * currentVenues.length)];
      const ratio = randomVenue.currentOccupancy / randomVenue.capacity;

      const entryBias = ratio < 0.35 ? 0.80 : ratio > 0.85 ? 0.25 : 0.52;
      const eventType = Math.random() < entryBias ? 'ENTRY' : 'EXIT';
      const randomGate = GATES[Math.floor(Math.random() * GATES.length)].id;

      handleManualEvent(randomVenue.venueId, eventType, randomGate, true);
    }, 1200);

    return () => clearInterval(ambientTimer);
  }, []);

  useEffect(() => {
    if (!isSimulating) return;

    const autoTrafficTimer = setInterval(async () => {
      const currentVenues = venuesRef.current;
      if (currentVenues.length === 0) return;

      const shuffled = [...currentVenues].sort(() => 0.5 - Math.random());
      const targets = shuffled.slice(0, 2);

      for (const target of targets) {
        const ratio = target.currentOccupancy / target.capacity;
        const entryBias = ratio < 0.3 ? 0.85 : ratio > 0.85 ? 0.20 : 0.55;
        let eventType = Math.random() < entryBias ? 'ENTRY' : 'EXIT';

        if (eventType === 'EXIT' && target.currentOccupancy <= 0) {
          eventType = 'ENTRY';
        }

        const chosenGate = GATES[Math.floor(Math.random() * GATES.length)].id;
        await handleManualEvent(target.venueId, eventType, chosenGate, false);
      }
    }, 600);

    return () => clearInterval(autoTrafficTimer);
  }, [isSimulating]);

  async function loadAllVenues(mode = backendModeRef.current) {
    try {
      let normalizedVenues = [];

      if (mode === 'AWS') {
        const res = await fetch(`${AWS_BASE_URL}/venues`);
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        const data = await res.json();

        let apiVenues = Array.isArray(data) ? [...data] : [];

        const hasPragati = apiVenues.some((v) => v.venueId === 'expo_pragati');
        if (!hasPragati) {
          const currentMemoryPragati = venuesRef.current.find((v) => v.venueId === 'expo_pragati');
          const pmInitial = INITIAL_VENUES.find((v) => v.venueId === 'expo_pragati');
          const currentOcc = currentMemoryPragati ? currentMemoryPragati.currentOccupancy : pmInitial.initialOccupancy;

          apiVenues.push({
            venueId: 'expo_pragati',
            name: 'Pragati Maidan (Bharat Mandapam)',
            type: 'EXPO',
            capacity: 7000,
            currentOccupancy: currentOcc
          });
        }

        normalizedVenues = apiVenues.map((v) => {
          const cap = Number(v.capacity || 1);
          const inMem = venuesRef.current.find((m) => m.venueId === v.venueId);
          const occ = v.venueId === 'expo_pragati' && inMem ? inMem.currentOccupancy : Number(v.currentOccupancy || 0);

          const p60 = v.predictedOccupancyIn60Min !== undefined
            ? Number(v.predictedOccupancyIn60Min)
            : Math.max(0, Math.min(cap, Math.round(occ * 0.88)));
          const p30 = Math.max(0, Math.min(cap, Math.round(occ * 0.94)));
          const velocity = Math.round(((p60 - occ) / 60) * 10) / 10;
          const capacityPercentage = Math.min(100, Math.round((occ / cap) * 100));

          return {
            venueId: v.venueId,
            name: v.name,
            type: v.type,
            capacity: cap,
            maxCapacity: cap,
            currentOccupancy: occ,
            capacityPercentage: capacityPercentage,
            crowdStatus: capacityPercentage >= 75 ? 'BUSY' : capacityPercentage >= 45 ? 'MODERATE' : 'QUIET',
            predictedOccupancyIn30Min: p30,
            predictedOccupancyIn60Min: p60,
            velocityPerMin: velocity,
            updatedAt: v.updatedAt
          };
        });
      } else {
        const fetched = await Promise.all(
          INITIAL_VENUES.map(async (v) => await fetchVenue(v.venueId))
        );

        normalizedVenues = fetched.filter(Boolean).map((item) => {
          const cap = Number(item.capacity || item.maxCapacity || 1);
          const inMem = venuesRef.current.find((m) => m.venueId === item.venueId);
          const occ = item.venueId === 'expo_pragati' && inMem ? inMem.currentOccupancy : Number(item.currentOccupancy || 0);

          const p60 = Math.max(0, Math.min(cap, Math.round(occ * 0.88)));
          const p30 = Math.max(0, Math.min(cap, Math.round(occ * 0.94)));
          const velocity = Math.round(((p60 - occ) / 60) * 10) / 10;
          const calculatedPercent = Math.min(100, Math.round((occ / cap) * 100));

          return {
            ...item,
            capacity: cap,
            maxCapacity: cap,
            currentOccupancy: occ,
            capacityPercentage: calculatedPercent,
            crowdStatus: calculatedPercent >= 75 ? 'BUSY' : calculatedPercent >= 45 ? 'MODERATE' : 'QUIET',
            predictedOccupancyIn30Min: p30,
            predictedOccupancyIn60Min: p60,
            velocityPerMin: velocity
          };
        });
      }

      setVenues(normalizedVenues);
      setBackendError(null);
    } catch (err) {
      if (mode === 'LOCAL') {
        setBackendError('Local server unreachable (http://localhost:8080).');
      } else {
        setBackendError('Cannot reach AWS API Gateway.');
      }
    }
  }

  async function handleManualEvent(venueId, eventType, gateId = 'gate_main', isSilent = false) {
    const currentMode = backendModeRef.current;
    const uniqueEventId = `evt_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    
    // =======================================================
    // FIX: Randomized dynamic delta based on venue capacity
    // =======================================================
    const targetVenue = venuesRef.current.find(v => v.venueId === venueId);
    const cap = targetVenue ? targetVenue.capacity : 1000;
    
    // Generate organic clusters of people entering/exiting based on how big the venue is
    const maxDelta = cap > 5000 ? 25 : (cap > 1000 ? 8 : 3);
    const minDelta = 1;
    const delta = Math.floor(Math.random() * (maxDelta - minDelta + 1)) + minDelta;

    setVenues((prev) =>
      prev.map((v) => {
        if (v.venueId !== venueId) return v;
        const adjustment = eventType === 'ENTRY' ? delta : -delta;
        const newOcc = Math.max(0, Math.min(v.capacity, v.currentOccupancy + adjustment));
        const newPct = Math.round((newOcc / v.capacity) * 100);
        return {
          ...v,
          currentOccupancy: newOcc,
          capacityPercentage: newPct
        };
      })
    );

    try {
      if (currentMode === 'LOCAL') {
        await sendOccupancyEvent({
          eventId: uniqueEventId,
          venueId,
          eventType,
          deviceId: gateId
        });
      } else {
        await fetch(`${AWS_BASE_URL}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId: uniqueEventId,
            venueId,
            eventType,
            deviceId: gateId,
            timestamp: new Date().toISOString()
          })
        });
      }

      if (!isSilent) {
        setEventLog((prev) => [
          {
            id: uniqueEventId,
            type: eventType,
            gate: GATES.find((g) => g.id === gateId)?.name || gateId,
            time: new Date().toLocaleTimeString()
          },
          ...prev.slice(0, 19)
        ]);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleInjectBurst(burstType) {
    const targetId = selectedVenueIdRef.current;
    for (let i = 0; i < 6; i++) {
      const randomGate = GATES[Math.floor(Math.random() * GATES.length)].id;
      await handleManualEvent(targetId, burstType, randomGate, false);
    }
  }

  const handleFocusSearch = () => {
    const el = document.getElementById('live-spaces-grid');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 500);
    } else {
      searchInputRef.current?.focus();
    }
  };

  const selectedVenue = venues.find((v) => v.venueId === selectedVenueId) || venues[0] || {};
  const highCapacityVenue = venues.find((v) => v.capacityPercentage >= 80);

  const filteredVenues = venues.filter((v) => {
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'ALL' || v.type === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const selPct = selectedVenue.capacityPercentage || 0;
  const selOcc = selectedVenue.currentOccupancy || 0;
  const selCap = selectedVenue.capacity || 1;
  const selP30 = Math.round(((selectedVenue.predictedOccupancyIn30Min || selOcc) / selCap) * 100);
  const selP60 = Math.round(((selectedVenue.predictedOccupancyIn60Min || selOcc) / selCap) * 100);

  let spotBadge = { label: 'QUIET', bg: 'bg-[#EAF5EF]', text: 'text-[#2D7A51]' };
  if (selPct >= 75) {
    spotBadge = { label: 'BUSY', bg: 'bg-[#FCEFEF]', text: 'text-[#C74343]' };
  } else if (selPct >= 45) {
    spotBadge = { label: 'MODERATE', bg: 'bg-[#FDF5E6]', text: 'text-[#B47B1E]' };
  }

  return (
    <div className="min-h-screen w-full bg-[#F3F2EC] text-[#171918] font-sans selection:bg-[#1E3A2F]/20 relative overflow-x-hidden">
      
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.45] z-0" 
        style={{
          backgroundImage: `radial-gradient(#1E3A2F 0.75px, transparent 0.75px)`,
          backgroundSize: '24px 24px'
        }} 
      />

      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-50/20 via-transparent to-stone-900/[0.03] z-0" />

      <div className="relative z-10">
        <ScrollHeroVideo />

        <Navbar
          isPolling={!backendError}
          activeCount={venues.length}
          isOperatorOpen={isOperatorOpen}
          onToggleOperator={() => setIsOperatorOpen(!isOperatorOpen)}
          highCapacityVenue={highCapacityVenue}
        />

        <div className="max-w-[1520px] mx-auto px-4 sm:px-8 py-8">
          <div className="flex flex-col xl:flex-row items-start gap-8">
            
            <EditorialSidebar onFocusSearch={handleFocusSearch} />

            <main id="live-spaces-grid" className="flex-1 w-full min-w-0 space-y-6">
              <div className="flex items-baseline justify-between">
                <div>
                  <h2 className="text-3xl font-serif font-medium text-[#171918] tracking-tight">Live Spaces</h2>
                  <p className="text-xs text-stone-500 mt-1">See what's happening before you arrive.</p>
                </div>
                <div className="flex items-center space-x-2 text-xs font-medium text-stone-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold text-emerald-800">Live</span>
                  <span>•</span>
                  <span>Last updated just now</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for malls, gyms, libraries, offices..."
                    className="peer w-full pl-10 pr-4 py-2 bg-white border border-[#E5E4DE] rounded-xl text-xs text-[#171918] placeholder-stone-400 focus:outline-none focus:border-[#183B2B] focus:ring-4 focus:ring-[#183B2B]/20 shadow-sm transition-all duration-300 ease-out"
                  />
                  <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-300 peer-focus:text-[#183B2B]" />
                </div>

                <div className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white border border-[#E5E4DE] text-xs text-stone-700 shadow-sm cursor-pointer hover:bg-stone-50">
                  <span>All Locations</span>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                </div>
              </div>

              <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'MALL', label: 'Malls' },
                  { id: 'GYM', label: 'Gyms' },
                  { id: 'LIBRARY', label: 'Libraries' },
                  { id: 'EXPO', label: 'Expos & Trade' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      activeCategory === cat.id
                        ? 'bg-[#1E3A2F] text-white shadow-sm font-semibold'
                        : 'bg-white hover:bg-stone-100 text-stone-600 border border-[#E5E4DE]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredVenues.map((venue) => (
                  <VenueCard
                    key={venue.venueId}
                    venue={venue}
                    isSelected={selectedVenueId === venue.venueId}
                    onSelect={(id) => {
                      setSelectedVenueId(id);
                      setIsDrawerOpen(true);
                    }}
                  />
                ))}
              </div>
            </main>

            <aside className="w-full xl:w-96 shrink-0 bg-white border border-[#EAE9E4] rounded-3xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] sticky top-24">
              <div className="relative h-44 w-full bg-stone-100">
                <img
                  src={VENUE_PHOTOS[selectedVenue.venueId] || VENUE_PHOTOS.mall_pacific}
                  alt={selectedVenue.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4 text-white">
                  <div className="flex items-end justify-between">
                    <div>
                      <h3 className="text-xl font-bold font-serif leading-tight">{selectedVenue.name}</h3>
                      <p className="text-xs text-stone-300 capitalize">{selectedVenue.type?.toLowerCase()} • Delhi NCR</p>
                    </div>
                    <button
                      onClick={() => setIsDrawerOpen(true)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-[11px] font-semibold text-white transition-all cursor-pointer shadow-sm"
                    >
                      <Navigation className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-b border-[#F2F1EC] px-6 py-3.5 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1E3A2F]">Live Telemetry Overview</span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  STREAMING
                </span>
              </div>

              <div className="p-5 space-y-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-black text-[#171918] font-sans">{selPct}%</span>
                      <span className="text-xs font-semibold text-stone-500">occupied</span>
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5 font-medium">
                      {selOcc.toLocaleString()} / {selCap.toLocaleString()} people
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-md text-xs font-bold ${spotBadge.bg} ${spotBadge.text}`}>
                    {spotBadge.label}
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-xs font-semibold text-rose-600">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Getting busier</span>
                  <span className="text-stone-400 font-normal">• +12% in last 30 mins</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#FAF9F5] border border-[#EAE9E4] rounded-2xl p-3 text-center">
                    <span className="text-[10px] text-stone-400 uppercase font-semibold">30 min forecast</span>
                    <div className="text-xl font-black text-[#171918] mt-0.5">{selP30}%</div>
                  </div>
                  <div className="bg-[#FAF9F5] border border-[#EAE9E4] rounded-2xl p-3 text-center">
                    <span className="text-[10px] text-stone-400 uppercase font-semibold">60 min forecast</span>
                    <div className="text-xl font-black text-[#171918] mt-0.5">{selP60}%</div>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-700 mb-3">
                    <span>Today's Activity</span>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-semibold">Now</span>
                  </div>
                  
                  <div className="flex items-end justify-between h-16 gap-1 px-1">
                    {[20, 30, 45, 60, 75, 95, 80, 50, 40, 30, 20].map((val, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-t-sm transition-all ${
                          i === 5 ? 'bg-[#E25C38]' : val > 60 ? 'bg-[#E9977E]' : 'bg-[#D2E4DA]'
                        }`}
                        style={{ height: `${val}%` }}
                      />
                    ))}
                  </div>

                  <div className="flex justify-between text-[10px] text-stone-400 font-mono mt-1.5">
                    <span>6am</span>
                    <span>9am</span>
                    <span>12pm</span>
                    <span>3pm</span>
                    <span>6pm</span>
                    <span>9pm</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-orange-50 text-[#C74343] text-xs font-medium border border-orange-100">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Higher than usual for this time</span>
                </div>

                <div className="pt-1">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-700 mb-2">
                    <span>Best Time to Visit</span>
                    <span className="text-emerald-700 text-[11px] font-semibold">Recommended</span>
                  </div>
                  <div className="flex items-end justify-between h-8 gap-1">
                    {[15, 20, 25, 30, 80, 85, 75, 35, 25, 20, 15].map((h, idx) => (
                      <div
                        key={idx}
                        className={`flex-1 rounded-t-sm ${
                          idx >= 4 && idx <= 6 ? 'bg-emerald-600' : 'bg-stone-200'
                        }`}
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="w-full py-3.5 rounded-full bg-[#1E3A2F] hover:bg-[#132E27] text-white font-semibold text-xs tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Get Directions & Analytics</span>
                </button>

              </div>
            </aside>

          </div>
        </div>

        <ValueStrip />

        {isDrawerOpen && (
          <FacilityDrawer
            venue={selectedVenue}
            venuePhoto={VENUE_PHOTOS[selectedVenue.venueId] || VENUE_PHOTOS.mall_pacific} 
            onClose={() => setIsDrawerOpen(false)}
          />
        )}

        <OperatorModal
          isOpen={isOperatorOpen}
          onClose={() => setIsOperatorOpen(false)}
          backendMode={backendMode}
          setBackendMode={setBackendMode}
          backendError={backendError}
          loadAllVenues={loadAllVenues}
          selectedVenue={selectedVenue}
          isSimulating={isSimulating}
          onToggleSimulation={() => setIsSimulating(!isSimulating)}
          onInjectBurst={handleInjectBurst}
          gates={GATES}
          eventLog={eventLog}
        />
      </div>
    </div>
  );
}