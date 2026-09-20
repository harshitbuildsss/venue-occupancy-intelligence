import React, { useState } from 'react';
import { X, Play, Square, Zap, Radio, Cloud, Server, AlertTriangle } from 'lucide-react';

export default function OperatorModal({
  isOpen,
  onClose,
  backendMode,
  setBackendMode,
  backendError,
  loadAllVenues,
  selectedVenue,
  isSimulating,
  onToggleSimulation,
  onInjectBurst,
  gates = [],
  eventLog = []
}) {
  if (!isOpen) return null;

  const [selectedGate, setSelectedGate] = useState(gates[0]?.id || 'gate_main');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity" 
      />

      {/* Modal Card */}
      <div className="relative bg-[#FAF9F5] border border-[#EAE9E4] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl z-10">
        
        {/* Header */}
        <div className="p-6 bg-white border-b border-[#EAE9E4] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-[#1E3A2F] flex items-center justify-center text-emerald-300">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#171918]">Engineering Console & Telemetry Deck</h3>
              <p className="text-[11px] text-stone-500">Inspect live event pipes, switch backend modes, or simulate traffic surges</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Backend Selector Banner */}
          <div className="p-4 rounded-2xl bg-white border border-[#EAE9E4] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 font-bold">Active Ingestion Pipe</span>
              <div className="text-sm font-bold text-[#171918] flex items-center space-x-2 mt-0.5">
                {backendMode === 'AWS' ? <Cloud className="w-4 h-4 text-sky-600" /> : <Server className="w-4 h-4 text-emerald-600" />}
                <span>{backendMode === 'AWS' ? 'AWS Cloud (Serverless Ingestion)' : 'Local Spring Boot (8080)'}</span>
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5">
                {backendMode === 'AWS' ? 'POST /events -> API Gateway -> Lambda/DynamoDB' : 'Direct REST persistence via local H2 database'}
              </p>
            </div>

            <div className="flex rounded-xl bg-[#FAF9F5] p-1 border border-[#EAE9E4] shrink-0">
              <button
                onClick={() => { setBackendMode('LOCAL'); loadAllVenues('LOCAL'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  backendMode === 'LOCAL' ? 'bg-[#1E3A2F] text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Local (8080)
              </button>
              <button
                onClick={() => { setBackendMode('AWS'); loadAllVenues('AWS'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  backendMode === 'AWS' ? 'bg-[#1E3A2F] text-white shadow-sm' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                AWS Live
              </button>
            </div>
          </div>

          {backendError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-700 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{backendError}</span>
            </div>
          )}

          {/* Traffic Simulator Controller */}
          <div className="p-5 rounded-2xl bg-white border border-[#EAE9E4] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-[#171918]">Live Simulator Controller</h4>
                <p className="text-[11px] text-stone-500">Automate continuous multi-venue footfall fluctuation</p>
              </div>
              <button
                onClick={onToggleSimulation}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  isSimulating
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-[#1E3A2F] hover:bg-[#132E27] text-white'
                }`}
              >
                {isSimulating ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{isSimulating ? 'Stop Auto Traffic' : 'Start Auto Traffic'}</span>
              </button>
            </div>

            {/* Manual Burst Triggers */}
            <div className="pt-2 border-t border-[#F2F1EC]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-stone-700">
                  Target Venue: <span className="text-[#1E3A2F]">{selectedVenue?.name || 'None Selected'}</span>
                </span>
                <span className="text-[10px] text-stone-400 uppercase font-mono">Surge Testing</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => onInjectBurst('ENTRY')}
                  className="py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center space-x-2 transition-colors"
                >
                  <Zap className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Influx Burst (+6)</span>
                </button>
                <button
                  onClick={() => onInjectBurst('EXIT')}
                  className="py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-center space-x-2 transition-colors"
                >
                  <Zap className="w-3.5 h-3.5 text-rose-600" />
                  <span>Exit Surge (-6)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Event Stream Log */}
          <div className="p-4 rounded-2xl bg-white border border-[#EAE9E4] shadow-sm space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-stone-700">
              <span>LIVE ATOMIC STREAM LOG</span>
              <span className="text-[10px] font-mono text-stone-400">Last 5 Events</span>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto font-mono text-[11px]">
              {eventLog.length === 0 ? (
                <div className="text-stone-400 py-3 text-center text-xs font-sans">
                  No manual events triggered yet. Use buttons above or start simulator.
                </div>
              ) : (
                eventLog.slice(0, 5).map((evt) => (
                  <div key={evt.id} className="p-2 rounded-lg bg-[#FAF9F5] border border-[#EAE9E4] flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        evt.type === 'ENTRY' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {evt.type}
                      </span>
                      <span className="text-stone-700">{evt.gate}</span>
                    </div>
                    <span className="text-stone-400 text-[10px]">{evt.time}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-[#EAE9E4] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}