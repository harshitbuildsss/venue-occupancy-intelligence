import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import VenueCard from './components/VenueCard';
import FacilityDrawer from './components/FacilityDrawer';
import OperatorModal from './components/OperatorModal';
import ScrollHeroVideo from './components/ScrollHeroVideo';
import { fetchVenue, createVenue, sendOccupancyEvent } from './services/api';
import { Search, Sparkles, TrendingUp, Users } from 'lucide-react';

const AWS_BASE_URL = 'https://d35p0u4mf9.execute-api.ap-south-1.amazonaws.com';

const INITIAL_VENUES = [
  { venueId: 'mall_pacific', name: 'Pacific Mall (Tagore Garden)', type: 'MALL', capacity: 2500, initialOccupancy: 840 },
  { venueId: 'gym_cult', name: 'Cult.fit Premium Gym', type: 'GYM', capacity: 150, initialOccupancy: 146 },
  { venueId: 'lib_central', name: 'Central University Library', type: 'LIBRARY', capacity: 400, initialOccupancy: 110 },
  { venueId: 'expo_pragati', name: 'Pragati Maidan (Bharat Mandapam)', type: 'EXPO', capacity: 7000, initialOccupancy: 3850 }
];

const GATES = [
  { id: 'gate_main', name: 'Gate A (Main)', weight: 0.40 },
  { id: 'gate_food_court', name: 'Gate B (Concourse/Hall)', weight: 0.30 },
  { id: 'gate_parking', name: 'Gate C (Parking / Metro)', weight: 0.20 },
  { id: 'gate_rear', name: 'Gate D (Side / Gate 10)', weight: 0.10 }
];

