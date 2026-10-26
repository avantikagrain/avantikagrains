import Link from 'next/link';
import { listOrders } from '@/server/admin';
import { formatPaise } from '@/lib/format';
import { ORDER_STATUSES, type OrderStatus } from '@/models';
import {
  EmptyState,
  ORDER_STATUS_LABELS,
  PageTitle,
  Pagination,
  Panel,
  StatusBadge,
  formatDateTime,
} from '../ui';
import { OrderSearch } from './order-search';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

function parseStatus(value?: string): OrderStatus | undefined {
  if (!value) return undefined;
  return (ORDER_STATUSES as readonly string[]).includes(value)
    ? (value as OrderStatus)
    : undefined;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const status = parseStatus(params.status);
  const search = params.q?.trim() || undefined;
  const page = Math.max(1, Number(params.page ?? 1) || 1);

  const result = await listOrders({ status, search, page, limit: PAGE_SIZE });

  return (
    <>
      <PageTitle
        title="Orders"
        subtitle={`${result.total} order${result.total === 1 ? '' : 's'}${
          status ? ` · ${ORDER_STATUS_LABELS[status]}` : ''
        }`}
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <OrderSearch initial={search ?? ''} status={status} />

        <nav aria-label="Filter by status" className="flex flex-wrap gap-1.5">
          <FilterChip href="/admin/orders" label="All" active={!status} />
          {ORDER_STATUSES.map((value) => (
            <FilterChip
              key={value}
              href={`/admin/orders?status=${value}`}
              label={ORDER_STATUS_LABELS[value]}
              active={status === value}
            />
          ))}
        </nav>
      </div>

      <Panel>
        {result.rows.length === 0 ? (
          <EmptyState message="No orders match this view." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-spec">
                <thead>
                  <tr className="border-b border-[var(--hairline)] bg-[var(--bg-panel)] text-left">
                    <Th>Order</Th>
                    <Th>Customer</Th>
                    <Th>Items</Th>
                    <Th>Total</Th>
                    <Th>Payment</Th>
                    <Th>Status</Th>
                    <Th>Placed</Th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-[var(--hairline)] last:border-0 hover:bg-[var(--bg-panel)]"
                    >
                      <Td>
                        <Link
                          href={`/admin/orders/${order.orderNumber}`}
                          className="font-medium tabular-nums text-[var(--accent)] underline-offset-4 hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                      </Td>
                      <Td>
                        <span className="block">{order.customerName}</span>
                        <span className="block text-micro text-[var(--fg-faint)]">
                          {order.customerContact}
                        </span>
                      </Td>
                      <Td className="tabular-nums">{order.itemCount}</Td>
                      <Td className="tabular-nums">{formatPaise(order.totalPaise)}</Td>
                      <Td>
                        <span className="block uppercase">{order.paymentMethod}</span>
                        <span className="mt-1 block">
                          <StatusBadge status={order.paymentStatus} />
                        </span>
                      </Td>
                      <Td>
                        <StatusBadge status={order.status} />
                      </Td>
                      <Td className="whitespace-nowrap text-[var(--fg-faint)]">
                        {formatDateTime(order.placedAt)}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={page}
              totalPages={result.totalPages}
              basePath="/admin/orders"
              params={{ status, q: search }}
            />
          </>
        )}
      </Panel>
    </>
  );
}

function FilterChip({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'true' : undefined}
      className={`rounded-[var(--radius-pill)] border px-3 py-1.5 text-micro transition-colors duration-[var(--t-fast)] ${
        active
          ? 'border-[var(--accent)] bg-[var(--color-forest-100)] font-medium text-[var(--accent)]'
          : 'border-[var(--hairline-strong)] text-[var(--fg-muted)] hover:border-[var(--accent)]'
      }`}
    >
      {label}
    </Link>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-5 py-3 text-micro font-medium uppercase tracking-[var(--tracking-label)] text-[var(--fg-faint)]">
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
