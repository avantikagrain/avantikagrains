import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/site/reveal';

export const metadata: Metadata = {
  title: 'Grading',
  description:
    'How Avantika grades grain: optical sorting thresholds, moisture control, batch benchmarking, and what documentation is available to buyers.',
};

/**
 * Editorial photography, served from the client's Cloudinary account.
 *
 * `f_auto,q_auto` lets Cloudinary pick the format and compression; Next's
 * own optimiser then resizes per breakpoint. The host is allow-listed in
 * next.config.ts — a remote image from anywhere else is refused outright,
 * which is why a new URL needs a config change and not just a paste.
 */
const CLOUDINARY = 'https://res.cloudinary.com/sbfiliaz/image/upload/f_auto,q_auto';

const PHOTO = {
  lab: `${CLOUDINARY}/Grain_Inspection_in_a_Quality_Lab`,
  wheat: `${CLOUDINARY}/Golden_Wheat_Grains_on_Rustic_Surface`,
  assortment: `${CLOUDINARY}/Rustic_Assortment_of_Grains_and_Pulses`,
};

/**
 * Read in line, per batch, and recorded against the batch number printed on
 * the pack.
 */
const MEASURED = [
  ['Optical purity', '99.98% threshold — trichromatic sorting'],
  ['Moisture', 'Near-infrared, continuous'],
  ['Particle sizing', 'Laser diffraction, micron-level'],
  ['Ash content', 'Benchmarked per batch'],
  ['Gluten', 'Benchmarked per batch, wheat only'],
  ['Foreign matter', 'Dry de-stoning and magnetic separation'],
  ['Germ fraction', 'Verified intact after milling'],
];

const DOCUMENTATION = [
  ['Available on request', 'Batch grading records, lab analysis, specification sheets'],
  ['Statutory licensing', 'FSSAI licence details are printed on every pack and shown at checkout'],
  ['Country of origin', 'India — stated per product'],
];

