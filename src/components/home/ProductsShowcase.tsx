"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  ArrowRight, 
  Sprout, 
  Leaf, 
  ShieldCheck, 
  Zap, 
  Heart, 
  Wheat, 
  WheatOff, 
  Sparkles,
  Award,
  Globe,
  Users
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { products } from "@/data/products";
import { formatCurrency } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

// Icon mapping matching the editorial reference design
const categoryIcons: Record<string, any> = {
  "Ancient Grain": Sprout,
  "Plant Protein": Leaf,
  "Gluten Free": WheatOff,
  "Good Fiber": Wheat,
  "Natural Energy": Zap,
  "Smart Nutrition": Sparkles,
  "Heart Healthy": Heart,
  "Natural Goodness": ShieldCheck,
};

export function ProductsShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(() => {
    // Elegant stagger reveal of the product cards on scroll
    if (cardsRef.current.length > 0) {
      gsap.fromTo(
        cardsRef.current,
        { 
          opacity: 0, 
          y: 40,
          scale: 0.97
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 75%",
            toggleActions: "play none none none",
          },
        }
      );
    }
  }, { scope: containerRef });

  return (
    <section 
      id="products"
      ref={containerRef}
      data-header-theme="light" 
      className="pt-12 md:pt-16 pb-24 md:pb-32 bg-[#FAF7F2] text-brand-charcoal overflow-hidden relative border-t border-[#EAE3D2]"
    >
      {/* Background delicate wheat botanical accents */}
      <div className="absolute top-0 right-0 w-[32rem] h-[32rem] bg-radial from-brand-wheat/20 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-radial from-brand-gold/10 to-transparent blur-3xl pointer-events-none" />

      {/* Section Header: Matching the Luxury Editorial Layout */}
      <div className="container mx-auto px-6 md:px-12 mb-16 md:mb-20">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
          {/* Left Column: Title & Heritage Subtitle */}
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-gold" />
              <span className="text-brand-gold font-serif text-xs md:text-sm uppercase tracking-[0.25em] font-semibold">
                OUR GRAINS
              </span>
            </div>

            <h2 className="font-serif text-5xl md:text-7xl font-normal text-brand-charcoal tracking-tight leading-[1.05] mb-4">
              Avantika <span className="italic font-normal">Grains</span>
            </h2>

            <div className="flex items-center gap-4">
              <div className="w-12 h-[1px] bg-brand-gold" />
              <span className="text-xs md:text-sm uppercase tracking-[0.2em] text-brand-charcoal/70 font-medium">
                ANCIENT GRAINS. A HEALTHIER TOMORROW.
              </span>
            </div>
          </div>

          {/* Right Column: Editorial Paragraph & Explore Button */}
          <div className="max-w-xl flex flex-col items-start lg:items-end text-left lg:text-right">
            <h3 className="font-serif text-xl md:text-2xl text-brand-charcoal mb-3 leading-snug">
              Wholesome grains for a stronger, healthier world.
            </h3>
            <p className="text-sm md:text-base text-brand-charcoal/70 font-light leading-relaxed mb-6">
              At Avantika, we bring you a thoughtfully selected range of grains, combining tradition with modern milling excellence. Nourishing people. Supporting industries. Building a better tomorrow.
            </p>

            <div className="flex items-center gap-6">
              <span className="hidden sm:inline font-serif italic text-brand-gold/80 text-sm">
                Goodness in every grain ↗
              </span>
              <Link 
                href="/products"
                className="group inline-flex items-center gap-3 px-6 py-3 rounded-full bg-brand-charcoal text-[#FAF7F2] text-xs uppercase tracking-widest font-medium hover:bg-brand-gold hover:text-brand-charcoal transition-all duration-300 shadow-md"
              >
                <span>Explore Our Grains</span>
                <span className="w-6 h-6 rounded-full bg-white/20 group-hover:bg-brand-charcoal/20 flex items-center justify-center transition-colors">
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 8-Card Editorial Luxury Catalogue Grid */}
      <div className="container mx-auto px-6 md:px-12 mb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-7">
          {products.filter(p => p.mainCategory === 'Grains').slice(0, 8).map((product, index) => {
            const IconComponent = categoryIcons[product.category] || Sprout;

            return (
              <div
                key={product.id}
                ref={(el) => {
                  cardsRef.current[index] = el;
                }}
                className="bg-[#FCFAF6] border border-[#E9E1D2] hover:border-brand-gold/70 rounded-2xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_16px_36px_-8px_rgba(0,0,0,0.12)] hover:-translate-y-1.5 transition-all duration-500 flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Subtle Card Ambient Glow on Hover */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-wheat/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {/* Top Row: Number Badge + Benefit Badge */}
                <div className="flex items-center justify-between mb-5 relative z-10">
                  <span className="px-3 py-1 bg-white/80 border border-[#E2D8C3] rounded-full text-xs font-serif font-semibold text-brand-charcoal/80">
                    {product.number}
                  </span>

                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-gold/10 border border-brand-gold/20 text-[10px] font-medium tracking-wider text-brand-charcoal/80 uppercase">
                    <IconComponent className="w-3 h-3 text-brand-gold" />
                    <span>{product.category}</span>
                  </div>
                </div>

                {/* Center Image Container with Studio Grain Photography */}
                <Link 
                  href={`/products/${product.slug}`}
                  className="block relative aspect-[4/3] rounded-xl overflow-hidden mb-6 bg-stone-100 border border-black/5"
                >
                  <Image
                    src={product.image}
                    alt={`${product.name} - Avantika Grain Mills`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                    priority={index < 4}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Link>

                {/* Bottom Info: Title, Subtitle, & View Details Button */}
                <div className="flex flex-col flex-1 justify-between relative z-10">
                  <div>
                    <h4 className="font-serif text-2xl text-brand-charcoal font-semibold tracking-tight mb-1 group-hover:text-brand-gold transition-colors duration-300">
                      {product.name}
                      {product.localName && (
                        <span className="font-serif font-normal text-base text-brand-charcoal/60 ml-2 italic">
                          ({product.localName})
                        </span>
                      )}
                    </h4>

                    <div className="flex items-end gap-2 mb-3">
                      <span className="text-xl font-serif text-brand-charcoal font-bold">
                        {formatCurrency(product.price || 0, product.currency)}
                      </span>
                      {product.packSize && (
                        <span className="text-brand-charcoal/60 text-xs font-medium pb-[2px]">
                          / {product.packSize}
                        </span>
                      )}
                    </div>

                    <p className="text-xs md:text-sm text-brand-charcoal/70 font-light line-clamp-2 leading-relaxed mb-6">
                      {product.desc}
                    </p>
                  </div>

                  <Link
                    href={`/products/${product.slug}`}
                    className="w-full py-2.5 px-4 rounded-full border border-brand-charcoal/20 group-hover:border-brand-gold group-hover:bg-brand-gold group-hover:text-brand-charcoal text-brand-charcoal/80 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 mt-auto"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Editorial Bottom Strip: Grains Today + Trust Pillars */}
      <div className="container mx-auto px-6 md:px-12 pt-8 border-t border-[#EAE3D2]">
        {/* Banner Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-12">
          <div className="text-center sm:text-left">
            <span className="font-serif text-sm md:text-base tracking-[0.25em] text-brand-charcoal/80 uppercase font-semibold">
              GRAINS TODAY. A HEALTHIER TOMORROW.
            </span>
          </div>

          <Link
            href="/contact"
            className="group inline-flex items-center gap-3 px-6 py-3 rounded-full bg-transparent border border-brand-charcoal/30 hover:border-brand-charcoal hover:bg-brand-charcoal hover:text-white text-brand-charcoal text-xs uppercase tracking-widest font-medium transition-all duration-300"
          >
            <span>Let&apos;s Build Together</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 4 Brand Pillars Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-[#EAE3D2]/70">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-brand-gold/15 flex items-center justify-center text-brand-gold">
              <Leaf className="w-4 h-4" />
            </span>
            <div>
              <h5 className="font-serif text-xs font-semibold uppercase tracking-wider text-brand-charcoal">
                Natural Goodness
              </h5>
              <p className="text-[11px] text-brand-charcoal/60 font-light">
                100% pure & unadulterated
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-brand-gold/15 flex items-center justify-center text-brand-gold">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div>
              <h5 className="font-serif text-xs font-semibold uppercase tracking-wider text-brand-charcoal">
                Trusted Quality
              </h5>
              <p className="text-[11px] text-brand-charcoal/60 font-light">
                Certified lab-tested grains
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-brand-gold/15 flex items-center justify-center text-brand-gold">
              <Users className="w-4 h-4" />
            </span>
            <div>
              <h5 className="font-serif text-xs font-semibold uppercase tracking-wider text-brand-charcoal">
                For A Healthier World
              </h5>
              <p className="text-[11px] text-brand-charcoal/60 font-light">
                Nourishing communities
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-brand-gold/15 flex items-center justify-center text-brand-gold">
              <Globe className="w-4 h-4" />
            </span>
            <div>
              <h5 className="font-serif text-xs font-semibold uppercase tracking-wider text-brand-charcoal">
                Supporting Industries
              </h5>
              <p className="text-[11px] text-brand-charcoal/60 font-light">
                Global bulk grain supply
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
