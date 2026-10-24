'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * The five-stage milling process as a stepped panel.
 *
 * Built as a controlled index rather than a scroll carousel so the stage
 * can be reached by keyboard and by the dot controls, and so the panel
 * height does not jump between stages with different amounts of text.
 */

const STAGES = [
  {
    stage: 'Farm-to-Gate Traceability',
    badge: 'Non-GMO sourced',
    title: 'SOURCE',
    body: 'Carefully selected heritage grains, cultivated in partnership with certified agricultural cooperatives across fertile river basins.',
    specs: ['Single-origin batches', 'Zero synthetic ripeners', 'Direct farm contracts'],
  },
  {
    stage: 'Multi-Spectrum Optical Sorting',
    badge: 'Optical detection',
    title: 'SELECT',
    body: 'High-resolution trichromatic optical sorters analyse every individual kernel, ejecting any discoloured, undersized or damaged grains.',
    specs: ['99.98% purity threshold', 'NIR moisture sensing', 'Density fractionation'],
  },
  {
    stage: 'Multi-Stage De-Stoning & Scouring',
    badge: 'Zero chemical washes',
    title: 'CLEAN',
    body: 'Intensive multi-tier cleaning through pneumatic aspiration, magnetic separators and gentle friction scourers — stripping outer dust without nutrient loss.',
    specs: ['Triple aspiration columns', 'Dry de-stoning modules', 'Magnetic separation'],
  },
  {
    stage: 'Chilled Roller & Cold-Stone Reduction',
    badge: 'Cold-milled integrity',
    title: 'MILL',
    body: 'Precision temperature-controlled milling prevents friction heat, preserving natural wheat germ oils, active enzymes and dietary fibre.',
    specs: ['Controlled micro-passes', 'Low-temperature grinding', 'Intact germ fractions'],
  },
  {
    stage: 'Laser Granulometry & Air Sifting',
    badge: 'Artisanal consistency',
    title: 'REFINE',
    body: 'Laser diffraction monitors micron particle sizing in real time, producing the exact granulation and absorption index required by master artisans.',
    specs: ['Dynamic sieve sifters', 'Ash & gluten benchmarks', 'Hygienic sealed conveying'],
  },
];

export function ProcessStages() {
  const [index, setIndex] = useState(0);
  const stage = STAGES[index];

  const go = (next: number) => setIndex((next + STAGES.length) % STAGES.length);

  return (
    <section
      aria-labelledby="process-heading"
      className="relative overflow-hidden border-y border-[var(--hairline)] bg-[var(--bg-sunken)]"
    >
      <div className="mx-auto max-w-[86rem] px-5 py-24 sm:px-8 sm:py-32">
        <div className="reveal text-center">
          <p className="label">The Avantika processing standard</p>
          <h2 id="process-heading" className="display mt-4 text-h2">
            From grain to <span className="text-[var(--accent)]">greatness.</span>
          </h2>
        </div>

        <div className="relative mt-14">
          {/* Oversized stage numeral, decorative only. */}
          <span
            aria-hidden
            className="pointer-events-none absolute -right-2 bottom-0 select-none font-[family-name:var(--font-display)] text-[8rem] leading-none text-[var(--gold)] opacity-[0.12] sm:text-[14rem]"
          >
            {String(index + 1).padStart(2, '0')}
          </span>

          <div className="panel gold-edge rounded-[var(--radius-panel-lg)] p-7 sm:p-12">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span
                  aria-hidden
                  className="grid h-12 w-12 flex-none place-items-center rounded-[var(--radius-control)] border border-[var(--hairline)] bg-[var(--color-forest-100)]"
                >
                  <span className="block h-3.5 w-3.5 border border-[var(--accent)]" />
                </span>
                <span>
                  <span className="label block">Stage {String(index + 1).padStart(2, '0')}</span>
                  <span className="mt-1 block text-spec text-[var(--fg)]">{stage.stage}</span>
                </span>
              </div>
              <span className="pill">{stage.badge}</span>
            </div>

            <p className="label mt-10 flex items-center gap-3">
              <span aria-hidden className="block h-px w-8 bg-[var(--accent)]" />
              Step {String(index + 1).padStart(2, '0')} of {String(STAGES.length).padStart(2, '0')}
            </p>

            {/* aria-live so the stage change is announced to screen readers,
                which otherwise get no signal that content swapped. */}
            <div aria-live="polite">
              <h3 className="display mt-4 text-h1 tracking-[0.02em]">{stage.title}</h3>
              <p className="measure-wide mt-5 text-lead leading-relaxed text-[var(--fg-muted)]">
                {stage.body}
              </p>
            </div>

            <div className="mt-10 border-t border-[var(--hairline)] pt-8">
              <ul className="flex flex-wrap gap-2.5">
                {stage.specs.map((spec) => (
                  <li key={spec} className="pill">
                    {spec}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-5">
            <ArrowButton label="Previous stage" onClick={() => go(index - 1)}>
              <ChevronLeft size={18} strokeWidth={1.5} />
            </ArrowButton>

            <ul className="flex items-center gap-2.5">
              {STAGES.map((s, i) => (
                <li key={s.title}>
                  <button
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`Stage ${i + 1}: ${s.title}`}
                    aria-current={i === index ? 'true' : undefined}
                    className={`block h-1.5 rounded-full transition-all duration-[var(--t-base)] ease-[var(--ease-lux)] ${
                      i === index
                        ? 'w-8 bg-[var(--accent)]'
                        : 'w-1.5 bg-[var(--hairline-strong)] hover:bg-[var(--accent)]'
                    }`}
                  />
                </li>
              ))}
            </ul>

            <ArrowButton label="Next stage" onClick={() => go(index + 1)}>
              <ChevronRight size={18} strokeWidth={1.5} />
            </ArrowButton>
          </div>
        </div>
      </div>
    </section>
  );
}

function ArrowButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="panel panel-hover grid h-12 w-12 flex-none place-items-center !rounded-full text-[var(--fg)] transition-colors hover:text-[var(--accent)]"
    >
      {children}
    </button>
  );
}
