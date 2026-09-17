import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import VenueCard from './components/VenueCard';
import SimulationControl from './components/SimulationControl';
import { fetchVenue, createVenue, sendOccupancyEvent } from './services/api';
import { Building2, AlertCircle, RefreshCcw, Cloud, Server, TrendingDown, TrendingUp, Clock } from 'lucide-react';

const AWS_BASE_URL = 'https://d35p0u4mf9.execute-api.ap-south-1.amazonaws.com';

const INITIAL_VENUES = [
  { venueId: 'mall_pacific', name: 'Pacific Mall (Tagore Garden)', type: 'MALL', capacity: 2500, initialOccupancy: 840 },
  { venueId: 'gym_cult', name: 'Cult.fit Premium Gym', type: 'GYM', capacity: 150, initialOccupancy: 110 },
  { venueId: 'lib_central', name: 'Central University Library', type: 'LIBRARY', capacity: 400, initialOccupancy: 95 }
];

const GATES = [
  { id: 'gate_main', name: 'Gate A (Main)', weight: 0.45 },
  { id: 'gate_food_court', name: 'Gate B (Food Court)', weight: 0.30 },
  { id: 'gate_parking', name: 'Gate C (Parking)', weight: 0.15 },
  { id: 'gate_rear', name: 'Gate D (Side/Rear)', weight: 0.10 }
];

