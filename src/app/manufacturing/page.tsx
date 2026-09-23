"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { AnimatedText } from "@/components/shared/AnimatedText";

gsap.registerPlugin(ScrollTrigger);

const manufacturingSteps = [
  {
    title: "RAW GRAIN",
    desc: "We source only the finest wheat, maintaining strict quality parameters right from the farm.",
    image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?q=80&w=1600&auto=format&fit=crop"
  },
  {
    title: "CLEANING",
    desc: "Advanced multi-stage optical sorting and cleaning to remove all impurities.",
    image: "https://images.unsplash.com/photo-1611145112521-996ff64ec2db?q=80&w=1600&auto=format&fit=crop"
  },
  {
    title: "MILLING",
    desc: "State-of-the-art European milling machinery ensures consistent granulation.",
    image: "https://images.unsplash.com/photo-1563823293427-e4359695d5be?q=80&w=1600&auto=format&fit=crop"
  },
  {
    title: "QUALITY LAB",
    desc: "Rigorous hourly testing for moisture, protein, ash, and gluten content.",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1600&auto=format&fit=crop"
  },
  {
    title: "PACKAGING",
    desc: "Fully automated, hygienic packaging lines to preserve freshness.",
    image: "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?q=80&w=1600&auto=format&fit=crop"
  },
  {
    title: "DISPATCH",
    desc: "Efficient supply chain ensuring timely delivery worldwide.",
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1600&auto=format&fit=crop"
  }
];

export default function ManufacturingPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // We could add GSAP pinning here for the cinematic factory scroll experience
    const ctx = gsap.context(() => {
      const sections = gsap.utils.toArray(".factory-section");
      
      sections.forEach((section: any) => {
        const image = section.querySelector(".factory-image");
        const text = section.querySelector(".factory-text");
        
        gsap.fromTo(image, 
          { scale: 1.1, opacity: 0.5 },
          {
            scale: 1,
            opacity: 1,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top center",
              end: "bottom center",
              scrub: true,
            }
          }
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div data-header-theme="dark" className="bg-brand-charcoal min-h-screen text-brand-ivory" ref={containerRef}>
      {/* Header */}
      <header className="pt-48 pb-32 px-6 md:px-12 text-center max-w-4xl mx-auto">
        <h1 className="font-serif text-5xl md:text-7xl font-bold tracking-tight mb-8">
          <AnimatedText text="MODERN PRECISION." />
        </h1>
        <p className="text-brand-ivory/70 text-xl font-light leading-relaxed">
          Our facility combines traditional milling wisdom with advanced European automation. Experience the journey of our grains through our state-of-the-art factory.
        </p>
      </header>

      {/* Cinematic Factory Scroll */}
      <div className="flex flex-col w-full">
        {manufacturingSteps.map((step, idx) => (
          <section key={idx} className="factory-section relative h-screen w-full flex items-center justify-center overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              <div className="absolute inset-0 bg-brand-charcoal/60 z-10" />
              <div 
                className="factory-image w-full h-full bg-cover bg-center"
                style={{ backgroundImage: `url(${step.image})` }}
              />
            </div>

            {/* Content */}
            <div className="relative z-20 container mx-auto px-6 md:px-12 flex flex-col items-center text-center">
              <span className="text-brand-gold font-serif text-2xl md:text-3xl tracking-widest uppercase mb-4">
                Step 0{idx + 1}
              </span>
              <h2 className="factory-text font-serif text-5xl md:text-7xl uppercase tracking-wider mb-6">
                {step.title}
              </h2>
              <p className="text-brand-ivory/80 text-xl md:text-2xl font-light max-w-2xl">
                {step.desc}
              </p>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
