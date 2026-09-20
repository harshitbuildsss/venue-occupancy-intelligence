import React, { useState } from 'react';
import BrandLogo from './BrandLogo';
import { SlidersHorizontal, Info, X, Cpu, Database, Activity, Phone, Copy, Check } from 'lucide-react';

export default function Navbar({ isPolling, activeCount, isOperatorOpen, onToggleOperator }) {
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const myPhoneNumber = "+91 98765 43210";

  const scrollToGrid = () => {
    const el = document.getElementById('live-spaces-grid');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const copyNumber = () => {
    navigator.clipboard.writeText(myPhoneNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <>
      <header className="w-full bg-[#F3F2EC]/90 backdrop-blur-md border-b border-[#E3E2DA] px-6 sm:px-12 py-3.5 flex items-center justify-between sticky top-0 z-40">
        
        <BrandLogo />

        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
          <button 
            onClick={scrollToGrid}
            className="text-[#143224] font-semibold border-b-2 border-[#183B2B] pb-1 cursor-pointer"
          >
            Live Spaces
          </button>
          <button 
            onClick={() => setIsAboutOpen(true)}
            className="text-stone-500 hover:text-stone-800 transition-colors cursor-pointer flex items-center space-x-1"
          >
            <span>About</span>
          </button>
        </nav>

        {/* Right Actions: Phone Button Removed, Operator Mode & Avatar Kept */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleOperator}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-all border cursor-pointer ${
              isOperatorOpen
                ? 'bg-[#183B2B] text-white border-[#183B2B] shadow-sm'
                : 'bg-white hover:bg-stone-50 text-stone-700 border-[#E2E1DC]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-stone-500" />
            <span>Operator Mode</span>
          </button>

          <div className="w-8 h-8 rounded-full bg-[#183B2B] text-white text-xs font-bold flex items-center justify-center">
            H
          </div>
        </div>
      </header>

      {/* About Architecture Modal */}
      {isAboutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-sm">
          <div className="bg-[#FAF9F5] border border-[#EAE9E4] rounded-3xl p-6 max-w-lg w-full shadow-2xl relative space-y-4">
            <button 
              onClick={() => setIsAboutOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 hover:bg-stone-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <BrandLogo size="sm" />

            <p className="text-xs text-stone-600 leading-relaxed font-sans pt-1">
              Bharat Occupancy ingests live turnstile gate telemetry events across high-capacity public spaces. By executing continuous dampening algorithms on incoming sensor events, it projects 30- and 60-minute congestion trends to avoid choke points before crowds build up.
            </p>

            <div className="grid grid-cols-3 gap-2.5 pt-2">
              <div className="bg-white p-3 rounded-xl border border-[#EAE9E4] text-center">
                <Cpu className="w-4 h-4 mx-auto text-[#183B2B] mb-1" />
                <div className="text-xs font-bold text-stone-800">Spring Boot</div>
                <div className="text-[10px] text-stone-400">Core Engine</div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#EAE9E4] text-center">
                <Database className="w-4 h-4 mx-auto text-sky-600 mb-1" />
                <div className="text-xs font-bold text-stone-800">AWS Gateway</div>
                <div className="text-[10px] text-stone-400">Serverless Edge</div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-[#EAE9E4] text-center">
                <Activity className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
                <div className="text-xs font-bold text-stone-800">React + Vite</div>
                <div className="text-[10px] text-stone-400">Telemetry UI</div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#ECEBE6] flex items-center justify-between text-xs text-stone-500">
              <div>
                <span className="font-medium">Designed & Engineered by</span>
                <div className="font-semibold text-[#183B2B] mt-0.5">Harshit Kumar Singh</div>
              </div>

              <div 
                onClick={copyNumber}
                className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-full border border-[#EAE9E4] cursor-pointer hover:border-stone-400 transition-colors shadow-2xs"
                title="Click to copy number"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-700" />
                <span className="font-mono font-medium text-[#171918]">{myPhoneNumber}</span>
                {copied ? (
                  <Check className="w-3 h-3 text-emerald-600" />
                ) : (
                  <Copy className="w-3 h-3 text-stone-400" />
                )}
              </div>
            </div>

            <button
              onClick={() => setIsAboutOpen(false)}
              className="w-full py-2.5 rounded-full bg-[#183B2B] hover:bg-[#132E27] text-white font-semibold text-xs transition-colors mt-2 cursor-pointer"
            >
              Back to Live Spaces
            </button>
          </div>
        </div>
      )}
    </>
  );
}