export default function App() {
  const [backendMode, setBackendMode] = useState('AWS'); // 'AWS' or 'LOCAL'
  const [venues, setVenues] = useState([]);
  const [previousOccupancies, setPreviousOccupancies] = useState({});
  const [selectedVenueId, setSelectedVenueId] = useState('mall_pacific');
  const [isSimulating, setIsSimulating] = useState(false);
  const [eventLog, setEventLog] = useState([]);
  const [backendError, setBackendError] = useState(null);

  const backendModeRef = useRef(backendMode);
  useEffect(() => {
    backendModeRef.current = backendMode;
  }, [backendMode]);

  useEffect(() => {
    async function initVenues() {
      if (backendModeRef.current === 'LOCAL') {
        try {
          for (const initial of INITIAL_VENUES) {
            const existing = await fetchVenue(initial.venueId);
            if (!existing) {
              await createVenue(initial);
            }
          }
        } catch (err) {
          console.warn('Local initialization error:', err);
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

  async function loadAllVenues(mode = backendModeRef.current) {
    try {
      let normalizedVenues = [];

      if (mode === 'AWS') {
        const res = await fetch(`${AWS_BASE_URL}/venues`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();

        normalizedVenues = (Array.isArray(data) ? data : []).map((v) => {
          const occ = Number(v.currentOccupancy || 0);
          const cap = Number(v.capacity || 1);
          const p60 = v.predictedOccupancyIn60Min !== undefined
            ? Number(v.predictedOccupancyIn60Min)
            : Math.max(0, Math.min(cap, Math.round(occ * 0.85)));
          const p30 = Math.max(0, Math.min(cap, Math.round(occ * 0.92)));
          const velocity = Math.round(((p60 - occ) / 60) * 10) / 10;

          return {
            venueId: v.venueId,
            name: v.name,
            type: v.type,
            capacity: cap,
            currentOccupancy: occ,
            crowdStatus: v.crowdStatus || (occ / cap > 0.8 ? 'BUSY' : occ / cap > 0.4 ? 'MODERATE' : 'QUIET'),
            predictedOccupancyIn30Min: p30,
            predictedOccupancyIn60Min: p60,
            velocityPerMin: velocity,
            updatedAt: v.updatedAt
          };
        });
      } else {
        const fetched = await Promise.all(
          INITIAL_VENUES.map(async (v) => {
            const data = await fetchVenue(v.venueId);
            return data;
          })
        );
        normalizedVenues = fetched.filter(Boolean).map((v) => {
          const occ = Number(v.currentOccupancy || 0);
          const cap = Number(v.capacity || 1);
          const p60 = Math.max(0, Math.min(cap, Math.round(occ * 0.85)));
          const p30 = Math.max(0, Math.min(cap, Math.round(occ * 0.92)));
          const velocity = Math.round(((p60 - occ) / 60) * 10) / 10;
          return {
            ...v,
            predictedOccupancyIn30Min: p30,
            predictedOccupancyIn60Min: p60,
            velocityPerMin: velocity
          };
        });
      }

      setVenues((prev) => {
        const prevMap = {};
        prev.forEach((v) => {
          prevMap[v.venueId] = v.currentOccupancy;
        });
        setPreviousOccupancies(prevMap);
        return normalizedVenues;
      });
      setBackendError(null);
    } catch (err) {
      console.warn('Polling error:', err.message);
      if (mode === 'LOCAL') {
        setBackendError('Cannot connect to backend server (http://localhost:8080). Ensure Spring Boot is running.');
      } else {
        setBackendError(`Cannot connect to AWS API Gateway (${AWS_BASE_URL}). Check internet or CORS.`);
      }
    }
  }

  async function handleManualEvent(venueId, eventType, gateId = 'gate_main') {
    try {
      if (backendModeRef.current === 'LOCAL') {
        await sendOccupancyEvent({
          venueId,
          eventType,
          deviceId: gateId
        });
      }

      setEventLog((prev) => [
        {
          id: `${Date.now()}_${Math.random()}`,
          type: eventType,
          gate: GATES.find((g) => g.id === gateId)?.name || gateId,
          time: new Date().toLocaleTimeString()
        },
        ...prev.slice(0, 19)
      ]);

      await loadAllVenues(backendModeRef.current);
    } catch (err) {
      console.error('Event submission failed:', err);
    }
  }

  async function handleInjectBurst(burstType) {
    const target = venues.find((v) => v.venueId === selectedVenueId);
    if (!target) return;

    for (let i = 0; i < 6; i++) {
      const randomGate = GATES[Math.floor(Math.random() * GATES.length)].id;
      await handleManualEvent(selectedVenueId, burstType, randomGate);
    }
  }

  useEffect(() => {
    if (!isSimulating) return;

    const timer = setInterval(async () => {
      const target = venues.find((v) => v.venueId === selectedVenueId);
      if (!target) return;

      const r = Math.random();
      let cumulative = 0;
      let chosenGate = GATES[0].id;
      for (const gate of GATES) {
        cumulative += gate.weight;
        if (r <= cumulative) {
          chosenGate = gate.id;
          break;
        }
      }

      const ratio = target.currentOccupancy / target.capacity;
      const entryProbability = ratio < 0.3 ? 0.85 : ratio < 0.7 ? 0.55 : 0.25;
      let eventType = Math.random() < entryProbability ? 'ENTRY' : 'EXIT';

      if (eventType === 'EXIT' && target.currentOccupancy <= 0) {
        eventType = 'ENTRY';
      }

      await handleManualEvent(selectedVenueId, eventType, chosenGate);
    }, 450);

    return () => clearInterval(timer);
  }, [isSimulating, selectedVenueId, venues]);

  const selectedVenue = venues.find((v) => v.venueId === selectedVenueId);
  const totalOccupancy = venues.reduce((acc, v) => acc + (v.currentOccupancy || 0), 0);
  const totalCapacity = venues.reduce((acc, v) => acc + (v.capacity || 0), 0);
  const averageUtilization = totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      <Navbar isPolling={!backendError} activeCount={venues.length} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Backend Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between bg-slate-900/80 border border-slate-800 rounded-2xl p-4 gap-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-xl ${backendMode === 'AWS' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
              {backendMode === 'AWS' ? <Cloud className="h-5 w-5" /> : <Server className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-white">
                  {backendMode === 'AWS' ? 'AWS Cloud (Serverless Live)' : 'Local Environment (Spring Boot / H2)'}
                </span>
                <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold ${
                  backendMode === 'AWS' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700 text-slate-300'
                }`}>
                  {backendMode === 'AWS' ? 'Connected' : 'Standalone'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {backendMode === 'AWS'
                  ? 'Ingesting via AWS IoT Core & serving from API Gateway'
                  : 'Direct REST communication with Spring Boot port 8080'}
              </p>
            </div>
          </div>

          <div className="flex items-center bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setBackendMode('LOCAL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center space-x-1.5 ${
                backendMode === 'LOCAL'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Server className="h-3.5 w-3.5" />
              <span>Local (H2)</span>
            </button>
            <button
              onClick={() => setBackendMode('AWS')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center space-x-1.5 ${
                backendMode === 'AWS'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-lg'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cloud className="h-3.5 w-3.5" />
              <span>AWS Cloud</span>
            </button>
          </div>
        </div>

        {backendError && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 flex items-start space-x-3 text-rose-300">
            <AlertCircle className="h-5 w-5 mt-0.5 text-rose-400 flex-shrink-0" />
            <div className="flex-1 text-sm">
              <p className="font-bold">Backend Connection Error</p>
              <p className="text-rose-400 text-xs mt-0.5">{backendError}</p>
            </div>
            <button
              onClick={() => loadAllVenues(backendMode)}
              className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-semibold rounded-lg border border-rose-500/40 flex items-center"
            >
              <RefreshCcw className="h-3 w-3 mr-1" /> Retry
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total People Monitored</span>
            <div className="text-2xl font-extrabold text-white mt-1">{totalOccupancy.toLocaleString()}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Across all active gate turnstiles</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Capacity Utilization</span>
            <div className="text-2xl font-extrabold text-white mt-1">{averageUtilization}%</div>
            <p className="text-[11px] text-slate-500 mt-0.5">{totalOccupancy.toLocaleString()} / {totalCapacity.toLocaleString()} total slots</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-sm">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monitored Facilities</span>
            <div className="text-2xl font-extrabold text-blue-400 mt-1">{venues.length} Venues</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Malls, Gyms & Campus Buildings</p>
          </div>
        </div>

        {/* Predictive Demand & Velocity Row */}
        {selectedVenue && (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Real-time Intelligence & Prediction: {selectedVenue.name}
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">Linear 60-min damped regression</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
                <span className="text-[11px] text-slate-400 font-medium">Current Status</span>
                <div className="text-lg font-bold text-white mt-1">{selectedVenue.crowdStatus}</div>
                <span className="text-[10px] text-slate-500">{selectedVenue.currentOccupancy} / {selectedVenue.capacity}</span>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
                <span className="text-[11px] text-slate-400 font-medium">Est. in 30 Min</span>
                <div className="text-lg font-bold text-sky-400 mt-1">{selectedVenue.predictedOccupancyIn30Min}</div>
                <span className="text-[10px] text-slate-500">
                  {Math.round((selectedVenue.predictedOccupancyIn30Min / selectedVenue.capacity) * 100)}% capacity
                </span>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
                <span className="text-[11px] text-slate-400 font-medium">Est. in 60 Min</span>
                <div className="text-lg font-bold text-amber-400 mt-1">{selectedVenue.predictedOccupancyIn60Min}</div>
                <span className="text-[10px] text-slate-500">
                  {Math.round((selectedVenue.predictedOccupancyIn60Min / selectedVenue.capacity) * 100)}% capacity
                </span>
              </div>

              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5">
                <span className="text-[11px] text-slate-400 font-medium">Net Velocity</span>
                <div className={`text-lg font-bold mt-1 flex items-center ${selectedVenue.velocityPerMin >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {selectedVenue.velocityPerMin >= 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                  {selectedVenue.velocityPerMin > 0 ? `+${selectedVenue.velocityPerMin}` : selectedVenue.velocityPerMin}/min
                </div>
                <span className="text-[10px] text-slate-500">Rate of change</span>
              </div>
            </div>
          </div>
        )}

        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-blue-400" /> Monitored Physical Venues
              </h2>
              <p className="text-xs text-slate-400">Click a card to focus the live simulation controller</p>
            </div>
            <span className="text-xs text-slate-500">Auto-refreshing every 2.0s</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {venues.map((venue) => (
              <VenueCard
                key={venue.venueId}
                venue={venue}
                previousOccupancy={previousOccupancies[venue.venueId]}
                onManualEvent={handleManualEvent}
                onSelect={(id) => setSelectedVenueId(id)}
                isSelected={selectedVenueId === venue.venueId}
              />
            ))}
          </div>
        </section>

        <section>
          <SimulationControl
            selectedVenue={selectedVenue}
            isSimulating={isSimulating}
            onToggleSimulation={() => setIsSimulating(!isSimulating)}
            onInjectBurst={handleInjectBurst}
            gates={GATES}
            eventLog={eventLog}
          />
        </section>
      </main>
    </div>
  );
}