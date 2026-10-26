'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';

export function InternalNote({
  orderNumber,
  initial,
}: {
  orderNumber: string;
  initial: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = value !== initial;

  async function save() {
    if (busy || !dirty) return;
    setBusy(true);
    setError(null);
    setSaved(false);

    try {
      const response = await apiFetch(
        `/api/v1/admin/orders/${encodeURIComponent(orderNumber)}/note`,
        { method: 'PATCH', body: JSON.stringify({ internalNote: value }) },
      );

      if (!response.ok) {
        const payload = await response.json();
        setError(payload?.error?.message ?? 'The note could not be saved.');
        setBusy(false);
        return;
      }

      setSaved(true);
      router.refresh();
    } catch {
      setError('Could not reach the server.');
    }

    setBusy(false);
  }

  return (
    <div>
      <textarea
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setSaved(false);
        }}
        rows={4}
        maxLength={2000}
        placeholder="Visible to staff only"
        className="w-full resize-y rounded-[var(--radius-control)] border border-[var(--hairline-strong)] bg-[var(--bg-raised)] p-3 text-spec outline-none focus:border-[var(--accent)]"
      />

      {error && (
        <p role="alert" className="mt-2 text-spec text-[var(--color-flag-bad)]">
          {error}
        </p>
      )}

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={busy || !dirty}
          className="h-9 rounded-[var(--radius-control)] border border-[var(--hairline-strong)] px-4 text-spec text-[var(--fg-muted)] transition-colors duration-[var(--t-fast)] hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-40"
        >
          {busy ? 'Saving' : 'Save note'}
        </button>
        {saved && !dirty && (
          <span aria-live="polite" className="text-micro text-[var(--color-flag-good)]">
            Saved
          </span>
        )}
      </div>
    </div>
  );
}
