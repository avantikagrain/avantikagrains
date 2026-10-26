import Link from 'next/link';
import { listEnquiries } from '@/server/admin';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/rbac';
import { ENQUIRY_STATUSES, type EnquiryStatus } from '@/models';
import { EmptyState, PageTitle, Pagination, Panel, formatDateTime } from '../ui';
import { EnquiryCard } from './enquiry-card';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

function parseStatus(value?: string): EnquiryStatus | undefined {
  if (!value) return undefined;
  return (ENQUIRY_STATUSES as readonly string[]).includes(value)
    ? (value as EnquiryStatus)
    : undefined;
}

export default async function AdminEnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const params = await searchParams;
  const status = parseStatus(params.status);
  const page = Math.max(1, Number(params.page ?? 1) || 1);

  const [result, session] = await Promise.all([
    listEnquiries({ status, page, limit: PAGE_SIZE }),
    getSession(),
  ]);

  const canWrite = session ? hasPermission(session.role, 'customer:write') : false;

  return (
    <>
      <PageTitle
        title="Bulk enquiries"
        subtitle={`${result.total} enquir${result.total === 1 ? 'y' : 'ies'}`}
      />

      <nav aria-label="Filter by status" className="mb-5 flex flex-wrap gap-1.5">
        <Chip href="/admin/enquiries" label="All" active={!status} />
        {ENQUIRY_STATUSES.map((value) => (
          <Chip
            key={value}
            href={`/admin/enquiries?status=${value}`}
            label={value}
            active={status === value}
          />
        ))}
      </nav>

      {result.rows.length === 0 ? (
        <Panel>
          <EmptyState message="No enquiries in this view." />
        </Panel>
      ) : (
        <>
          <ul className="space-y-4">
            {result.rows.map((enquiry) => (
              <li key={String(enquiry._id)}>
                <EnquiryCard
                  canWrite={canWrite}
                  enquiry={{
                    id: String(enquiry._id),
                    reference: enquiry.reference,
                    companyName: enquiry.companyName,
                    contactName: enquiry.contactName,
                    email: enquiry.email,
                    phone: enquiry.phone,
                    city: enquiry.city,
                    purpose: enquiry.purpose,
                    productsNeeded: enquiry.productsNeeded,
                    estimatedMonthlyVolume: enquiry.estimatedMonthlyVolume,
                    packFormat: enquiry.packFormat,
                    message: enquiry.message,
                    status: enquiry.status,
                    internalNote: enquiry.internalNote ?? '',
                    receivedAt: formatDateTime(enquiry.createdAt),
                  }}
                />
              </li>
            ))}
          </ul>

          <div className="mt-4">
            <Panel>
              <Pagination
                page={page}
                totalPages={result.totalPages}
                basePath="/admin/enquiries"
                params={{ status }}
              />
            </Panel>
          </div>
        </>
      )}
    </>
  );
}

function Chip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? 'true' : undefined}
      className={`rounded-[var(--radius-pill)] border px-3 py-1.5 text-micro capitalize transition-colors duration-[var(--t-fast)] ${
        active
          ? 'border-[var(--accent)] bg-[var(--color-forest-100)] font-medium text-[var(--accent)]'
          : 'border-[var(--hairline-strong)] text-[var(--fg-muted)] hover:border-[var(--accent)]'
      }`}
    >
      {label}
    </Link>
  );
}
