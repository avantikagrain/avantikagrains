import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader, Prose } from '@/components/site/page-header';

/**
 * Policy pages.
 *
 * The operational terms below are the ones the storefront actually enforces
 * in code — order states, refund routing, what is collected and why — so
 * they are accurate descriptions of the system's behaviour.
 *
 * What is NOT here is legal wording: governing law, jurisdiction, liability
 * limits, grievance officer details and the statutory consumer-complaint
 * text. Those have to come from the business and its counsel. Each page says
 * so at the foot rather than filling the gap with boilerplate that reads
 * authoritative and binds nobody.
 */

interface Section {
  heading: string;
  paragraphs?: string[];
  list?: string[];
}

interface Policy {
  slug: string;
  title: string;
  intro: string;
  sections: Section[];
}

const POLICIES: Policy[] = [
  {
    slug: 'shipping',
    title: 'Shipping',
    intro:
      'How orders are packed, dispatched and tracked, and what happens when a delivery fails.',
    sections: [
      {
        heading: 'Dispatch',
        paragraphs: [
          'Orders are packed at the Depalpur mill. An order is dispatched once payment is confirmed server-side, or — for Cash on Delivery — once the order is accepted.',
          'Each shipment is handed to a courier with an AWB number, and the tracking link is attached to the order as soon as the courier assigns it.',
        ],
      },
      {
        heading: 'Charges',
        list: [
          'Shipping is calculated on the server at checkout, from the order weight and destination.',
          'A free-shipping threshold applies above a set order value; the exact figure is shown in the checkout summary before payment.',
          'Cash on Delivery carries a handling fee, shown as a separate line.',
        ],
      },
      {
        heading: 'Serviceability',
        paragraphs: [
          'Deliverability is checked against the destination PIN code at checkout. Cash on Delivery is unavailable for some PIN codes and above a set order value; in both cases the checkout will say so before payment rather than after.',
        ],
      },
      {
        heading: 'Failed delivery and return to origin',
        paragraphs: [
          'If a courier cannot deliver after its permitted attempts, the shipment returns to the mill. For a prepaid order, the amount paid is refunded to the original payment method once the shipment is received back. For Cash on Delivery, nothing was collected, so nothing is refunded.',
        ],
      },
    ],
  },
  {
    slug: 'returns',
    title: 'Cancellation, returns and refunds',
    intro:
      'What can be cancelled, what can be returned, and how money moves back.',
    sections: [
      {
        heading: 'Cancellation',
        list: [
          'An order can be cancelled while it is awaiting payment, confirmed, or being processed.',
          'Once a shipment has left the mill it can no longer be cancelled — the return route applies instead.',
          'Cancelling an order releases the reserved stock immediately.',
        ],
      },
      {
        heading: 'Returns',
        paragraphs: [
          'Food products are sealed at the mill. A return is accepted where the pack is damaged in transit, the seal is broken on arrival, the wrong item was sent, or the product is within shelf life but demonstrably defective.',
          'Raise it with the order number and photographs of the pack and seal. The window for raising a transit-damage claim is short by necessity, and the business will publish the exact period here.',
        ],
      },
      {
        heading: 'Refunds',
        list: [
          'Refunds go back to the original payment method. Store credit is not substituted for a refund.',
          'A refund is raised against the recorded payment and can be full or partial; partial refunds are used where part of an order is affected.',
          'Cash on Delivery refunds require bank details, since there is no original online payment to reverse.',
          'Settlement timing is set by the payment provider and the receiving bank, not by the mill.',
        ],
      },
    ],
  },
  {
    slug: 'privacy',
    title: 'Privacy',
    intro:
      'What this storefront collects, why it needs it, and what it deliberately does not store.',
    sections: [
      {
        heading: 'What is collected',
        list: [
          'Account: name, email address, and phone number if you provide one.',
          'Addresses: delivery and billing addresses you save or enter at checkout.',
          'Orders: items, prices at the time of purchase, and the delivery address, kept as an immutable record of the transaction.',
          'Payments: the provider reference and status of each payment attempt.',
        ],
      },
      {
        heading: 'What is not stored',
        paragraphs: [
          'Card numbers, CVVs and UPI credentials are never stored and never reach this server. Payment details are entered directly with the payment provider; the storefront only receives a reference and a status.',
          'Passwords are stored only as a bcrypt hash and cannot be read back, including by the mill.',
        ],
      },
      {
        heading: 'Why orders are kept',
        paragraphs: [
          'Order and payment records are retained because tax and invoicing rules require a business to be able to produce them. They are not deleted on request where that retention obligation applies; account and marketing data is a separate matter and can be removed.',
        ],
      },
      {
        heading: 'Marketing',
        paragraphs: [
          'Marketing email is sent only where you have opted in, and the date of that consent is recorded. Opting out stops it without affecting order notifications, which are part of the transaction rather than marketing.',
        ],
      },
    ],
  },
  {
    slug: 'terms',
    title: 'Terms of sale',
    intro: 'The terms on which the storefront accepts an order.',
    sections: [
      {
        heading: 'Pricing',
        list: [
          'Prices are in Indian rupees and inclusive of GST.',
          'The printed maximum retail price is a ceiling; the storefront will not accept a selling price above it.',
          'All totals — subtotal, discount, shipping, tax and any Cash on Delivery fee — are computed on the server. A price or total sent from a browser is rejected, not trusted.',
        ],
      },
      {
        heading: 'Orders',
        paragraphs: [
          'An order is an offer to buy. It is accepted when payment is confirmed server-side, or when a Cash on Delivery order is accepted by the mill.',
          'Stock is held for a short window while payment completes. If payment does not complete, the hold is released and the items return to general availability.',
          'Where a price or stock error is discovered before dispatch, the mill may cancel and refund in full rather than ship on incorrect terms.',
        ],
      },
      {
        heading: 'Invoicing',
        paragraphs: [
          'A GST invoice is issued against each order, numbered sequentially within the financial year. The invoice reflects the amounts actually charged.',
        ],
      },
    ],
  },
];

