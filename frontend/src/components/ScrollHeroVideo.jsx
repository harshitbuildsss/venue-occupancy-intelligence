import React, { useEffect, useState, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

export default function ScrollHeroVideo() {
  // 0 = Mall, 1 = Gym, 2 = Brand Reveal, 3 = Dashboard Active
  const [slide, setSlide] = useState(0);
  const [showClickPrompt, setShowClickPrompt] = useState(false);
  const isAnimating = useRef(false);

  const mallVideoRef = useRef(null);
  const gymVideoRef = useRef(null);
  const pauseTimerRef = useRef(null);

  // =======================================================
  // PRELOAD + WARM BOTH VIDEO DECODERS
  // =======================================================
  useEffect(() => {
    const mall = mallVideoRef.current;
    const gym = gymVideoRef.current;

    if (!mall || !gym) return;

    // Explicitly tell the browser these are important resources.
    mall.preload = 'auto';
    gym.preload = 'auto';

    // Start loading both immediately.
    mall.load();
    gym.load();

    // Start the first video immediately.
    mall.play().catch(() => {});

    return () => {
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
      }
    };
  }, []);

  // =======================================================
  // VIDEO PLAYBACK / DECODER SYNC
  // =======================================================
  useEffect(() => {
    const mall = mallVideoRef.current;
    const gym = gymVideoRef.current;

    if (!mall || !gym) return;

    // Cancel any delayed pause from the previous transition.
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
    }

    if (slide === 0) {
      mall.play().catch(() => {});
      gym.pause();

    } else if (slide === 1) {
      gym.play().catch(() => {});
      
      // Keep mall alive briefly during the visual transition.
      pauseTimerRef.current = setTimeout(() => {
        mall.pause();
      }, 750);

    } else {
      // Brand reveal / dashboard.
      // Let the active video finish transitioning away before stopping it.
      pauseTimerRef.current = setTimeout(() => {
        mall.pause();
        gym.pause();
      }, 750);
    }

    return () => {
      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
      }
    };
  }, [slide]);

  // =======================================================
  // 3-SECOND DELAY FOR BLINKING PROMPT
  // =======================================================
  useEffect(() => {
    let timer;

    if (slide === 2) {
      timer = setTimeout(() => {
        setShowClickPrompt(true);
      }, 3000);
    } else {
      setShowClickPrompt(false);
    }

    return () => clearTimeout(timer);
  }, [slide]);

  // =======================================================
  // STRICT-MODE PROOF GHOST LOCK
  // =======================================================
  useEffect(() => {
    if (slide < 3) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      window.scrollTo(0, 0);

    } else if (slide === 3) {
      const unlockTimer = setTimeout(() => {
        document.body.style.overflow = 'auto';
        document.documentElement.style.overflow = 'auto';
      }, 100);

      return () => clearTimeout(unlockTimer);
    }

    return () => {
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    };
  }, [slide]);

  // =======================================================
  // PREPARE THE NEXT VIDEO BEFORE TRANSITION
  // =======================================================
  const warmVideo = (video) => {
    if (!video) return;

    video.preload = 'auto';

    // If the browser hasn't loaded enough data yet,
    // explicitly ask it to continue loading.
    if (video.readyState < 3) {
      try {
        video.load();
      } catch {
        // Ignore browser-specific load errors.
      }
    }

    // Muted videos are allowed to autoplay in modern browsers.
    video.play().catch(() => {});
  };

  // =======================================================
  // ADVANCE SLIDE
  // =======================================================
  const advanceSlide = () => {
    if (isAnimating.current) return;

    isAnimating.current = true;

    // IMPORTANT:
    // Warm the next video BEFORE changing the slide.
    // This gives the browser a head start on buffering/decoding.
    if (slide === 0) {
      warmVideo(gymVideoRef.current);
    }

    setSlide((prev) => {
      const next = Math.min(3, prev + 1);

      setTimeout(() => {
        isAnimating.current = false;
      }, 700);

      return next;
    });
  };

  // =======================================================
  // REVERSE SLIDE
  // =======================================================
  const reverseSlide = () => {
    if (isAnimating.current || slide <= 0) return;

    isAnimating.current = true;

    // Warm mall before returning from gym.
    if (slide === 1) {
      warmVideo(mallVideoRef.current);
    }

    setSlide((prev) => {
      const next = Math.max(0, prev - 1);

      setTimeout(() => {
        isAnimating.current = false;
      }, 700);

      return next;
    });
  };

  // =======================================================
  // WHEEL / TRACKPAD CONTROL
  // =======================================================
  useEffect(() => {
    const handleWheel = (e) => {
      if (slide >= 3) return;

      if (isAnimating.current) return;

      // =======================================================
      // FINAL BRAND SLIDE:
      // ABSOLUTE SCROLL LOCK.
      // =======================================================
      if (slide === 2) {
        e.preventDefault();
        return;
      }

      if (e.deltaY > 20) {
        advanceSlide();
      } else if (e.deltaY < -20 && slide > 0) {
        reverseSlide();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [slide]);

  // Clean render once dashboard takes over
  if (slide === 3) return null;

  return (
    <div
      id="scroll-hero-wrapper"
      className="fixed inset-0 z-50 w-full h-full overflow-hidden select-none bg-[#F3F2EC]"
    >

      {/* =========================================================
          SLIDE 2: BRAND REVEAL
          ========================================================= */}
      <div
        onClick={advanceSlide}
        className="absolute inset-0 w-full h-full flex flex-col items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] bg-[#171918] z-10 will-change-transform overflow-hidden cursor-pointer"
        style={{
          transform:
            slide >= 3
              ? 'translateY(-105%) scale(0.96)'
              : 'translateY(0%) scale(1)',
          borderRadius: slide >= 3 ? '3rem' : '0rem',
          opacity: slide < 2 ? 0 : 1,
          pointerEvents: slide === 2 ? 'auto' : 'none',
        }}
      >

        {/* Blinking Call to Action */}
        <div
          className={`absolute top-[6%] sm:top-[4%] z-20 pointer-events-none transition-opacity duration-1000 ${
            showClickPrompt ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <span className="animate-pulse text-white/80 text-[10px] sm:text-[11px] font-mono tracking-[0.25em] uppercase font-bold whitespace-nowrap drop-shadow-md">
            Click anywhere to proceed to dashboard
          </span>
        </div>

        <img
          src="/brand-page.jpeg"
          alt="Bharat Occupancy Dashboard Overview"
          draggable="false"
          className="absolute inset-0 w-full h-full object-cover object-[center_20%] pointer-events-none select-none"
        />
      </div>

      {/* =========================================================
          SLIDE 1: GYM CARD
          ========================================================= */}
      <div
        className="absolute inset-0 w-full h-full flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-20 will-change-transform"
        style={{
          transform:
            slide >= 2
              ? 'translateY(-105%) scale(0.96)'
              : 'translateY(0%) scale(1)',
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
          autoPlay={false}
          preload="auto"
          disablePictureInPicture
          className="absolute inset-0 w-full h-full object-cover scale-105 pointer-events-none"
        />

        <div className="absolute inset-0 bg-black/10 backdrop-brightness-95 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50 pointer-events-none" />

        <div className="relative z-10 max-w-5xl px-6 text-center space-y-7 pointer-events-none">
          <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-black/40 border border-white/20 backdrop-blur-xl shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono tracking-[0.25em] text-white uppercase font-bold">
              Predictive Saturation
            </span>
          </div>

          <div className="space-y-3">
            <h1 className="text-5xl sm:text-7xl font-serif font-medium text-white tracking-tight leading-[1.12] drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]">
              <span className="inline-block mr-1">W</span>hat if you knew <br />
              <span className="italic font-light text-white/95">
                before you even stepped out?
              </span>
            </h1>
          </div>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-white/85 font-medium tracking-wide leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
            Avoid waiting in turnstile lines and packed facilities with continuous 60-minute predictive footfall intelligence.
          </p>
        </div>

        <button
          onClick={advanceSlide}
          className="absolute bottom-10 flex items-center space-x-2 px-6 py-3 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 text-white text-xs font-semibold backdrop-blur-md transition-all cursor-pointer group shadow-lg"
        >
          <span>Continue</span>
          <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform text-white" />
        </button>
      </div>

      {/* =========================================================
          SLIDE 0: MALL CARD
          ========================================================= */}
      <div
        className="absolute inset-0 w-full h-full flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-30 will-change-transform"
        style={{
          transform:
            slide >= 1
              ? 'translateY(-105%) scale(0.96)'
              : 'translateY(0%) scale(1)',
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
          className="absolute inset-0 w-full h-full object-cover scale-105 pointer-events-none"
        />

        <div className="absolute inset-0 bg-black/10 backdrop-brightness-95 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50 pointer-events-none" />

        <div className="relative z-10 max-w-5xl px-6 text-center space-y-7 pointer-events-none">
          <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-black/40 border border-white/20 backdrop-blur-xl shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono tracking-[0.25em] text-white uppercase font-bold">
              Real-Time Telemetry
            </span>
          </div>

          <div className="space-y-3">
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-serif font-medium tracking-tight text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]">
              Do you ever wonder?
            </h1>

            <h2 className="text-4xl sm:text-6xl md:text-7xl font-serif italic font-light text-white/95 drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]">
              “How crowded is it right now?”
            </h2>
          </div>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-white/85 font-medium tracking-wide leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
            Shopping malls, transit hubs, gyms, and campus facilities reach critical choke points in minutes.
          </p>
        </div>

        <button
          onClick={advanceSlide}
          className="absolute bottom-10 flex flex-col items-center space-y-2 text-white/90 hover:text-white transition-colors cursor-pointer group"
        >
          <span className="text-[10px] uppercase font-mono tracking-[0.25em] font-semibold px-3.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/15">
            Scroll or Click to Advance
          </span>

          <ChevronDown className="w-4 h-4 animate-bounce text-white drop-shadow" />
        </button>
      </div>

    </div>
  );
}