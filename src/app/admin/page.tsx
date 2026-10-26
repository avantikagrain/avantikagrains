import Link from 'next/link';
import { getDashboardMetrics, listOrders } from '@/server/admin';
import { formatPaise } from '@/lib/format';
import {
  EmptyState,
  MetricCard,
  PageTitle,
  Panel,
  StatusBadge,
  formatDateTime,
} from './ui';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const [metrics, recent] = await Promise.all([
    getDashboardMetrics(),
    listOrders({ page: 1, limit: 8 }),
  ]);

  return (
    <>
      <PageTitle title="Dashboard" subtitle="Live figures from the store." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Orders today"
          value={String(metrics.ordersToday)}
          hint={formatPaise(metrics.revenueTodayPaise)}
          href="/admin/orders"
        />
        <MetricCard
          label="This month"
          value={String(metrics.ordersThisMonth)}
          hint={formatPaise(metrics.revenueThisMonthPaise)}
          href="/admin/orders"
        />
        <MetricCard
          label="Awaiting action"
          value={String(metrics.awaitingAction)}
          hint="Confirmed or processing"
          href="/admin/orders?status=confirmed"
          tone="alert"
        />
        <MetricCard
          label="New enquiries"
          value={String(metrics.newEnquiries)}
          hint="Bulk orders to answer"
          href="/admin/enquiries?status=new"
          tone="alert"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Pending payment"
          value={String(metrics.pendingPayment)}
          hint="Not yet paid"
          href="/admin/orders?status=pending_payment"
        />
        <MetricCard
          label="Low stock"
          value={String(metrics.lowStockCount)}
          hint="Pack sizes at or below threshold"
          href="/admin/products"
          tone="alert"
        />
        <MetricCard label="Customers" value={String(metrics.customerCount)} href="/admin/customers" />
      </div>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="display text-h3">Recent orders</h2>
          <Link
            href="/admin/orders"
            className="text-spec text-[var(--accent)] underline underline-offset-4"
          >
            All orders
          </Link>
        </div>

        <Panel>
          {recent.rows.length === 0 ? (
            <EmptyState message="No orders yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-spec">
                <thead>
                  <tr className="border-b border-[var(--hairline)] bg-[var(--bg-panel)] text-left">
                    <Th>Order</Th>
                    <Th>Customer</Th>
                    <Th>Items</Th>
                    <Th>Total</Th>
                    <Th>Status</Th>
                    <Th>Placed</Th>
                  </tr>
                </thead>
                <tbody>
                  {recent.rows.map((order) => (
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
          )}
        </Panel>
      </section>
    </>
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
