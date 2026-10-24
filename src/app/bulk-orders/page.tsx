import type { Metadata } from 'next';
import { PageHeader } from '@/components/site/page-header';
import { BulkForm } from './bulk-form';

export const metadata: Metadata = {
  title: 'Bulk & wholesale',
  description:
    'Wholesale, private label, institutional and export supply from Avantika Grain Mills, Depalpur, Indore.',
};

export default function BulkOrdersPage() {
  return (
    <>
      <PageHeader
        crumb={{ label: 'Avantika', href: '/' }}
        title="Supply, by the tonne."
        intro="The storefront is built for retail packs. For volume, private label or a specification you need the mill to hit, this is the right door."
      />

      <div className="mx-auto max-w-[86rem] px-5 sm:px-8">
        <section className="grid gap-12 border-b border-[var(--hairline)] py-14 lg:grid-cols-[1fr_22rem] lg:gap-20 lg:py-20">
          <div>
            <h2 className="display text-h2">Tell us what you need</h2>
            <p className="measure mt-5 leading-relaxed text-[var(--fg-muted)]">
              Enough detail in the first message saves a week of back and forth. If you
              already have a specification, send it — the mill will say plainly whether
              it can be met before anyone talks price.
            </p>

            <div className="mt-10">
              <BulkForm />
            </div>
          </div>

          <aside className="h-fit lg:border-l lg:border-[var(--hairline)] lg:pl-10">
            <h2 className="display text-h4">What happens next</h2>
            <ol className="mt-5 space-y-5">
              {[
                ['Within two working days', 'Someone from the mill replies to confirm what is available and at what lead time.'],
                ['Samples', 'For a serious volume, samples go out before any commitment.'],
                ['Specification', 'Absorption index, ash band and moisture ceiling are agreed in writing.'],
                ['Quote', 'Priced against the agreed spec, pack format and delivery city.'],
              ].map(([title, body], i) => (
                <li key={title} className="border-t border-[var(--hairline)] pt-4">
                  <span className="display text-[1.4rem] text-[var(--accent)]">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-1.5 text-body">{title}</h3>
                  <p className="mt-1 text-spec leading-relaxed text-[var(--fg-muted)]">{body}</p>
                </li>
              ))}
            </ol>

            <dl className="mt-10">
              <div className="spec">
                <dt>Minimum</dt>
                <dd>Set per product — ask</dd>
              </div>
              <div className="spec">
                <dt>Pack formats</dt>
                <dd>Retail packs through 25 kg sacks</dd>
              </div>
              <div className="spec">
                <dt>Documentation</dt>
                <dd>Batch grading records and lab analysis on request</dd>
              </div>
              <div className="spec">
                <dt>Direct</dt>
                <dd>
                  <a
                    href="mailto:avantikagrain@gmail.com"
                    className="text-[var(--accent)] underline decoration-1 underline-offset-4"
                  >
                    avantikagrain@gmail.com
                  </a>
                </dd>
              </div>
            </dl>
          </aside>
        </section>
      </div>

      <section className="mx-auto max-w-[86rem] px-5 py-14 sm:px-8 sm:py-16">
        <p className="measure-wide text-spec leading-relaxed text-[var(--fg-faint)]">
          Enquiries are stored against a reference number rather than sent as email, so
          nothing is lost in an inbox. Email notification to the mill switches on once
          a mail provider is configured; the record is created either way.
        </p>
      </section>
    </>
  );
}
