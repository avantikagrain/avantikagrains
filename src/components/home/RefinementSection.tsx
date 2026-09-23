"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Sparkles, ShieldCheck, Target, ArrowDown } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function RefinementSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleBlockRef = useRef<HTMLDivElement>(null);
  const imageWrapperRef = useRef<HTMLDivElement>(null);
  const imageInnerRef = useRef<HTMLDivElement>(null);
  const subtitleBlockRef = useRef<HTMLDivElement>(null);
  const pillarsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const ctx = gsap.context(() => {
      if (prefersReducedMotion) {
        gsap.set(
          [
            titleBlockRef.current,
            imageWrapperRef.current,
            subtitleBlockRef.current,
            pillarsRef.current,
          ],
          { autoAlpha: 1, y: 0 }
        );
        return;
      }

      // 1. Entrance Staged Reveal Timeline
      const revealTl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
          toggleActions: "play none none reverse",
        },
        defaults: { ease: "power3.out" },
      });

      // Stage 1: Main Headline reveals
      revealTl
        .fromTo(
          titleBlockRef.current,
          { autoAlpha: 0, y: 30 },
          { autoAlpha: 1, y: 0, duration: 1.0 }
        )
        // Stage 3: Grain Visual gradually reveals
        .fromTo(
          imageWrapperRef.current,
          { autoAlpha: 0, scale: 0.96, y: 30 },
          { autoAlpha: 1, scale: 1, y: 0, duration: 1.1, ease: "power2.out" },
          "-=0.6"
        )
        // Stage 4: Second statement reveals
        .fromTo(
          subtitleBlockRef.current,
          { autoAlpha: 0, y: 25 },
          { autoAlpha: 1, y: 0, duration: 0.9 },
          "-=0.6"
        )
        // Stage 5: Pillars & Transition indicator reveal
        .fromTo(
          pillarsRef.current,
          { autoAlpha: 0, y: 20 },
          { autoAlpha: 1, y: 0, duration: 0.8 },
          "-=0.5"
        );

      // 2. Parallax and gentle scale effect on the grain image (1 -> 1.04)
      if (imageInnerRef.current && sectionRef.current) {
        gsap.fromTo(
          imageInnerRef.current,
          { yPercent: -4, scale: 1.0 },
          {
            yPercent: 4,
            scale: 1.04,
            ease: "none",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.2,
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="refinement"
      data-header-theme="light"
      className="relative bg-[#FAF7F2] text-brand-charcoal overflow-hidden border-t border-[#EAE3D2] transition-colors duration-500"
    >
      {/* Delicate background ambient radiance matching brand palette */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[42rem] h-[42rem] bg-gradient-to-br from-brand-wheat/15 via-brand-gold/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-brand-gold/5 rounded-full blur-2xl pointer-events-none" />

        {/* Main Container */}
      <div className="container mx-auto px-6 md:px-12 lg:px-16 pt-16 md:pt-24 pb-10 md:pb-12 relative z-10">

        {/* 
          Sophisticated Editorial Layout:
          Desktop (lg): Split 2-column composition with Image Card spanning rows.
          Mobile (<lg): Exact requested sequence:
            1. 04 / REFINE
            2. WE DON'T JUST MILL GRAINS.
            3. [GRAIN IMAGE]
            4. WE REFINE WHAT GOES INTO EVERY PRODUCT.
            5. PRECISION • PURITY • CONSISTENCY
        */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          
          {/* 1. Primary Dominant Statement & Supporting Line (order-1, lg:col-span-7) */}
          <div
            ref={titleBlockRef}
            className="order-1 lg:order-1 lg:col-span-7 flex flex-col justify-center"
          >
            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-[4.25rem] text-brand-charcoal leading-[1.08] tracking-tight font-normal mb-6">
              WE DON&apos;T JUST <br />
              MILL GRAINS.
            </h2>

            <div className="flex items-center gap-4">
              <div className="w-12 h-[1px] bg-brand-gold" />
              <p className="text-xs md:text-sm uppercase tracking-[0.2em] text-brand-charcoal/70 font-sans font-medium">
                Every stage matters. Every grain has a purpose.
              </p>
            </div>
          </div>

          {/* 2. Premium Macro Grain Visual (order-2 on mobile, right column spanning rows on desktop) */}
          <div
            ref={imageWrapperRef}
            className="order-2 lg:order-2 lg:col-span-5 lg:row-span-3 flex flex-col items-center lg:items-end w-full"
          >
            <div className="w-full max-w-md lg:max-w-none relative group">
              {/* Outer Decorative Editorial Frame */}
              <div className="relative overflow-hidden rounded-sm border border-brand-wheat/60 bg-[#F4EFE6] shadow-[0_20px_50px_-15px_rgba(40,30,15,0.08)]">
                
                {/* Image Frame with Parallax Container */}
                <div className="relative aspect-[4/3] sm:aspect-[5/4] lg:aspect-[4/3] w-full overflow-hidden">
                  <div
                    ref={imageInnerRef}
                    className="relative w-full h-full will-change-transform scale-100"
                  >
                    <Image
                      src="/images/refinement-grain.jpg"
                      alt="Refined Heritage Wheat & Cleaned Grains - Avantika Macro Photography"
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
                      className="object-cover object-center"
                      priority
                      unoptimized
                    />
                  </div>
                  
                  {/* Subtle editorial warm gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-charcoal/30 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Editorial Caption Bar beneath photograph */}
                <div className="px-4 sm:px-5 py-3.5 bg-brand-cream/80 border-t border-brand-wheat/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-gold" />
                    <span className="text-[10px] tracking-[0.2em] uppercase font-mono text-brand-charcoal/70">
                      FIG. 04 — GRAIN REFINEMENT
                    </span>
                  </div>
                  <span className="text-[10px] tracking-[0.16em] uppercase font-mono text-brand-charcoal/50">
                    99.98% PURITY BENCHMARK
                  </span>
                </div>
              </div>

              {/* Corner Editorial Geometry Accent */}
              <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-brand-gold/60 pointer-events-none" />
              <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-brand-gold/60 pointer-events-none" />
            </div>
          </div>

          {/* 3. Secondary Statement (order-3 on mobile, left column below title on desktop) */}
          <div
            ref={subtitleBlockRef}
            className="order-3 lg:order-3 lg:col-span-7 relative pl-6 md:pl-8 border-l-2 border-brand-gold/60 max-w-2xl"
          >
            <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-[2.6rem] text-brand-gold font-normal leading-[1.18] tracking-tight">
              WE REFINE WHAT GOES INTO EVERY PRODUCT.
            </h3>
          </div>

          {/* 4. Editorial Core Pillars (order-4 on mobile, left column below subtitle on desktop) */}
          <div
            ref={pillarsRef}
            className="order-4 lg:order-4 lg:col-span-7 pt-6 border-t border-brand-wheat/40 grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-4 max-w-xl"
          >
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-brand-gold mb-1">
                <Target className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-brand-charcoal">
                  Precision
                </span>
              </div>
              <span className="text-[11px] text-brand-charcoal/60 leading-normal">
                Micron particle sizing &amp; balanced moisture
              </span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-brand-gold mb-1">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-brand-charcoal">
                  Purity
                </span>
              </div>
              <span className="text-[11px] text-brand-charcoal/60 leading-normal">
                99.98% optical grading &amp; intact nutrition
              </span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-brand-gold mb-1">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-brand-charcoal">
                  Consistency
                </span>
              </div>
              <span className="text-[11px] text-brand-charcoal/60 leading-normal">
                Batch-to-batch structural integrity
              </span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
