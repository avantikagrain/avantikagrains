import type { Metadata } from 'next';
import { PageHeader } from '@/components/site/page-header';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Reach Avantika Grain Mills Private Limited, Depalpur, Indore — retail orders, bulk supply and grading documentation.',
};

export default function ContactPage() {
  return (
    <>
      <PageHeader
        crumb={{ label: 'Avantika', href: '/' }}
        title="Write to the mill."
        intro="Retail orders go through the storefront. For bulk supply, private label, grading documentation or anything a form would mangle, email is better."
      />

      <div className="mx-auto max-w-[86rem] px-5 sm:px-8">
        <section className="grid gap-10 border-b border-[var(--hairline)] py-14 lg:grid-cols-2 lg:gap-16 lg:py-20">
          <div>
            <h2 className="display text-h2">Direct</h2>

            <dl className="mt-8">
              <div className="spec">
                <dt>Email</dt>
                <dd>
                  <a
                    href="mailto:avantikagrain@gmail.com"
                    className="text-[var(--accent)] underline decoration-1 underline-offset-4"
                  >
                    avantikagrain@gmail.com
                  </a>
                </dd>
              </div>
              <div className="spec">
                <dt>Mill address</dt>
                <dd>
                  Gram Navda Dhar Road, Navdapanth, Kalaria,
                  <br />
                  Depalpur, Indore, Madhya Pradesh 453001
                </dd>
              </div>
              <div className="spec">
                <dt>Entity</dt>
                <dd>Avantika Grain Mills Private Limited</dd>
              </div>
            </dl>

            <p className="mt-8 text-spec leading-relaxed text-[var(--fg-faint)]">
              A phone line and published hours will be listed here once the mill
              confirms them.
            </p>
          </div>

          <div>
            <h2 className="display text-h2">What to include</h2>
            <p className="measure mt-6 leading-relaxed text-[var(--fg-muted)]">
              The more of this is in the first email, the fewer rounds it takes.
            </p>

            <dl className="mt-8">
              <div className="spec">
                <dt>Bulk enquiry</dt>
                <dd>Product, monthly volume, pack format, delivery city</dd>
              </div>
              <div className="spec">
                <dt>Specification</dt>
                <dd>Absorption index, ash band, moisture ceiling, if you have them</dd>
              </div>
              <div className="spec">
                <dt>Documentation</dt>
                <dd>Which reports you need and who they are for</dd>
              </div>
              <div className="spec">
                <dt>Existing order</dt>
                <dd>Order number, in the form AG-YYMMDD-XXXXXX</dd>
              </div>
            </dl>
          </div>
        </section>
      </div>

      <section className="mx-auto max-w-[86rem] px-5 py-16 sm:px-8 sm:py-20">
        <p className="measure-wide text-spec leading-relaxed text-[var(--fg-faint)]">
          An enquiry form that writes into the order system is planned. Until it is
          built, this page lists email rather than a form that silently drops
          messages — which is the more common outcome of a form nobody has wired up.
        </p>
      </section>
    </>
  );
}
