"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import Link from "next/link";
import { GrainParticles } from "@/components/shared/GrainParticles";

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const grainOverlayRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Respect user's motion preferences
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const prefersReduced = mediaQuery.matches;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      if (prefersReduced) {
        // Fallback for reduced motion
        tl.to(bgRef.current, { autoAlpha: 1, duration: 1 })
          .to(titleRef.current, { autoAlpha: 1, duration: 1 }, "-=0.5")
          .to(subtitleRef.current, { autoAlpha: 1, duration: 1 }, "-=0.5")
          .to(ctaRef.current, { autoAlpha: 1, duration: 1 }, "-=0.5");
        return;
      }

      // Cinematic sequence
      tl.set(grainOverlayRef.current, { autoAlpha: 0, scale: 0.8 })
        .set(bgRef.current, { autoAlpha: 0, scale: 1.1 })
        .set(titleRef.current, { autoAlpha: 0, y: 50 })
        .set(subtitleRef.current, { autoAlpha: 0, y: 30 })
        .set(ctaRef.current, { autoAlpha: 0, y: 20 })

        // 1. Single grain / particles appear
        .to(grainOverlayRef.current, { autoAlpha: 1, scale: 1, duration: 3, ease: "power2.out" })
        
        // 2. Background (Milling visual) fades in, representing depth
        .to(bgRef.current, { autoAlpha: 1, scale: 1, duration: 4, ease: "power2.out" }, "-=1.5")
        
        // 3. AVANTIKA appears
        .to(titleRef.current, { autoAlpha: 1, y: 0, duration: 2 }, "-=2")
        
        // 4. Headline reveals
        .to(subtitleRef.current, { autoAlpha: 1, y: 0, duration: 1.5 }, "-=1.5")
        
        // 5. CTAs reveal
        .to(ctaRef.current, { autoAlpha: 1, y: 0, duration: 1 }, "-=1");

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={containerRef}
      data-header-theme="dark"
      className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-brand-charcoal"
    >
      {/* Cinematic Grain Particles Overlay */}
      <div ref={grainOverlayRef} className="absolute inset-0 z-20 pointer-events-none">
        <GrainParticles density={60} />
      </div>

      {/* Background Factory / Milling Visual */}
      <div ref={bgRef} className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-charcoal/80 via-brand-charcoal/50 to-brand-charcoal/90 z-10" />
        <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?q=80&w=3000&auto=format&fit=crop')] bg-cover bg-center" />
      </div>

      {/* Content */}
      <div className="relative z-30 text-center px-4 flex flex-col items-center">
        <h1
          ref={titleRef}
          className="font-serif text-6xl md:text-8xl lg:text-[10rem] text-brand-ivory font-bold tracking-widest uppercase mb-8"
        >
          Avantika
        </h1>
        
        <div ref={subtitleRef} className="flex flex-col items-center mb-12">
          <h3 className="text-2xl md:text-4xl text-brand-gold font-serif tracking-wide mb-2">
            Premium grains.
          </h3>
          <h3 className="text-2xl md:text-4xl text-brand-ivory font-serif tracking-wide">
            Precisely refined.
          </h3>
        </div>
        
        <div ref={ctaRef} className="flex flex-col sm:flex-row gap-6">
          <Link
            href="/products"
            className="px-8 py-4 bg-brand-gold text-brand-charcoal font-medium uppercase tracking-wider hover:bg-brand-ivory transition-colors"
          >
            Explore Products
          </Link>
          <Link
            href="/manufacturing"
            className="px-8 py-4 border border-brand-ivory text-brand-ivory font-medium uppercase tracking-wider hover:bg-brand-ivory hover:text-brand-charcoal transition-colors"
          >
            Discover Our Journey
          </Link>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 animate-bounce">
        <span className="text-brand-ivory/70 text-xs tracking-widest uppercase">Scroll to explore</span>
        <div className="w-[1px] h-12 bg-brand-gold/70" />
      </div>
    </section>
  );
}
