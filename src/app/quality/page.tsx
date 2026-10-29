import { AnimatedText } from "@/components/shared/AnimatedText";

const qualitySteps = [
  {
    title: "RAW MATERIAL INSPECTION",
    description: "Every crop shipment arriving from partner regional farms across Madhya Pradesh undergoes comprehensive physical and moisture sampling to verify grain purity, kernel integrity, and standard test weight."
  },
  {
    title: "CLEANING & SORTING",
    description: "Multi-tier pneumatic pre-cleaners, precision gravity separators, and high-resolution optical color sorters remove foreign matter, husk, chaff, and discolored kernels with millimeter precision."
  },
  {
    title: "PROCESS CONTROL",
    description: "Automated milling lines and cold roller parameters are continuously calibrated to prevent thermal nutrient degradation, retaining the grain's natural germ, dietary fiber, and inherent aroma."
  },
  {
    title: "LAB TESTING",
    description: "In-house laboratory technicians conduct certified batch assays for gluten index, moisture retention, falling number, ash content, and complete absence of chemical additives or adulterants."
  },
  {
    title: "PACKAGING CHECK",
    description: "Moisture-barrier, food-grade packaging is inspected for hermetic seal strength, exact volumetric weight tolerance, nitrogen flushing integrity, and clear traceability batch coding."
  },
  {
    title: "FINAL QUALITY CONTROL",
    description: "Before final dispatch from our Indore milling facility, master lot samples undergo culinary performance audits to guarantee consistent dough elasticity, texture, and taste."
  }
];

export const metadata = {
  title: "Quality | Avantika Grain Mills",
  description: "Quality is a process. Explore our rigorous quality control timeline.",
};

export default function QualityPage() {
  return (
    <div data-header-theme="light" className="pt-32 pb-24 bg-brand-ivory min-h-screen">
      <div className="container mx-auto px-6 md:px-12 max-w-5xl">
        <header className="mb-24 mt-12 text-center">
          <h1 className="font-serif text-5xl md:text-7xl font-bold tracking-tight text-brand-charcoal mb-6">
            <AnimatedText text="QUALITY IS A PROCESS." />
          </h1>
          <p className="text-brand-charcoal/70 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
            Every grain that enters our facility is subjected to an uncompromising series of checks. We don&apos;t just test the final product; we monitor every stage of its transformation.
          </p>
        </header>

        {/* Visual Timeline */}
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-brand-charcoal/10 -translate-x-1/2" />

          <div className="flex flex-col gap-12 md:gap-24">
            {qualitySteps.map((step, idx) => (
              <div key={idx} className={`relative flex items-center md:justify-between ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>

                {/* Timeline Dot */}
                <div className="absolute left-4 md:left-1/2 w-3 h-3 bg-brand-gold rounded-full -translate-x-1/2 z-10 shadow-[0_0_0_4px_rgba(253,251,247,1)]" />

                {/* Spacer for alternating layout */}
                <div className="hidden md:block w-1/2" />

                {/* Content Card */}
                <div className={`w-full pl-12 md:pl-0 md:w-5/12 ${idx % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12 md:text-left'}`}>
                  <span className="text-brand-gold font-serif text-xl mb-2 block">0{idx + 1}</span>
                  <h3 className="font-serif text-2xl text-brand-charcoal mb-3">{step.title}</h3>
                  <p className="text-brand-charcoal/70 text-sm md:text-base leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Certifications Placeholder */}
        <section className="mt-48 text-center border-t border-brand-charcoal/10 pt-24">
          <h2 className="font-serif text-4xl text-brand-charcoal mb-12 uppercase tracking-wide">Certifications</h2>
          <div className="flex justify-center gap-12 flex-wrap opacity-50">
            {/* Real certification logos would go here via CMS */}
            <div className="w-24 h-24 bg-brand-charcoal/5 flex items-center justify-center rounded-full text-xs uppercase tracking-wider">ISO</div>
            <div className="w-24 h-24 bg-brand-charcoal/5 flex items-center justify-center rounded-full text-xs uppercase tracking-wider">FSSAI</div>
            <div className="w-24 h-24 bg-brand-charcoal/5 flex items-center justify-center rounded-full text-xs uppercase tracking-wider">HACCP</div>
          </div>
        </section>
      </div>
    </div>
  );
}
