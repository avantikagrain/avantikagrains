import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Milling',
  description:
    'The five stages between field and pack at Avantika Grain Mills: sourcing, optical selection, dry cleaning, cold milling and laser-monitored refinement.',
};

const STAGES = [
  {
    title: 'Source',
    lede: 'Contracted, not bought at market.',
    body: 'Heritage varieties are grown under direct contract with certified cooperatives across the Malwa basin. Buying at mandi price would be cheaper; it would also mean accepting whatever arrives, with no record of the field it came from.',
    specs: [
      ['Procurement', 'Direct farm contracts'],
      ['Batching', 'Single-origin, kept separate through milling'],
      ['Treatments', 'No synthetic ripeners'],
    ],
  },
  {
    title: 'Select',
    lede: 'Every kernel is looked at.',
    body: 'Trichromatic optical sorters scan the stream and eject anything discoloured, undersized or damaged. This is the stage that decides what the finished pack looks like, so it runs before any cleaning or milling — there is no point scouring a kernel that will be thrown out.',
    specs: [
      ['Method', 'High-resolution trichromatic optical sorting'],
      ['Moisture', 'Near-infrared sensing in line'],
      ['Separation', 'Density fractionation'],
    ],
  },
  {
    title: 'Clean',
    lede: 'Dry, mechanical, and nothing added.',
    body: 'Cleaning is done with air, magnets and friction rather than water or chemistry. Pneumatic aspiration lifts dust and chaff, magnetic separators pull metal fragments, and gentle scourers take the outer dust off without stripping the bran.',
    specs: [
      ['Aspiration', 'Triple column'],
      ['De-stoning', 'Dry modules'],
      ['Washes', 'None — no chemical treatment at any point'],
    ],
  },
  {
    title: 'Mill',
    lede: 'Cold, because heat costs nutrition.',
    body: 'Conventional high-speed milling generates friction heat, and heat degrades wheat germ oils and the enzymes that go with them. Avantika mills in controlled micro-passes at low temperature instead. It is slower and the throughput is lower. The germ fraction survives.',
    specs: [
      ['Reduction', 'Chilled roller and cold-stone'],
      ['Passes', 'Controlled micro-passes'],
      ['Germ', 'Retained intact'],
    ],
  },
  {
    title: 'Refine',
    lede: 'Measured, then measured again.',
    body: 'Laser diffraction reads micron particle sizing in real time, and dynamic sieves hold the granulation to the absorption index a given flour is specified for. Ash and gluten are benchmarked per batch, so two sacks a season apart behave the same way in a dough.',
    specs: [
      ['Sizing', 'Laser granulometry, continuous'],
      ['Sifting', 'Dynamic sieve'],
      ['Benchmarks', 'Ash and gluten, per batch'],
    ],
  },
];

export default function ManufacturingPage() {
  return (
    <>

      <header className="relative isolate overflow-hidden">
        <Image
          src="/brand/hero.webp"
          alt=""
          fill
          sizes="100vw"
          priority
          quality={82}
          className="-z-10 object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-t from-[rgb(14_38_25/0.9)] via-[rgb(14_38_25/0.66)] to-[rgb(14_38_25/0.34)]"
        />

        <div className="mx-auto max-w-[86rem] px-5 pb-14 pt-36 sm:px-8 sm:pb-20 sm:pt-44">
          <Link
            href="/"
            className="text-spec text-[var(--color-cream-100)]/70 transition-colors duration-[var(--t-fast)] hover:text-[var(--color-cream-50)]"
          >
            Avantika
          </Link>

          <h1 className="display mt-5 max-w-4xl text-h1 text-[var(--color-cream-50)]">
            Five stages between the field and the pack.
          </h1>
          <p className="measure-wide mt-6 text-lead leading-relaxed text-[var(--color-cream-100)]/85">
            Most of what distinguishes one bag of grain from another happens before
            anything is milled. These are the stages, in the order they run, and what
            each one is for.
          </p>
          <p className="label mt-8">Depalpur, Indore · Madhya Pradesh</p>
        </div>
      </header>

      <div className="mx-auto max-w-[86rem] px-5 sm:px-8">
        {STAGES.map((stage, i) => (
          <section
            key={stage.title}
            className="group reveal grid gap-8 border-b border-[var(--hairline)] py-14 lg:grid-cols-[7rem_1fr_21rem] lg:gap-14 lg:py-20"
          >

            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="text-micro uppercase tracking-[var(--tracking-label)] text-[var(--fg-faint)]">
                Stage {i + 1} / {STAGES.length}
              </p>
              <span
                aria-hidden
                className="display mt-2 block text-[2.75rem] leading-none text-[var(--accent)] transition-colors duration-[var(--t-base)] ease-[var(--ease-lux)] group-hover:text-[var(--gold)] lg:text-[4rem]"
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <span
                aria-hidden
                className="mt-5 hidden h-px w-10 bg-[var(--hairline-strong)] transition-all duration-[var(--t-slow)] ease-[var(--ease-lux)] group-hover:w-full group-hover:bg-[var(--gold)] lg:block"
              />
            </div>

            <div>
              <h2 className="display relative inline-block text-h2">
                {stage.title}
                <span
                  aria-hidden
                  className="absolute -bottom-1.5 left-0 h-[2px] w-0 rounded-full bg-[var(--gold)] transition-[width] duration-[var(--t-slow)] ease-[var(--ease-lux)] group-hover:w-full"
                />
              </h2>
              <p className="display mt-4 text-h4 italic text-[var(--fg-muted)]">{stage.lede}</p>
              <p className="measure mt-6 leading-relaxed text-[var(--fg-muted)]">{stage.body}</p>
            </div>

            <dl className="panel panel-hover gold-edge h-fit self-start rounded-[var(--radius-panel)] px-5 pb-2 pt-1">
              {stage.specs.map(([label, value]) => (
                <div key={label} className="spec spec-stacked">
                  <dt>{label}</dt>
                  <dd className="text-[var(--fg)]">{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>

      <section className="mx-auto max-w-[86rem] px-5 py-16 sm:px-8 sm:py-20">
        <div className="panel gold-edge reveal rounded-[var(--radius-panel-lg)] p-7 sm:p-10">
          <p className="label">Verification</p>
          <h2 className="display mt-4 text-h3">On the figures above</h2>
          <p className="measure-wide mt-5 leading-relaxed text-[var(--fg-muted)]">
            The purity benchmark and process parameters on this page are the standards
            the mill holds itself to and measures against in line. They are not a
            third-party certification, and this page does not present them as one.
            Independent lab reports and certification documents are available on
            request for bulk and institutional buyers.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/quality" className="btn btn-primary">
              How grading works
              <ArrowRight size={16} />
            </Link>
            <Link href="/contact" className="btn btn-outline">
              Request documentation
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
