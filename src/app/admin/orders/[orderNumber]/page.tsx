import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getOrderDetail } from '@/server/admin';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/rbac';
import { formatPaise } from '@/lib/format';
import { ALLOWED_TRANSITIONS } from '@/models';
import { siteContact } from '@/config/site';
import { buildWhatsappLink, orderSupportMessage } from '@/lib/whatsapp';
import { PageTitle, Panel, StatusBadge, formatDateTime } from '../../ui';
import { OrderActions } from './order-actions';
import { InternalNote } from './internal-note';

export const dynamic = 'force-dynamic';

export default async function AdminOrderDetail({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const [order, session] = await Promise.all([getOrderDetail(orderNumber), getSession()]);

  if (!order || !session) notFound();

  const canWrite = hasPermission(session.role, 'order:write');
  const canCancel = hasPermission(session.role, 'order:cancel');

  const nextStatuses = ALLOWED_TRANSITIONS[order.status].filter(
    (status) => status !== 'cancelled' || canCancel,
  );

  const customerPhone = order.shippingAddress.phone;
  const whatsappLink = buildWhatsappLink({
    phone: customerPhone,
    message: orderSupportMessage({
      orderNumber: order.orderNumber,
      totalPaise: order.totalPaise,
      status: order.status,
    }),
  });

  return (
    <>
      <Link
        href="/admin/orders"
        className="mb-5 inline-flex items-center gap-1.5 text-spec text-[var(--fg-muted)] hover:text-[var(--accent)]"
      >
        <ArrowLeft size={14} /> All orders
      </Link>

      <PageTitle
        title={order.orderNumber}
        subtitle={`Placed ${formatDateTime(order.placedAt)}`}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} />
            <StatusBadge status={order.paymentStatus} />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Panel>
            <SectionHeading>Items</SectionHeading>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-spec">
                <thead>
                  <tr className="border-b border-[var(--hairline)] bg-[var(--bg-panel)] text-left">
                    <Th>Product</Th>
                    <Th>SKU</Th>
                    <Th className="text-right">Qty</Th>
                    <Th className="text-right">Unit</Th>
                    <Th className="text-right">Line total</Th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr
                      key={item.sku}
                      className="border-b border-[var(--hairline)] last:border-0"
                    >
                      <Td>
                        <span className="block font-medium">{item.name}</span>
                        <span className="block text-micro text-[var(--fg-faint)]">
                          {item.packSize}
                        </span>
                      </Td>
                      <Td className="text-[var(--fg-faint)]">{item.sku}</Td>
                      <Td className="text-right tabular-nums">{item.quantity}</Td>
                      <Td className="text-right tabular-nums">
                        {formatPaise(item.unitPricePaise)}
                      </Td>
                      <Td className="text-right tabular-nums">
                        {formatPaise(item.lineSubtotalPaise)}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <dl className="border-t border-[var(--hairline)] px-5 py-4">
              <Row label="Subtotal" value={formatPaise(order.subtotalPaise)} />
              {order.discountPaise > 0 && (
                <Row
                  label={`Discount${order.couponCode ? ` · ${order.couponCode}` : ''}`}
                  value={`−${formatPaise(order.discountPaise)}`}
                />
              )}
              <Row
                label="Shipping"
                value={order.shippingPaise === 0 ? 'Free' : formatPaise(order.shippingPaise)}
              />
              {order.codFeePaise > 0 && (
                <Row label="COD handling" value={formatPaise(order.codFeePaise)} />
              )}
              <Row
                label={order.taxInclusive ? 'GST (included)' : 'GST'}
                value={formatPaise(order.taxPaise)}
              />
              <div className="mt-3 flex items-baseline justify-between border-t border-[var(--hairline-strong)] pt-3">
                <span className="text-body font-medium">Total</span>
                <span className="display text-h4 tabular-nums">
                  {formatPaise(order.totalPaise)}
                </span>
              </div>
            </dl>
          </Panel>

          <Panel>
            <SectionHeading>Status history</SectionHeading>
            <ol className="space-y-0 px-5 pb-5">
              {order.statusHistory.map((event, index) => (
                <li
                  key={`${event.status}-${index}`}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-[var(--hairline)] py-3 last:border-0"
                >
                  <StatusBadge status={event.status} />
                  <span className="text-micro text-[var(--fg-faint)]">
                    {formatDateTime(event.at)}
                  </span>
                  {event.bySystem && (
                    <span className="text-micro text-[var(--fg-faint)]">
                      · {event.bySystem}
                    </span>
                  )}
                  {event.note && (
                    <span className="w-full text-spec text-[var(--fg-muted)]">
                      {event.note}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </Panel>

          {order.customerNote && (
            <Panel>
              <SectionHeading>Customer note</SectionHeading>
              <p className="px-5 pb-5 text-spec leading-relaxed text-[var(--fg-muted)]">
                {order.customerNote}
              </p>
            </Panel>
          )}
        </div>

        <div className="space-y-6">
          {canWrite && nextStatuses.length > 0 && (
            <Panel>
              <SectionHeading>Update status</SectionHeading>
              <div className="px-5 pb-5">
                <OrderActions
                  orderNumber={order.orderNumber}
                  nextStatuses={[...nextStatuses]}
                />
              </div>
            </Panel>
          )}

          <Panel>
            <SectionHeading>Customer</SectionHeading>
            <div className="space-y-1 px-5 pb-5 text-spec">
              <p className="font-medium">{order.shippingAddress.fullName}</p>
              <p className="text-[var(--fg-muted)]">{order.shippingAddress.phone}</p>
              <p className="text-[var(--fg-muted)]">
                {order.user?.email ?? order.guestEmail ?? '—'}
              </p>
              <p className="text-micro text-[var(--fg-faint)]">
                {order.user ? 'Registered account' : 'Guest checkout'}
              </p>

              {siteContact.whatsappNumber && whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-spec font-medium text-[var(--accent)] underline underline-offset-4"
                >
                  Message on WhatsApp
                </a>
              )}
            </div>
          </Panel>

          <Panel>
            <SectionHeading>Delivery address</SectionHeading>
            <address className="space-y-0.5 px-5 pb-5 text-spec not-italic text-[var(--fg-muted)]">
              <p>{order.shippingAddress.line1}</p>
              {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
              {order.shippingAddress.landmark && <p>{order.shippingAddress.landmark}</p>}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state}
              </p>
              <p className="tabular-nums">{order.shippingAddress.pincode}</p>
            </address>
          </Panel>

          <Panel>
            <SectionHeading>Payment</SectionHeading>
            <div className="space-y-1.5 px-5 pb-5 text-spec">
              <p className="uppercase text-[var(--fg-muted)]">{order.paymentMethod}</p>
              <StatusBadge status={order.paymentStatus} />
            </div>
          </Panel>

          {canWrite && (
            <Panel>
              <SectionHeading>Internal note</SectionHeading>
              <div className="px-5 pb-5">
                <InternalNote
                  orderNumber={order.orderNumber}
                  initial={order.internalNote ?? ''}
                />
              </div>
            </Panel>
          )}
        </div>
      </div>
    </>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="border-b border-[var(--hairline)] px-5 py-3.5 text-micro font-medium uppercase tracking-[var(--tracking-label)] text-[var(--fg-faint)]">
      {children}
    </h2>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between py-1">
      <dt className="text-spec text-[var(--fg-muted)]">{label}</dt>
      <dd className="text-spec tabular-nums">{value}</dd>
    </div>
  );
}

function Th({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-5 py-3 text-micro font-medium uppercase tracking-[var(--tracking-label)] text-[var(--fg-faint)] ${className}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-5 py-3.5 align-top ${className}`}>{children}</td>;
}
