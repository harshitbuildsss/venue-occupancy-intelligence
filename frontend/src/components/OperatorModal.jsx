import React from 'react';
import { X, Play, Zap, RefreshCw, Server, ShieldCheck, Activity } from 'lucide-react';

export default function OperatorModal({
  isOpen,
  onClose,
  backendError,
  loadAllVenues,
  selectedVenue,
  isSimulating,
  onToggleSimulation,
  onInjectBurst,
  eventLog
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 sm:p-6">
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity"
      />

      <div className="relative w-full max-w-2xl bg-white border border-[#EAE9E4] rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#EAE9E4] flex items-center justify-between bg-[#FAF9F5]">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-[#1E3A2F]" />
            <h3 className="font-bold text-sm text-[#171918] tracking-tight">Engineering Console & Telemetry Deck</h3>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-stone-200/60 hover:bg-stone-200 flex items-center justify-center text-stone-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Active Ingestion Pipe (Permanent AWS Live Mode) */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Active Ingestion Pipe</label>
            <div className="p-4 rounded-2xl bg-[#1E3A2F] text-white flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-xs font-bold flex items-center space-x-2">
                    <span>AWS Cloud (Serverless Ingestion)</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">AWS LIVE</span>
                  </div>
                  <div className="text-[11px] text-stone-300 font-mono mt-0.5">
                    POST /events → API Gateway → Lambda → DynamoDB
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Live Simulator Controller */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Live Simulator Controller</label>
              <span className="text-xs text-stone-500">Target: <strong className="text-[#171918]">{selectedVenue?.name || 'Selected Venue'}</strong></span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={onToggleSimulation}
                className={`py-3 px-4 rounded-2xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  isSimulating 
                    ? 'bg-amber-600 text-white shadow-md' 
                    : 'bg-stone-100 hover:bg-stone-200 text-[#171918]'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isSimulating ? 'Stop Auto Traffic' : 'Start Auto Traffic'}</span>
              </button>

              <button
                onClick={() => onInjectBurst('ENTRY')}
                className="py-3 px-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60 text-xs font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm"
              >
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
                <span>Influx Burst (+6)</span>
              </button>

              <button
                onClick={() => onInjectBurst('EXIT')}
                className="py-3 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200/60 text-xs font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm"
              >
                <Activity className="w-3.5 h-3.5 text-rose-600" />
                <span>Exit Surge (-6)</span>
              </button>
            </div>
          </div>

          {/* Live Atomic Stream Log */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Live Atomic Stream Log</label>
              <span className="text-[10px] font-mono text-stone-400">{eventLog.length} events captured</span>
            </div>

            <div className="bg-[#FAF9F5] border border-[#EAE9E4] rounded-2xl p-3 h-44 overflow-y-auto font-mono text-[11px] space-y-1.5">
              {eventLog.length === 0 ? (
                <div className="text-stone-400 text-center py-12 italic">
                  No telemetry events recorded yet. Start auto traffic or trigger a burst.
                </div>
              ) : (
                eventLog.map((evt, idx) => (
                  <div key={idx} className="flex items-center justify-between py-1 px-2.5 rounded-lg bg-white border border-[#EAE9E4]/60 shadow-xs">
                    <div className="flex items-center space-x-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${evt.type === 'ENTRY' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <span className="text-stone-700 font-bold">{evt.type}</span>
                      <span className="text-stone-400">via</span>
                      <span className="text-stone-600">{evt.gate}</span>
                    </div>
                    <span className="text-stone-400">{evt.time}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#FAF9F5] border-t border-[#EAE9E4] flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-stone-500">
            <span className={`w-2 h-2 rounded-full ${backendError ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
            <span>{backendError ? 'AWS Gateway Disconnected' : 'API Gateway Connected & Secure'}</span>
          </div>
          <button
            onClick={() => loadAllVenues('AWS')}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-[#EAE9E4] font-semibold transition-colors cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-3 h-3 text-stone-500" />
            <span>Sync State</span>
          </button>
        </div>

      </div>
    </div>
  );
}