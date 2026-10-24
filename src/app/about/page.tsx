import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/site/page-header';

export const metadata: Metadata = {
  title: 'The mill',
  description:
    'Avantika Grain Mills Private Limited — a grain milling company at Depalpur, Indore, working with heritage cereals, pulses and seeds.',
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        crumb={{ label: 'Avantika', href: '/' }}
        title="A mill is a filter, not a factory."
        intro="Avantika Grain Mills Private Limited works out of Depalpur, west of Indore, on the edge of the Malwa plateau. What leaves the mill is decided almost entirely by what is turned away at the start of it."
      />

      <div className="mx-auto max-w-[86rem] px-5 sm:px-8">
        <section className="grid gap-10 border-b border-[var(--hairline)] py-14 lg:grid-cols-[1fr_20rem] lg:gap-16 lg:py-20">
          <div className="measure-wide">
            <h2 className="display text-h2">Where we are</h2>
            <p className="mt-6 leading-relaxed text-[var(--fg-muted)]">
              Malwa has grown wheat for as long as anyone has recorded it. The black
              cotton soil holds water through a dry spring, which is why the older
              varieties — emmer among them — still do well here when they have been
              abandoned almost everywhere else.
            </p>
            <p className="mt-4 leading-relaxed text-[var(--fg-muted)]">
              The mill sits close to the fields it buys from. That is partly
              sentiment and mostly logistics: grain that travels less arrives drier,
              and drier grain mills better.
            </p>
          </div>

          <dl className="self-start">
            <div className="spec">
              <dt>Entity</dt>
              <dd>Avantika Grain Mills Private Limited</dd>
            </div>
            <div className="spec">
              <dt>Mill</dt>
              <dd>
                Gram Navda Dhar Road, Navdapanth, Kalaria, Depalpur, Indore, Madhya
                Pradesh 453001
              </dd>
            </div>
            <div className="spec">
              <dt>Catalogue</dt>
              <dd className="tabular-nums">31 products across grains, pulses and seeds</dd>
            </div>
            <div className="spec">
              <dt>Supply</dt>
              <dd>Retail packs and bulk</dd>
            </div>
          </dl>
        </section>

        <section className="border-b border-[var(--hairline)] py-14 lg:py-20">
          <h2 className="display measure-wide text-h2">
            What we will not do
          </h2>

          <div className="mt-10 grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {[
              [
                'Mill hot',
                'High-speed reduction is faster and yields more. It also cooks the germ oils out of the flour, which is most of the reason to buy whole grain in the first place.',
              ],
              [
                'Wash or treat',
                'Water and chemistry clean grain quickly. Dry mechanical cleaning takes longer and leaves the bran where it belongs.',
              ],
              [
                'Blend origins quietly',
                'Single-origin batches stay separate through the mill. A blend can be good; a blend sold as single-origin is not.',
              ],
              [
                'Polish pulses',
                'Polishing makes dal glossy by abrading the outer layer away. The gloss is cosmetic. The layer is fibre.',
              ],
              [
                'Claim what we cannot show',
                'Figures published here are what the mill measures in line. Where a claim needs a lab, we will send the lab report instead of restating the claim.',
              ],
              [
                'Sell above MRP',
                'Printed price is the ceiling, including during shortages. The storefront refuses to accept a price above it.',
              ],
            ].map(([title, body]) => (
              <div key={title} className="border-t border-[var(--hairline-strong)] pt-5">
                <h3 className="text-h4">{title}</h3>
                <p className="mt-2.5 text-spec leading-relaxed text-[var(--fg-muted)]">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mx-auto max-w-[86rem] px-5 py-16 sm:px-8 sm:py-24">
        <p className="display measure-wide text-h3 text-[var(--fg-muted)]">
          If you are buying in volume, or you want the grading reports before you
          commit,{' '}
          <Link href="/contact" className="text-[var(--fg)] underline decoration-1 underline-offset-[6px]">
            write to the mill
          </Link>
          .
        </p>
      </section>
    </>
  );
}
