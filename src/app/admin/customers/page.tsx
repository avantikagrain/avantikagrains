import { listCustomers } from '@/server/admin';
import { formatPaise } from '@/lib/format';
import { EmptyState, PageTitle, Pagination, Panel, formatDate } from '../ui';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const search = params.q?.trim() || undefined;
  const page = Math.max(1, Number(params.page ?? 1) || 1);

  const result = await listCustomers({ search, page, limit: PAGE_SIZE });

  return (
    <>
      <PageTitle
        title="Customers"
        subtitle={`${result.total} registered account${result.total === 1 ? '' : 's'}`}
      />

      <form method="get" role="search" className="mb-5 flex items-center gap-2">
        <input
          type="search"
          name="q"
          defaultValue={search ?? ''}
          placeholder="Name, email or phone"
          aria-label="Search customers"
          className="h-9 w-72 max-w-full rounded-[var(--radius-control)] border border-[var(--hairline-strong)] bg-[var(--bg-raised)] px-3 text-spec outline-none focus:border-[var(--accent)]"
        />
        <button
          type="submit"
          className="h-9 rounded-[var(--radius-control)] bg-[var(--accent)] px-4 text-spec text-[var(--color-cream-50)] transition-colors duration-[var(--t-fast)] hover:bg-[var(--accent-bright)]"
        >
          Search
        </button>
      </form>

      <Panel>
        {result.rows.length === 0 ? (
          <EmptyState message="No customers match this view." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-spec">
                <thead>
                  <tr className="border-b border-[var(--hairline)] bg-[var(--bg-panel)] text-left">
                    <Th>Name</Th>
                    <Th>Email</Th>
                    <Th>Phone</Th>
                    <Th className="text-right">Orders</Th>
                    <Th className="text-right">Lifetime value</Th>
                    <Th>Joined</Th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b border-[var(--hairline)] last:border-0 hover:bg-[var(--bg-panel)]"
                    >
                      <Td>{customer.name}</Td>
                      <Td>
                        <span className="block">{customer.email}</span>
                        {!customer.emailVerified && (
                          <span className="block text-micro text-[var(--fg-faint)]">
                            unverified
                          </span>
                        )}
                      </Td>
                      <Td className="tabular-nums text-[var(--fg-muted)]">
                        {customer.phone ?? '—'}
                      </Td>
                      <Td className="text-right tabular-nums">{customer.orderCount}</Td>
                      <Td className="text-right tabular-nums">
                        {formatPaise(customer.lifetimeValuePaise)}
                      </Td>
                      <Td className="whitespace-nowrap text-[var(--fg-faint)]">
                        {formatDate(customer.createdAt)}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={page}
              totalPages={result.totalPages}
              basePath="/admin/customers"
              params={{ q: search }}
            />
          </>
        )}
      </Panel>
    </>
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
