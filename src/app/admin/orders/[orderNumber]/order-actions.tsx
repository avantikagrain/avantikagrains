'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import type { OrderStatus } from '@/models';
import { ORDER_STATUS_LABELS } from '../../ui';

export function OrderActions({
  orderNumber,
  nextStatuses,
}: {
  orderNumber: string;
  nextStatuses: OrderStatus[];
}) {
  const router = useRouter();
  const [target, setTarget] = useState<OrderStatus>(nextStatuses[0]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const destructive = target === 'cancelled';

  async function apply() {
    if (busy) return;

    if (destructive && !note.trim()) {
      setError('A reason is required to cancel an order.');
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const response = await apiFetch(
        `/api/v1/admin/orders/${encodeURIComponent(orderNumber)}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: target, note: note.trim() || undefined }),
        },
      );

      const payload = await response.json();

      if (!response.ok) {
        setError(payload?.error?.message ?? 'The status could not be updated.');
        setBusy(false);
        return;
      }

      setNote('');
      router.refresh();
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    }

    setBusy(false);
  }

  return (
    <div>
      <label className="block">
        <span className="text-micro uppercase tracking-[var(--tracking-label)] text-[var(--fg-faint)]">
          Move to
        </span>
        <select
          value={target}
          onChange={(event) => setTarget(event.target.value as OrderStatus)}
          className="mt-2 h-10 w-full rounded-[var(--radius-control)] border border-[var(--hairline-strong)] bg-[var(--bg-raised)] px-3 text-spec outline-none focus:border-[var(--accent)]"
        >
          {nextStatuses.map((status) => (
            <option key={status} value={status}>
              {ORDER_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-4 block">
        <span className="text-micro uppercase tracking-[var(--tracking-label)] text-[var(--fg-faint)]">
          Note {destructive ? '(required)' : '(optional)'}
        </span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          maxLength={500}
          placeholder={destructive ? 'Why is this order being cancelled?' : 'Recorded in the history'}
          className="mt-2 w-full resize-y rounded-[var(--radius-control)] border border-[var(--hairline-strong)] bg-[var(--bg-raised)] p-3 text-spec outline-none focus:border-[var(--accent)]"
        />
      </label>

      {error && (
        <p role="alert" className="mt-3 text-spec text-[var(--color-flag-bad)]">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={apply}
        disabled={busy}
        className={`mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] px-4 text-spec transition-colors duration-[var(--t-fast)] disabled:cursor-wait disabled:opacity-70 ${
          destructive
            ? 'bg-[var(--color-flag-bad)] text-[var(--color-cream-50)]'
            : 'bg-[var(--accent)] text-[var(--color-cream-50)] hover:bg-[var(--accent-bright)]'
        }`}
      >
        {busy && <Loader2 size={15} className="animate-spin" />}
        {busy ? 'Updating' : destructive ? 'Cancel order' : 'Update status'}
      </button>
    </div>
  );
}
