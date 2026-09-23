"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Sprout,
  Scan,
  Sparkles,
  Cog,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from "lucide-react";

const journeySteps = [
  {
    num: "01",
    title: "SOURCE",
    tagline: "Farm-to-Gate Traceability",
    desc: "Carefully selected heritage grains cultivated in partnership with certified agricultural cooperatives across fertile river basins.",
    specs: ["Single-Origin Batches", "Zero Synthetic Ripeners", "Direct Farm Contracts"],
    icon: Sprout,
    highlight: "Non-GMO Certified",
  },
  {
    num: "02",
    title: "SELECT",
    tagline: "Multi-Spectrum Optical Sorting",
    desc: "High-resolution trichromatic optical sorters analyze every individual kernel, ejecting any discolored, undersized, or damaged grains.",
    specs: ["99.98% Purity Threshold", "NIR Moisture Sensing", "Density Fractionation"],
    icon: Scan,
    highlight: "AI-Powered Optical Detection",
  },
  {
    num: "03",
    title: "CLEAN",
    tagline: "Multi-Stage De-Stoning & Scouring",
    desc: "Intensive multi-tier cleaning through pneumatic aspiration, magnetic separators, and gentle friction scourers to strip outer dust without nutrient loss.",
    specs: ["Triple Aspiration Columns", "Dry De-Stoning Modules", "Air Filtration Class 100"],
    icon: Sparkles,
    highlight: "Zero Chemical Washes",
  },
  {
    num: "04",
    title: "MILL",
    tagline: "Chilled Roller & Cold-Stone Reduction",
    desc: "Precision temperature-controlled milling prevents friction heat, preserving natural wheat germ oils, active enzymes, and dietary fiber.",
    specs: ["Controlled Micro-Passes", "Low-Temperature Grinding", "Intact Germ Fractions"],
    icon: Cog,
    highlight: "Cold-Milled Integrity",
  },
  {
    num: "05",
    title: "REFINE",
    tagline: "Laser Granulometry & Air Sifting",
    desc: "Laser diffraction monitors micron particle sizing in real-time, producing the exact silky granulation and absorption index required by master artisans.",
    specs: ["Dynamic Sieve Sifters", "Ash & Gluten Real-Time Benchmarks", "Hygienic Sealed Conveying"],
    icon: CheckCircle2,
    highlight: "Artisanal Consistency",
  },
];

const AUTO_PLAY_INTERVAL = 5000;
const TOTAL_STEPS = journeySteps.length;

