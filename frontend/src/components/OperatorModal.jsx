import React from 'react';
import { X, Cloud, Server, AlertCircle, RefreshCcw } from 'lucide-react';
import SimulationControl from './SimulationControl';

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
  gates,
  eventLog
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-[#0F1211] border border-[#252826] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#252826] bg-[#0A0D0C]">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF7A1A]" />
            <h2 className="text-sm font-mono uppercase tracking-widest text-white font-bold">
              Engineering Console & Telemetry Deck
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-[#151817] hover:bg-[#202422] text-stone-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          
          {/* Environment Switcher */}
          <div className="flex flex-wrap items-center justify-between bg-[#151817] border border-[#252826] rounded-xl p-4 gap-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${backendMode === 'AWS' ? 'bg-[#FF7A1A]/10 text-[#FF9A3D]' : 'bg-blue-500/10 text-blue-400'}`}>
                {backendMode === 'AWS' ? <Cloud className="h-5 w-5" /> : <Server className="h-5 w-5" />}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-white">
                    {backendMode === 'AWS' ? 'AWS Cloud (Serverless Ingestion)' : 'Local Host (Spring Boot / H2)'}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#202422] text-stone-300 font-bold border border-[#303432]">
                    {backendMode}
                  </span>
                </div>
                <p className="text-xs text-stone-400 mt-0.5">
                  {backendMode === 'AWS'
                    ? 'POST /events to AWS API Gateway -> IoT Core -> DynamoDB'
                    : 'Direct REST communication with Spring Boot port 8080'}
                </p>
              </div>
            </div>

            <div className="flex items-center bg-[#0A0D0C] p-1 rounded-lg border border-[#252826]">
              <button
                onClick={() => setBackendMode('LOCAL')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center space-x-1.5 cursor-pointer ${
                  backendMode === 'LOCAL' ? 'bg-blue-600 text-white shadow-md' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Server className="h-3.5 w-3.5" />
                <span>Local (8080)</span>
              </button>
              <button
                onClick={() => setBackendMode('AWS')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center space-x-1.5 cursor-pointer ${
                  backendMode === 'AWS' ? 'bg-[#FF7A1A] text-[#080A0B] font-bold shadow-md' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Cloud className="h-3.5 w-3.5" />
                <span>AWS Live</span>
              </button>
            </div>
          </div>

          {/* Connection Error Banner */}
          {backendError && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4 flex items-start space-x-3 text-rose-300">
              <AlertCircle className="h-5 w-5 mt-0.5 text-rose-400 flex-shrink-0" />
              <div className="flex-1 text-xs">
                <p className="font-bold">Backend Connection Failure</p>
                <p className="text-rose-400 mt-0.5">{backendError}</p>
              </div>
              <button
                onClick={() => loadAllVenues(backendMode)}
                className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-semibold rounded-md border border-rose-500/40 flex items-center cursor-pointer"
              >
                <RefreshCcw className="h-3 w-3 mr-1" /> Retry
              </button>
            </div>
          )}

          {/* Simulation Controller */}
          <SimulationControl
            selectedVenue={selectedVenue}
            isSimulating={isSimulating}
            onToggleSimulation={onToggleSimulation}
            onInjectBurst={onInjectBurst}
            gates={gates}
            eventLog={eventLog}
          />
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#252826] bg-[#0A0D0C] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#202422] hover:bg-[#2B302E] text-stone-200 text-xs font-mono font-semibold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}