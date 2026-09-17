import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import VenueCard from './components/VenueCard';
import SimulationControl from './components/SimulationControl';
import { fetchVenue, createVenue, sendOccupancyEvent } from './services/api';
import { Building2, AlertCircle, RefreshCcw } from 'lucide-react';

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
  const [venues, setVenues] = useState([]);
  const [previousOccupancies, setPreviousOccupancies] = useState({});
  const [selectedVenueId, setSelectedVenueId] = useState('mall_pacific');
  const [isSimulating, setIsSimulating] = useState(false);
  const [eventLog, setEventLog] = useState([]);
  const [backendError, setBackendError] = useState(null);

  useEffect(() => {
    async function initVenues() {
      try {
        for (const initial of INITIAL_VENUES) {
          const existing = await fetchVenue(initial.venueId);
          if (!existing) {
            await createVenue(initial);
          }
        }
        await loadAllVenues();
        setBackendError(null);
      } catch (err) {
        console.error('Initialization error:', err);
        setBackendError('Cannot connect to backend server (http://localhost:8080). Ensure Spring Boot is running.');
      }
    }
    initVenues();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      loadAllVenues();
    }, 1500);
    return () => clearInterval(interval);
  }, [venues]);

  async function loadAllVenues() {
    try {
      const fetched = await Promise.all(
        INITIAL_VENUES.map(async (v) => {
          const data = await fetchVenue(v.venueId);
          return data;
        })
      );
      const validVenues = fetched.filter(Boolean);

      setVenues((prev) => {
        const prevMap = {};
        prev.forEach((v) => {
          prevMap[v.venueId] = v.currentOccupancy;
        });
        setPreviousOccupancies(prevMap);
        return validVenues;
      });
      setBackendError(null);
    } catch (err) {
      console.warn('Polling error:', err.message);
    }
  }

  async function handleManualEvent(venueId, eventType, gateId = 'gate_main') {
    try {
      await sendOccupancyEvent({
        venueId,
        eventType,
        deviceId: gateId
      });
      
      setEventLog((prev) => [
        {
          id: `${Date.now()}_${Math.random()}`,
          type: eventType,
          gate: GATES.find(g => g.id === gateId)?.name || gateId,
          time: new Date().toLocaleTimeString()
        },
        ...prev.slice(0, 19)
      ]);

      await loadAllVenues();
    } catch (err) {
      console.error('Event submission failed:', err);
    }
  }

  async function handleInjectBurst(burstType) {
    const target = venues.find(v => v.venueId === selectedVenueId);
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
        {backendError && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 flex items-start space-x-3 text-rose-300">
            <AlertCircle className="h-5 w-5 mt-0.5 text-rose-400 flex-shrink-0" />
            <div className="flex-1 text-sm">
              <p className="font-bold">Backend Connection Required</p>
              <p className="text-rose-400 text-xs mt-0.5">{backendError}</p>
            </div>
            <button
              onClick={loadAllVenues}
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

        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-blue-400" /> Monitored Physical Venues
              </h2>
              <p className="text-xs text-slate-400">Click a card to focus the live simulation controller</p>
            </div>
            <span className="text-xs text-slate-500">Auto-refreshing every 1.5s</span>
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