export default function QualityPage() {
  return (
    <>
      {/*
        Hero.

        The heading rises 20px while the photograph settles out of a 1.03
        scale over 900ms, so the two finish together and the picture reads
        as coming to rest beneath the words. Both are plain CSS animations
        running on load — no observer, because the hero is never below the
        fold and has nothing to wait for.
      */}
      <header className="relative isolate overflow-hidden">
        <Image
          src={PHOTO.lab}
          alt=""
          fill
          sizes="100vw"
          // The hero is this page's LCP element.
          priority
          quality={82}
          className="hero-settle -z-10 object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-t from-[rgb(14_38_25/0.92)] via-[rgb(14_38_25/0.68)] to-[rgb(14_38_25/0.36)]"
        />

        <div className="mx-auto max-w-[86rem] px-5 pb-16 pt-36 sm:px-8 sm:pb-24 sm:pt-44">
          <Link
            href="/"
            className="hero-rise inline-block text-spec text-[var(--color-cream-100)]/70 transition-colors duration-[var(--t-fast)] hover:text-[var(--color-cream-50)]"
          >
            Avantika
          </Link>

          <h1 className="hero-rise display mt-5 max-w-4xl text-h1 text-[var(--color-cream-50)] [animation-delay:90ms]">
            Two kernels in ten thousand.
          </h1>

          <p className="hero-rise measure-wide mt-6 text-lead leading-relaxed text-[var(--color-cream-100)]/85 [animation-delay:180ms]">
            A 99.98% purity threshold sounds abstract until it is stated the other way
            round: out of every ten thousand kernels that enter the sorter, two are
            allowed through that should not be. That is the standard the mill runs to.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[86rem] px-5 sm:px-8">
        {/* ---- What gets measured ------------------------------------- */}
        <section className="border-b border-[var(--hairline)] py-14 lg:py-20">
          <Reveal>
            <p className="label">The measurements</p>
            <h2 className="display mt-4 text-h2">What gets measured</h2>
            <p className="measure-wide mt-5 leading-relaxed text-[var(--fg-muted)]">
              Each of these is read in line, per batch, and recorded against the batch
              number printed on the pack. If a figure falls outside the band, the batch
              is held rather than blended into a passing one.
            </p>
          </Reveal>

          {/*
            Cards rather than a definition list: seven rows of small type
            read as fine print, which is the opposite of what a page about
            rigour should look like. They come in one at a time, 80ms apart,
            so the group arrives as a single movement.
          */}
          <ul className="mt-10 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {MEASURED.map(([label, value], i) => (
              <Reveal
                key={label}
                as="li"
                delayMs={i * 80}
                className="panel panel-hover rounded-[var(--radius-panel)] border-[var(--hairline)] p-5 transition-colors duration-[var(--t-base)] hover:border-[var(--gold)]"
              >
                <p className="text-micro uppercase tracking-[var(--tracking-label)] text-[var(--fg-faint)]">
                  {label}
                </p>
                <p className="mt-2 leading-snug">{value}</p>
              </Reveal>
            ))}
          </ul>
        </section>

        {/* ---- Specification, not certification ------------------------ */}
        <section className="grid gap-10 border-b border-[var(--hairline)] py-14 lg:grid-cols-[1fr_26rem] lg:gap-16 lg:py-20">
          <Reveal>
            <h2 className="display measure-wide text-h2">
              Why a number on a website is not evidence
            </h2>

            <div className="measure-wide mt-6">
              <p className="leading-relaxed text-[var(--fg-muted)]">
                Anyone can print a purity figure. The figures above are what Avantika
                measures on its own line, which makes them a specification rather than a
                certification — two different things that food marketing routinely
                conflates.
              </p>
              <p className="mt-4 leading-relaxed text-[var(--fg-muted)]">
                Where an independent result exists, the honest thing is to hand over the
                report rather than summarise it into a badge. For bulk, institutional and
                export buyers, the mill provides the underlying documentation directly.
              </p>
            </div>

            <dl className="mt-10 max-w-2xl">
              {DOCUMENTATION.map(([label, value]) => (
                <div key={label} className="spec">
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal delayMs={120} className="self-start">
            <figure className="grain-zoom overflow-hidden rounded-[var(--radius-panel)]">
              <div className="relative aspect-[4/5]">
                <Image
                  src={PHOTO.wheat}
                  alt="Golden wheat grains spread across a rustic wooden surface."
                  fill
                  sizes="(max-width: 1024px) 100vw, 26rem"
                  quality={82}
                  className="object-cover"
                />
              </div>
              <figcaption className="mt-3 text-micro text-[var(--fg-faint)]">
                Graded wheat, after sorting and before milling.
              </figcaption>
            </figure>
          </Reveal>
        </section>
      </div>

      {/* ---- CTA ------------------------------------------------------- */}
      <section className="mx-auto max-w-[86rem] px-5 py-16 sm:px-8 sm:py-24">
        <Reveal className="panel overflow-hidden rounded-[var(--radius-panel-lg)]">
          <div className="grid lg:grid-cols-[1fr_22rem]">
            <div className="p-7 sm:p-11">
              <p className="label">Bulk and institutional</p>
              <h2 className="display mt-4 text-h3">
                Buying in volume, or specifying for a kitchen?
              </h2>
              <p className="measure mt-5 leading-relaxed text-[var(--fg-muted)]">
                Send the specification you need to hit — absorption index, ash band, pack
                format — and the mill will tell you whether it can meet it before you
                place anything.
              </p>

              {/*
                The arrow moves 4px on hover and the ground lifts from the
                deep forest to the lighter one. Movement on the element the
                pointer is already over is the cheapest way to say "this is
                a button" without drawing a second border around it.
              */}
              <Link
                href="/contact"
                className="group mt-9 inline-flex h-12 items-center gap-2.5 rounded-[var(--radius-pill)] bg-[var(--accent)] px-7 text-spec font-medium text-[var(--color-cream-50)] transition-colors duration-[var(--t-base)] ease-[var(--ease-lux)] hover:bg-[var(--accent-bright)]"
              >
                Contact the mill
                <ArrowRight
                  size={16}
                  className="transition-transform duration-[var(--t-base)] ease-[var(--ease-lux)] group-hover:translate-x-1"
                />
              </Link>
            </div>

            <div className="grain-zoom relative min-h-[14rem] overflow-hidden lg:min-h-full">
              <Image
                src={PHOTO.assortment}
                alt="An assortment of grains and pulses in bowls on a rustic table."
                fill
                sizes="(max-width: 1024px) 100vw, 22rem"
                quality={82}
                className="object-cover"
              />
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}