function findPolicy(slug: string): Policy | undefined {
  return POLICIES.find((p) => p.slug === slug);
}

export function generateStaticParams() {
  return POLICIES.map((p) => ({ policy: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ policy: string }>;
}): Promise<Metadata> {
  const { policy } = await params;
  const found = findPolicy(policy);
  if (!found) return { title: 'Not found' };
  return { title: found.title, description: found.intro };
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ policy: string }>;
}) {
  const { policy } = await params;
  const found = findPolicy(policy);
  if (!found) notFound();

  return (
    <>
      <PageHeader
        crumb={{ label: 'Avantika', href: '/' }}
        title={found.title}
        intro={found.intro}
      />

      <Prose>
        {found.sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs?.map((text) => (
              <p key={text.slice(0, 32)}>{text}</p>
            ))}
            {section.list && (
              <ul>
                {section.list.map((item) => (
                  <li key={item.slice(0, 32)}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </Prose>

      <section className="mx-auto max-w-[86rem] px-5 pb-20 sm:px-8">
        <div className="measure-wide border-t border-[var(--hairline-strong)] pt-8">
          <h2 className="text-h4">Not yet complete</h2>
          <p className="mt-3 text-spec leading-relaxed text-[var(--fg-muted)]">
            This page describes how the storefront actually operates. It is not the
            finished legal document: governing law, jurisdiction, liability, the
            statutory grievance officer details and the exact claim windows still have
            to be supplied and approved by the business and its counsel. Treat what is
            above as accurate on process and incomplete on law.
          </p>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
            {POLICIES.filter((p) => p.slug !== found.slug).map((p) => (
              <Link
                key={p.slug}
                href={`/policies/${p.slug}`}
                className="text-spec text-[var(--accent)] underline decoration-1 underline-offset-4"
              >
                {p.title}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
