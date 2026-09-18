import React, { useState } from 'react';
import { Play, Pause, Zap, Sliders, Radio } from 'lucide-react';

export default function SimulationControl({ 
  selectedVenue, 
  isSimulating, 
  onToggleSimulation, 
  onInjectBurst,
  gates = [],
  eventLog = []
}) {
  const [selectedGate, setSelectedGate] = useState('gate_main');

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Live Simulator Controller
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              {isSimulating ? (
                <span className="text-emerald-400 flex items-center gap-1.5 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Active target: Multi-Venue Pipeline (All Facilities Ingesting)
                </span>
              ) : (
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400/80" />
                  Ready: Multi-Venue Ingestion Engine (Standby)
                </span>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={onToggleSimulation}
          className={`inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer ${
            isSimulating
              ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
          }`}
        >
          {isSimulating ? (
            <>
              <Pause className="h-3.5 w-3.5 mr-1.5" /> Pause Auto Traffic
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 mr-1.5" /> Start Auto Traffic
            </>
          )}
        </button>
      </div>

      {/* Control Surface */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Gate Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
            Simulated Sensor Gate
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {gates.map((gate) => (
              <button
                key={gate.id}
                onClick={() => setSelectedGate(gate.id)}
                className={`px-3 py-2 rounded-lg text-xs font-medium text-left border transition-all cursor-pointer ${
                  selectedGate === gate.id
                    ? 'border-blue-500 bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/30'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-800/40'
                }`}
              >
                <div className="font-semibold truncate">{gate.name}</div>
                <div className="text-[10px] opacity-60">{Math.round(gate.weight * 100)}% traffic</div>
              </button>
            ))}
          </div>
        </div>

        {/* High-Velocity Footfall Surge */}
        <div className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                High-Velocity Footfall Burst
              </label>
              <span className="text-[10px] font-mono text-[#FF9A3D] truncate max-w-[180px]">
                Target: {selectedVenue?.name || 'Selected Facility'}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Inject an instant surge into the currently inspected space to test threshold alerts.
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => onInjectBurst('ENTRY')}
              disabled={!selectedVenue}
              className="flex-1 inline-flex items-center justify-center px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-colors cursor-pointer"
            >
              <Zap className="h-3.5 w-3.5 mr-1.5 text-emerald-400" /> Influx Burst (+6)
            </button>
            <button
              onClick={() => onInjectBurst('EXIT')}
              disabled={!selectedVenue || (selectedVenue?.currentOccupancy ?? 0) <= 5}
              className={`flex-1 inline-flex items-center justify-center px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                !selectedVenue || (selectedVenue?.currentOccupancy ?? 0) <= 5
                  ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500 border-slate-700'
                  : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30 cursor-pointer'
              }`}
            >
              <Zap className="h-3.5 w-3.5 mr-1.5 text-rose-400" /> Exit Surge (-6)
            </button>
          </div>
        </div>
      </div>

      {/* Live Event Stream Log */}
      <div className="mt-4 pt-3 border-t border-slate-800/60">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
          <span className="font-semibold uppercase tracking-wider flex items-center">
            <Radio className="h-3 w-3 text-blue-400 mr-1 animate-pulse" /> Live Atomic Stream Log
          </span>
          <span>Last 5 Ingestions</span>
        </div>
        <div className="space-y-1 font-mono text-xs">
          {eventLog.length === 0 ? (
            <div className="text-slate-600 text-center py-2 italic text-[11px]">
              No events ingested yet. Click Entry or Start Auto Traffic.
            </div>
          ) : (
            eventLog.slice(0, 5).map((log, idx) => (
              <div 
                key={log.id || idx}
                className="flex items-center justify-between bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/60 text-[11px]"
              >
                <div className="flex items-center space-x-2">
                  <span className={`px-1.5 py-0.5 rounded font-bold ${
                    log.type === 'ENTRY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {log.type}
                  </span>
                  <span className="text-slate-300">{log.gate}</span>
                </div>
                <span className="text-slate-500 text-[10px]">{log.time}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}