export default function App() {
  const [backendMode, setBackendMode] = useState('AWS');
  const [venues, setVenues] = useState([]);
  const [selectedVenueId, setSelectedVenueId] = useState('expo_pragati');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [isSimulating, setIsSimulating] = useState(false);
  const [eventLog, setEventLog] = useState([]);
  const [backendError, setBackendError] = useState(null);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isOperatorOpen, setIsOperatorOpen] = useState(false);

  // Sync references to bypass stale closures in intervals
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

  // Initial Load
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

  // Polling every 2.0s
  useEffect(() => {
    const interval = setInterval(() => {
      loadAllVenues(backendModeRef.current);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Ambient Footfall Noise
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

  // Operator Auto-Traffic Simulation
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

        // Retain current in-memory count for expo_pragati to avoid 3850 overwrite
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
            crowdStatus: capacityPercentage >= 85 ? 'NEAR CAPACITY' : capacityPercentage >= 65 ? 'VERY BUSY' : capacityPercentage >= 40 ? 'MODERATE' : 'QUIET',
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
            crowdStatus: calculatedPercent >= 85 ? 'NEAR CAPACITY' : calculatedPercent >= 65 ? 'VERY BUSY' : calculatedPercent >= 40 ? 'MODERATE' : 'QUIET',
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
        setBackendError(`Cannot reach AWS API Gateway.`);
      }
    }
  }

  async function handleManualEvent(venueId, eventType, gateId = 'gate_main', isSilent = false) {
    const currentMode = backendModeRef.current;
    const uniqueEventId = `evt_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

    const delta = venueId === 'expo_pragati' ? 18 : 1;

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

  const selectedVenue = venues.find((v) => v.venueId === selectedVenueId) || venues[0] || {};
  const highCapacityVenue = venues.find((v) => v.capacityPercentage >= 85);
  const quietestVenue = [...venues].sort((a, b) => a.capacityPercentage - b.capacityPercentage)[0];
  const busiestVenue = [...venues].sort((a, b) => b.capacityPercentage - a.capacityPercentage)[0];
  const totalOccupancy = venues.reduce((acc, v) => acc + (v.currentOccupancy || 0), 0);

  const filteredVenues = venues.filter((v) => {
    const matchesSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'ALL' || v.type === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen w-full bg-[#080A0B] text-stone-100 font-sans selection:bg-[#FF7A1A]/30 overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <ScrollHeroVideo />

      <Navbar
        isPolling={!backendError}
        activeCount={venues.length}
        isOperatorOpen={isOperatorOpen}
        onToggleOperator={() => setIsOperatorOpen(!isOperatorOpen)}
        highCapacityVenue={highCapacityVenue}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-4 space-y-4">

        {/* 1. City Pulse Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="bg-[#101312] border border-[#252826] rounded-xl p-3.5 flex items-center space-x-3.5">
            <div className="w-9 h-9 rounded-lg bg-[#FF7A1A]/10 border border-[#FF7A1A]/20 flex items-center justify-center text-[#FF9A3D]">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500 font-semibold">City Live Headcount</span>
              <div className="text-lg font-bold text-white mt-0.5">{totalOccupancy.toLocaleString()} active visitors</div>
            </div>
          </div>

          <div className="bg-[#101312] border border-[#252826] rounded-xl p-3.5 flex items-center space-x-3.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500 font-semibold">Best Time To Visit</span>
              <div className="text-sm font-bold text-white mt-0.5 truncate max-w-[200px]">
                {quietestVenue ? quietestVenue.name : 'All Normal'}
              </div>
              <span className="text-[11px] text-emerald-400 font-mono">Only {quietestVenue?.capacityPercentage || 0}% full</span>
            </div>
          </div>

          <div className="bg-[#101312] border border-[#252826] rounded-xl p-3.5 flex items-center space-x-3.5">
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-stone-500 font-semibold">Peak Choke Point</span>
              <div className="text-sm font-bold text-white mt-0.5 truncate max-w-[200px]">
                {busiestVenue ? busiestVenue.name : 'None'}
              </div>
              <span className="text-[11px] text-rose-400 font-mono">{busiestVenue?.capacityPercentage || 0}% peak saturation</span>
            </div>
          </div>
        </div>

        {/* 2. Filters & Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {['ALL', 'MALL', 'GYM', 'LIBRARY', 'EXPO'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-[#FF7A1A] text-[#080A0B] font-bold shadow-md shadow-[#FF7A1A]/20'
                    : 'bg-[#101312] text-stone-400 hover:text-white border border-[#252826]'
                }`}
              >
                {cat === 'ALL' ? 'All Spaces' : cat === 'MALL' ? 'Shopping' : cat === 'GYM' ? 'Fitness' : cat === 'LIBRARY' ? 'Study & Quiet' : 'Expos & Trade'}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by facility name..."
              className="w-full pl-10 pr-4 py-1.5 bg-[#101312] border border-[#252826] rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#FF7A1A]"
            />
          </div>
        </div>

        {/* 3. Main Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredVenues.map((venue) => (
              <VenueCard
                key={venue.venueId}
                venue={venue}
                onSelect={(id) => {
                  setSelectedVenueId(id);
                  setIsDrawerOpen(true);
                }}
              />
            ))}
          </div>

          {selectedVenue && (
            <div className="bg-[#101312] border border-[#252826] rounded-2xl p-4 space-y-4 sticky top-20 transition-all duration-300">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[#FF9A3D] font-bold">
                    Featured Spotlight • {selectedVenue.type}
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5 leading-tight">{selectedVenue.name}</h3>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="text-xs font-mono text-stone-400 hover:text-[#FF9A3D] underline cursor-pointer"
                >
                  Full Drawer →
                </button>
              </div>

              <div className="p-3 rounded-xl bg-[#151817] border border-[#252826]">
                <div className="flex justify-between text-xs text-stone-400 font-mono">
                  <span>Current Saturation</span>
                  <span>{selectedVenue.currentOccupancy} / {selectedVenue.capacity} visitors</span>
                </div>
                <div className="text-2xl font-extrabold text-white mt-1 font-sans">
                  {selectedVenue.capacityPercentage}%
                </div>
                <div className="w-full h-2 bg-[#202422] rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      selectedVenue.capacityPercentage >= 85 ? 'bg-rose-500' : selectedVenue.capacityPercentage >= 65 ? 'bg-[#FF7A1A]' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${selectedVenue.capacityPercentage}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-center">
                <div className="bg-[#151817] border border-[#252826] rounded-xl p-2.5">
                  <span className="text-[10px] font-mono text-stone-400 uppercase">30 Min Forecast</span>
                  <div className="text-base font-bold text-white mt-0.5 font-sans">{selectedVenue.predictedOccupancyIn30Min}</div>
                  <span className="text-[10px] text-stone-500 font-mono">
                    {Math.round(((selectedVenue.predictedOccupancyIn30Min || 0) / (selectedVenue.capacity || 1)) * 100)}% cap
                  </span>
                </div>
                <div className="bg-[#151817] border border-[#252826] rounded-xl p-2.5">
                  <span className="text-[10px] font-mono text-stone-400 uppercase">60 Min Forecast</span>
                  <div className="text-base font-bold text-[#FF9A3D] mt-0.5 font-sans">{selectedVenue.predictedOccupancyIn60Min}</div>
                  <span className="text-[10px] text-stone-500 font-mono">
                    {Math.round(((selectedVenue.predictedOccupancyIn60Min || 0) / (selectedVenue.capacity || 1)) * 100)}% cap
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#202422]">
                <div className="flex justify-between text-[11px] text-stone-400 mb-2">
                  <span>Typical Rush Curve</span>
                  <span className="text-[#FF9A3D] font-mono text-[10px]">Active Sensor Stream</span>
                </div>
                <div className="flex items-end justify-between h-12 px-2">
                  {[25, 45, Math.min(100, Math.max(30, selectedVenue.capacityPercentage)), 88, 70, 32].map((val, idx) => (
                    <div
                      key={idx}
                      className={`w-5 rounded-t transition-all duration-300 ${idx === 2 ? 'bg-[#FF7A1A] shadow-md shadow-[#FF7A1A]/40' : 'bg-[#252826]'}`}
                      style={{ height: `${val}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

      </main>

      {/* Facility Drawer */}
      {isDrawerOpen && (
        <FacilityDrawer
          venue={selectedVenue}
          onClose={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Operator Modal */}
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
  );
}