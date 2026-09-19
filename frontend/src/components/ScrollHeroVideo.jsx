import React, { useEffect, useState, useRef } from 'react';
import { ChevronDown, ArrowUpRight } from 'lucide-react';

export default function ScrollHeroVideo() {
  const [slide, setSlide] = useState(0); // 0 = Mall, 1 = Gym, 2 = Dashboard active
  const isAnimating = useRef(false);

  const mallVideoRef = useRef(null);
  const gymVideoRef = useRef(null);

  // Synchronize playback: only decode and run the visible slide's video
  useEffect(() => {
    if (slide === 0) {
      if (mallVideoRef.current) mallVideoRef.current.play().catch(() => {});
      if (gymVideoRef.current) gymVideoRef.current.pause();
    } else if (slide === 1) {
      if (gymVideoRef.current) gymVideoRef.current.play().catch(() => {});
      if (mallVideoRef.current) mallVideoRef.current.pause();
    } else {
      // At Dashboard: pause both background decoders completely
      if (mallVideoRef.current) mallVideoRef.current.pause();
      if (gymVideoRef.current) gymVideoRef.current.pause();
    }
  }, [slide]);

  // Keep scroll locked strictly during Hero presentation (slide 0 or 1)
  useEffect(() => {
    if (slide < 2) {
      document.body.style.overflow = 'hidden';
      window.scrollTo(0, 0);
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [slide]);

  const advanceSlide = () => {
    if (isAnimating.current) return;
    isAnimating.current = true;

    setSlide((prev) => {
      const next = Math.min(2, prev + 1);
      setTimeout(() => {
        isAnimating.current = false;
      }, 750);
      return next;
    });
  };

  const reverseSlide = () => {
    if (isAnimating.current) return;
    isAnimating.current = true;

    setSlide((prev) => {
      const next = Math.max(0, prev - 1);
      setTimeout(() => {
        isAnimating.current = false;
      }, 750);
      return next;
    });
  };

  useEffect(() => {
    const handleWheel = (e) => {
      if (slide === 2) {
        if (window.scrollY <= 5 && e.deltaY < -25 && !isAnimating.current) {
          e.preventDefault();
          reverseSlide();
        }
        return;
      }

      if (isAnimating.current) return;

      if (e.deltaY > 20) {
        advanceSlide();
      } else if (e.deltaY < -20 && slide > 0) {
        reverseSlide();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [slide]);

  return (
    <div
      className={`fixed inset-0 z-50 w-full h-full overflow-hidden select-none transition-all duration-700 ${
        slide === 2 ? 'pointer-events-none opacity-0' : 'pointer-events-auto opacity-100 bg-slate-950'
      }`}
    >
      {/* =========================================================
          FRAME 2: GYM CARD (Revealed when Mall glides up)
          ========================================================= */}
      <div
        className="absolute inset-0 w-full h-full flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-2xl shadow-black z-10 will-change-transform"
        style={{
          transform: slide >= 2 ? 'translateY(-105%) scale(0.96)' : 'translateY(0%) scale(1)',
          borderRadius: slide >= 2 ? '3rem' : '0rem',
          overflow: 'hidden',
          opacity: slide === 0 ? 0 : 1,
          pointerEvents: slide === 1 ? 'auto' : 'none',
        }}
      >
        <video
          ref={gymVideoRef}
          src="/videos/crowd-gym.mp4"
          loop
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          className="absolute inset-0 w-full h-full object-cover brightness-[0.65] contrast-[1.08] scale-105 pointer-events-none"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-slate-950/80 pointer-events-none" />

        <div className="relative z-10 max-w-5xl px-6 text-center space-y-7 pointer-events-none">
          <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.12] backdrop-blur-xl shadow-2xl">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono tracking-[0.25em] text-white/90 uppercase font-semibold">
              Predictive Saturation
            </span>
          </div>

          <div className="space-y-3">
            <h1 className="text-5xl sm:text-7xl font-serif font-light text-white tracking-tight leading-[1.12]">
              <span className="inline-block mr-1">W</span>hat if you knew <br />
              <span className="italic font-normal text-[#FFF2E0]">before you even stepped out?</span>
            </h1>
          </div>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 font-light tracking-wide leading-relaxed drop-shadow">
            Avoid waiting in turnstile lines and packed facilities with continuous 60-minute predictive footfall intelligence.
          </p>
        </div>

        <button
          onClick={advanceSlide}
          className="absolute bottom-10 flex items-center space-x-2 px-5 py-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/15 text-white text-xs font-semibold backdrop-blur-md transition-all cursor-pointer group shadow-2xl"
        >
          <span>Enter Live Platform</span>
          <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-emerald-400" />
        </button>
      </div>

      {/* =========================================================
          FRAME 1: MALL CARD (Visible on slide 0, slides up on slide 1)
          ========================================================= */}
      <div
        className="absolute inset-0 w-full h-full flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-2xl shadow-black z-20 will-change-transform"
        style={{
          transform: slide >= 1 ? 'translateY(-105%) scale(0.96)' : 'translateY(0%) scale(1)',
          borderRadius: slide >= 1 ? '3rem' : '0rem',
          overflow: 'hidden',
          pointerEvents: slide === 0 ? 'auto' : 'none',
        }}
      >
        <video
          ref={mallVideoRef}
          src="/videos/crowd-mall.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          className="absolute inset-0 w-full h-full object-cover brightness-[0.65] contrast-[1.08] scale-105 pointer-events-none"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-slate-950/80 pointer-events-none" />

        <div className="relative z-10 max-w-5xl px-6 text-center space-y-7 pointer-events-none">
          <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.12] backdrop-blur-xl shadow-2xl">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
            <span className="text-[11px] font-mono tracking-[0.25em] text-white/90 uppercase font-semibold">
              Real-Time Telemetry
            </span>
          </div>

          <div className="space-y-3">
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-serif font-normal tracking-tight text-white drop-shadow-2xl">
              Do you ever wonder?
            </h1>
            <h2 className="text-4xl sm:text-6xl md:text-7xl font-serif italic font-light text-slate-200 drop-shadow-xl">
              “How crowded is it right now?”
            </h2>
          </div>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-300 font-light tracking-wide leading-relaxed drop-shadow">
            Shopping malls, transit hubs, gyms, and campus facilities reach critical choke points in minutes.
          </p>
        </div>

        <button
          onClick={advanceSlide}
          className="absolute bottom-10 flex flex-col items-center space-y-2 text-slate-400 hover:text-white transition-colors cursor-pointer group"
        >
          <span className="text-[10px] uppercase font-mono tracking-[0.25em] font-semibold">
            Scroll or Click to Advance
          </span>
          <ChevronDown className="w-4 h-4 animate-bounce text-slate-300" />
        </button>
      </div>
    </div>
  );
}