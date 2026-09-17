import React from 'react';
import { ShieldCheck, Activity } from 'lucide-react';

export default function Navbar({ isPolling, activeCount }) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-white">Bharat Occupancy</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                P0 Live
              </span>
            </div>
            <p className="text-xs text-slate-400">Zero-PII Real-Time Crowd Intelligence</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700/60">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Privacy First &bull; No Biometrics</span>
          </div>

          <div className="flex items-center space-x-2 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-full">
            <span className={`h-2 w-2 rounded-full ${isPolling ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-xs font-medium text-slate-300">
              {isPolling ? 'Live Stream' : 'Paused'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
