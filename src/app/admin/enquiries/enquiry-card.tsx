'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, MessageCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { ENQUIRY_STATUSES, type EnquiryStatus } from '@/models';
import { buildWhatsappLink } from '@/lib/whatsapp';
import { siteContact } from '@/config/site';
import { Panel, StatusBadge } from '../ui';

interface Enquiry {
  id: string;
  reference: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  city: string;
  purpose: string;
  productsNeeded: string;
  estimatedMonthlyVolume?: string;
  packFormat?: string;
  message?: string;
  status: EnquiryStatus;
  internalNote: string;
  receivedAt: string;
}

export function EnquiryCard({
  enquiry,
  canWrite,
}: {
  enquiry: Enquiry;
  canWrite: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<EnquiryStatus>(enquiry.status);
  const [note, setNote] = useState(enquiry.internalNote);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = status !== enquiry.status || note !== enquiry.internalNote;

  const whatsappLink = buildWhatsappLink({
    phone: enquiry.phone,
    message: `Hello ${enquiry.contactName}, thank you for your bulk enquiry with ${siteContact.tradingName} (ref ${enquiry.reference}).`,
  });

  async function save() {
    if (busy || !dirty) return;
    setBusy(true);
    setError(null);

    try {
      const response = await apiFetch(`/api/v1/admin/enquiries/${enquiry.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, internalNote: note }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setError(payload?.error?.message ?? 'The enquiry could not be updated.');
        setBusy(false);
        return;
      }

      router.refresh();
    } catch {
      setError('Could not reach the server.');
    }

    setBusy(false);
  }

  return (
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 border-b border-[var(--hairline)] px-5 py-4">
        <div>
          <p className="text-body font-medium">{enquiry.companyName}</p>
          <p className="text-micro text-[var(--fg-faint)]">
            {enquiry.reference} · {enquiry.receivedAt}
          </p>
        </div>
        <StatusBadge status={enquiry.status} />
      </div>

      <dl className="grid gap-x-8 gap-y-3 px-5 py-4 text-spec sm:grid-cols-2">
        <Field label="Contact" value={enquiry.contactName} />
        <Field label="City" value={enquiry.city} />
        <Field label="Phone" value={enquiry.phone} />
        <Field label="Email" value={enquiry.email} />
        <Field label="Purpose" value={enquiry.purpose.replace(/_/g, ' ')} />
        <Field label="Volume" value={enquiry.estimatedMonthlyVolume ?? '—'} />
        <div className="sm:col-span-2">
          <Field label="Products needed" value={enquiry.productsNeeded} />
        </div>
        {enquiry.packFormat && (
          <div className="sm:col-span-2">
            <Field label="Pack format" value={enquiry.packFormat} />
          </div>
        )}
        {enquiry.message && (
          <div className="sm:col-span-2">
            <Field label="Message" value={enquiry.message} />
          </div>
        )}
      </dl>

      <div className="flex flex-wrap items-center gap-4 border-t border-[var(--hairline)] px-5 py-3">
        <a
          href={`tel:${enquiry.phone}`}
          className="text-spec text-[var(--accent)] underline underline-offset-4"
        >
          Call
        </a>
        <a
          href={`mailto:${enquiry.email}?subject=${encodeURIComponent(`Your bulk enquiry ${enquiry.reference}`)}`}
          className="text-spec text-[var(--accent)] underline underline-offset-4"
        >
          Email
        </a>
        {whatsappLink && (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-spec text-[var(--accent)] underline underline-offset-4"
          >
            <MessageCircle size={14} /> WhatsApp
          </a>
        )}
      </div>

      {canWrite && (
        <div className="border-t border-[var(--hairline)] bg-[var(--bg-panel)] px-5 py-4">
          <div className="flex flex-wrap items-end gap-4">
            <label className="block">
              <span className="text-micro uppercase tracking-[var(--tracking-label)] text-[var(--fg-faint)]">
                Status
              </span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as EnquiryStatus)}
                className="mt-1.5 h-9 rounded-[var(--radius-control)] border border-[var(--hairline-strong)] bg-[var(--bg-raised)] px-3 text-spec capitalize outline-none focus:border-[var(--accent)]"
              >
                {ENQUIRY_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>

            <label className="block min-w-[14rem] flex-1">
              <span className="text-micro uppercase tracking-[var(--tracking-label)] text-[var(--fg-faint)]">
                Internal note
              </span>
              <input
                type="text"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={2000}
                placeholder="Quoted ₹X per kg, follow up Monday"
                className="mt-1.5 h-9 w-full rounded-[var(--radius-control)] border border-[var(--hairline-strong)] bg-[var(--bg-raised)] px-3 text-spec outline-none focus:border-[var(--accent)]"
              />
            </label>

            <button
              type="button"
              onClick={save}
              disabled={busy || !dirty}
              className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-control)] bg-[var(--accent)] px-4 text-spec text-[var(--color-cream-50)] transition-colors duration-[var(--t-fast)] hover:bg-[var(--accent-bright)] disabled:opacity-40"
            >
              {busy && <Loader2 size={14} className="animate-spin" />}
              {busy ? 'Saving' : 'Save'}
            </button>
          </div>

          {error && (
            <p role="alert" className="mt-3 text-spec text-[var(--color-flag-bad)]">
              {error}
            </p>
          )}
        </div>
      )}
    </Panel>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-micro uppercase tracking-[var(--tracking-label)] text-[var(--fg-faint)]">
        {label}
      </dt>
      <dd className="mt-0.5 leading-relaxed">{value}</dd>
    </div>
  );
}
