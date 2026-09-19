import React from 'react';
import { Activity, Radio, Terminal, AlertTriangle } from 'lucide-react';

export default function Navbar({ isPolling, activeCount, isOperatorOpen, onToggleOperator, highCapacityVenue }) {
  return (
    <nav className="border-b border-[#252826] bg-[#0A0D0C]/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-[#FF7A1A]/10 border border-[#FF7A1A]/30 flex items-center justify-center">
            <Radio className="w-4 h-4 text-[#FF9A3D]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold tracking-tight text-white">Bharat Occupancy</span>
              <span className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-[#1A1E1D] text-amber-300 border border-[#2B302E]">
                Live
              </span>
            </div>
            <p className="text-[11px] text-stone-400 font-normal">Real-time venue intelligence</p>
          </div>
        </div>

        {/* Center Alert Ribbon (Surfaces threshold warnings if any facility > 85%) */}
        {highCapacityVenue && (
          <div className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-950/40 border border-rose-800/40 text-rose-300 text-xs animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span><strong>{highCapacityVenue.name}</strong> nearing maximum capacity ({highCapacityVenue.capacityPercentage}%)</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-2 text-xs text-stone-400 font-mono">
            <span className={`w-2 h-2 rounded-full ${isPolling ? 'bg-emerald-400 animate-pulse' : 'bg-stone-600'}`} />
            <span>{activeCount} Facilities Monitored</span>
          </div>

          {/* Operator Mode Toggle */}
          <button
            onClick={onToggleOperator}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono tracking-wider flex items-center space-x-2 transition-all cursor-pointer border ${
              isOperatorOpen
                ? 'bg-[#FF7A1A] text-[#080A0B] font-bold border-[#FF9A3D] shadow-lg shadow-[#FF7A1A]/20'
                : 'bg-[#151817] text-stone-300 hover:text-white border-[#252826] hover:border-[#383D3A]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>{isOperatorOpen ? 'Close Operator Hub' : 'Operator Mode'}</span>
          </button>
        </div>
      </div>
    </nav>
  );
}