export function GrainJourney() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  // Swipe / Drag state
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragDelta = useRef(0);

  // --- Navigation ---
  const nextStep = useCallback(() => {
    setActiveStep((prev) => (prev + 1) % TOTAL_STEPS);
    setProgress(0);
  }, []);

  const prevStep = useCallback(() => {
    setActiveStep((prev) => (prev - 1 + TOTAL_STEPS) % TOTAL_STEPS);
    setProgress(0);
  }, []);

  const goToStep = useCallback((index: number) => {
    setActiveStep(index);
    setProgress(0);
  }, []);

  // --- Autoplay ---
  useEffect(() => {
    if (isPaused) return;
    const stepInterval = 50;
    const increment = (stepInterval / AUTO_PLAY_INTERVAL) * 100;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          nextStep();
          return 0;
        }
        return prev + increment;
      });
    }, stepInterval);
    return () => clearInterval(interval);
  }, [isPaused, nextStep]);

  // --- Touch / Mouse Handlers ---
  const handleDragStart = (clientX: number) => {
    isDragging.current = true;
    dragStartX.current = clientX;
    dragDelta.current = 0;
    setIsPaused(true);
  };
  const handleDragMove = (clientX: number) => {
    if (!isDragging.current) return;
    dragDelta.current = clientX - dragStartX.current;
  };
  const handleDragEnd = () => {
    if (!isDragging.current) return;
    if (dragDelta.current > 50) prevStep();
    else if (dragDelta.current < -50) nextStep();
    isDragging.current = false;
    dragDelta.current = 0;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      setIsPaused(true);
      prevStep();
    } else if (e.key === "ArrowRight") {
      setIsPaused(true);
      nextStep();
    }
  };

  // --- 3D Calculations ---
  const getCardStyle = (index: number) => {
    let diff = index - activeStep;
    if (diff > TOTAL_STEPS / 2) diff -= TOTAL_STEPS;
    if (diff < -TOTAL_STEPS / 2) diff += TOTAL_STEPS;

    if (diff === 0) {
      return {
        transform: "translate(-50%, -50%) translateZ(0) rotateY(0deg) scale(1)",
        opacity: 1,
        zIndex: 20,
        pointerEvents: "auto" as const,
      };
    }
    if (diff === -1) {
      return {
        transform: "translate(-110%, -50%) translateZ(-150px) rotateY(15deg) scale(0.85)",
        opacity: 0.3,
        zIndex: 10,
        pointerEvents: "auto" as const,
        filter: "blur(4px)",
      };
    }
    if (diff === 1) {
      return {
        transform: "translate(10%, -50%) translateZ(-150px) rotateY(-15deg) scale(0.85)",
        opacity: 0.3,
        zIndex: 10,
        pointerEvents: "auto" as const,
        filter: "blur(4px)",
      };
    }
    
    // Distant cards
    return {
      transform: `translate(${diff < 0 ? "-150%" : "50%"}, -50%) translateZ(-300px) rotateY(${diff < 0 ? 30 : -30}deg) scale(0.6)`,
      opacity: 0,
      zIndex: 0,
      pointerEvents: "none" as const,
    };
  };

  return (
    <section 
      id="grain-journey" 
      className="relative w-full bg-[#0d0d0d] text-brand-ivory pt-8 lg:pt-12 pb-16 lg:pb-24 overflow-hidden border-t border-brand-charcoal/40 flex flex-col min-h-[calc(100vh-96px)]"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[1400px] flex flex-col flex-1 h-full">
        
        {/* HEADER */}
        <div className="mb-8 lg:mb-10 text-center flex flex-col items-center">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-brand-gold animate-pulse" />
            <span className="text-brand-gold font-serif text-sm tracking-[0.2em] uppercase">
              The Avantika Processing Standard
            </span>
          </div>
          <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight text-white leading-tight">
            FROM GRAIN TO <span className="font-serif italic text-brand-gold">GREATNESS.</span>
          </h2>
        </div>

        {/* 3D CAROUSEL CONTAINER */}
        <div className="relative w-full flex-1 min-h-[350px] perspective-[1200px] my-6 flex flex-col justify-center">
          
          {/* Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-brand-gold/10 rounded-full blur-[100px] pointer-events-none" />

          {/* Controls */}
          <button
            onClick={prevStep}
            className="absolute left-0 lg:-left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-[#161616]/80 backdrop-blur border border-white/10 hover:border-brand-gold/50 flex items-center justify-center text-white/70 hover:text-brand-gold transition-colors shadow-xl"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button
            onClick={nextStep}
            className="absolute right-0 lg:-right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-[#161616]/80 backdrop-blur border border-white/10 hover:border-brand-gold/50 flex items-center justify-center text-white/70 hover:text-brand-gold transition-colors shadow-xl"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Track */}
          <div 
            className="absolute inset-0 preserve-3d"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={(e) => {
              setIsPaused(false);
              handleDragEnd();
            }}
            onMouseDown={(e) => handleDragStart(e.clientX)}
            onMouseMove={(e) => handleDragMove(e.clientX)}
            onMouseUp={handleDragEnd}
            onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
            onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
            onTouchEnd={handleDragEnd}
          >
            {journeySteps.map((step, index) => {
              const isCurrent = index === activeStep;
              const style = getCardStyle(index);
              const Icon = step.icon;

              return (
                <div
                  key={step.num}
                  onClick={() => !isCurrent && goToStep(index)}
                  className="absolute top-1/2 left-1/2 w-full max-w-[340px] sm:max-w-[500px] lg:max-w-[650px] transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] cursor-pointer"
                  style={style}
                >
                  <div className={`w-full bg-[#161616]/95 backdrop-blur-xl border rounded-2xl overflow-hidden relative transition-all duration-500 ${isCurrent ? 'border-brand-gold/40 shadow-[0_20px_50px_rgba(0,0,0,0.8)] ring-1 ring-brand-gold/20' : 'border-white/10'}`}>
                    
                    {/* Watermark */}
                    <div className="absolute -bottom-8 -right-4 text-[8rem] sm:text-[12rem] font-serif font-bold text-white/[0.03] select-none pointer-events-none leading-none">
                      {step.num}
                    </div>

                    {/* Content (only visible if active to reduce clutter) */}
                    <div className={`p-6 sm:p-8 lg:p-10 transition-opacity duration-500 ${isCurrent ? 'opacity-100' : 'opacity-0'}`}>
                      
                      {/* Header */}
                      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 mb-6 relative z-10">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-brand-gold/15 border border-brand-gold/30 flex items-center justify-center text-brand-gold shrink-0">
                            <Icon className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="text-brand-gold text-xs tracking-widest uppercase font-mono font-semibold block mb-1">
                              Stage {step.num}
                            </span>
                            <span className="text-sm text-white/50 tracking-wide line-clamp-1">
                              {step.tagline}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] sm:text-xs uppercase tracking-wider px-3 py-1 rounded-full border border-brand-gold/30 bg-brand-gold/10 text-brand-gold shrink-0">
                          {step.highlight}
                        </span>
                      </div>

                      {/* Body */}
                      <div className="relative z-10 mb-8">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="w-8 h-[1px] bg-brand-gold/50" />
                          <span className="text-xs uppercase tracking-widest text-brand-gold/80 font-mono">
                            Step {step.num} of 05
                          </span>
                        </div>
                        <h3 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white mb-4 uppercase leading-none">
                          {step.title}
                        </h3>
                        <p className="text-base lg:text-lg text-white/70 font-light leading-relaxed">
                          {step.desc}
                        </p>
                      </div>

                      {/* Footer */}
                      <div className="relative z-10 pt-6 border-t border-white/10 flex flex-wrap gap-2 sm:gap-3">
                        {step.specs.map((spec, sIdx) => (
                          <span
                            key={sIdx}
                            className="text-xs lg:text-sm tracking-wide px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-white/5 border border-white/10 text-white/80 flex items-center gap-2"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-gold shrink-0" />
                            {spec}
                          </span>
                        ))}
                      </div>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
