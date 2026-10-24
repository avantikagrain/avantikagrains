'use client';

import { useState } from 'react';

/**
 * Bulk enquiry form.
 *
 * Every state the submission can be in is rendered: idle, submitting,
 * field-level validation errors returned by the server, a transport
 * failure, and success with the reference number. A form that only handles
 * the happy path is the most common way an enquiry silently disappears.
 */

const PURPOSES = [
  ['wholesale', 'Wholesale / distribution'],
  ['retail_stocking', 'Stocking in my retail store'],
  ['institutional', 'Hotel, restaurant or canteen'],
  ['private_label', 'Private label / own brand'],
  ['export', 'Export'],
  ['other', 'Something else'],
] as const;

type FieldErrors = Record<string, string>;

export function BulkForm() {
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [reference, setReference] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState('sending');
    setFieldErrors({});
    setFormError(null);

    const data = Object.fromEntries(new FormData(event.currentTarget));

    try {
      const response = await fetch('/api/v1/bulk-enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const payload = await response.json();

      if (!response.ok) {
        // 422 carries per-field detail; everything else is a single message.
        const details = payload?.error?.details;
        if (Array.isArray(details)) {
          setFieldErrors(
            Object.fromEntries(
              details.map((d: { field: string; message: string }) => [d.field, d.message]),
            ),
          );
          setFormError('Please correct the highlighted fields.');
        } else {
          setFormError(payload?.error?.message ?? 'Could not send the enquiry.');
        }
        setState('idle');
        return;
      }

      setReference(payload.data.reference);
      setState('sent');
    } catch {
      setFormError(
        'Could not reach the server. Check your connection, or email avantikagrain@gmail.com.',
      );
      setState('idle');
    }
  }

  if (state === 'sent') {
    return (
      <div className="border border-[var(--accent)] bg-[rgb(212 175 106 / 0.1)] p-8" role="status">
        <h2 className="display text-h3">Enquiry received</h2>
        <p className="measure mt-4 leading-relaxed text-[var(--fg-muted)]">
          Your reference is{' '}
          <span className="tabular-nums text-[var(--fg)]">{reference}</span>. Quote it in
          any follow-up. The mill replies to bulk enquiries within two working days.
        </p>
        <button
          type="button"
          onClick={() => {
            setState('idle');
            setReference(null);
          }}
          className="mt-6 text-spec text-[var(--accent)] underline decoration-1 underline-offset-4"
        >
          Send another enquiry
        </button>
      </div>
    );
  }

  const busy = state === 'sending';

  return (
    <form onSubmit={handleSubmit} noValidate>
      {formError && (
        <div
          role="alert"
          className="mb-8 border-l-2 border-[var(--color-flag-bad)] bg-[var(--bg-raised)] py-3 pl-4"
        >
          <p className="text-spec text-[var(--color-flag-bad)]">{formError}</p>
        </div>
      )}

      <fieldset disabled={busy} className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        <Field name="companyName" label="Company" error={fieldErrors.companyName} required />
        <Field name="contactName" label="Your name" error={fieldErrors.contactName} required />
        <Field
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          error={fieldErrors.email}
          required
        />
        <Field
          name="phone"
          label="Mobile"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          hint="10 digits, no country code"
          error={fieldErrors.phone}
          required
        />
        <Field name="city" label="City" autoComplete="address-level2" error={fieldErrors.city} required />

        <label className="block">
          <span className="text-spec text-[var(--fg-muted)]">
            Purpose <Required />
          </span>
          <select
            name="purpose"
            required
            defaultValue="wholesale"
            className="mt-2 h-11 w-full border border-[var(--hairline-strong)] bg-[var(--bg-raised)] px-3 outline-none focus:border-[var(--accent)]"
          >
            {PURPOSES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <div className="sm:col-span-2">
          <Field
            name="productsNeeded"
            label="Products needed"
            hint="e.g. Toor dal, chana dal, emmer wheat"
            error={fieldErrors.productsNeeded}
            required
          />
        </div>

        <Field
          name="estimatedMonthlyVolume"
          label="Monthly volume"
          hint="Optional — e.g. 500 kg, 2 tonnes"
          error={fieldErrors.estimatedMonthlyVolume}
        />
        <Field
          name="packFormat"
          label="Pack format"
          hint="Optional — e.g. 25 kg sacks, 1 kg retail"
          error={fieldErrors.packFormat}
        />

        <label className="block sm:col-span-2">
          <span className="text-spec text-[var(--fg-muted)]">Anything else</span>
          <textarea
            name="message"
            rows={4}
            className="mt-2 w-full resize-y border border-[var(--hairline-strong)] bg-[var(--bg-raised)] p-3 outline-none focus:border-[var(--accent)]"
          />
        </label>

        {/* Honeypot: hidden from people, irresistible to bots. */}
        <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
          <label>
            Website
            <input name="website" type="text" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={busy}
        className="mt-10 inline-flex h-12 min-w-56 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-[var(--accent)] px-8 text-spec text-[var(--color-cream-50)] transition-colors duration-[var(--t-fast)] hover:bg-[var(--accent-bright)] disabled:cursor-wait disabled:opacity-70"
      >
        {busy && (
          <span
            aria-hidden
            className="h-3.5 w-3.5 animate-spin rounded-full border border-current border-t-transparent"
          />
        )}
        {busy ? 'Sending' : 'Send enquiry'}
      </button>

      <p aria-live="polite" className="sr-only">
        {busy ? 'Sending your enquiry' : ''}
      </p>
    </form>
  );
}

function Required() {
  return (
    <span className="text-[var(--color-flag-bad)]" aria-hidden>
      *
    </span>
  );
}

function Field({
  name,
  label,
  type = 'text',
  hint,
  error,
  required,
  ...rest
}: {
  name: string;
  label: string;
  type?: string;
  hint?: string;
  error?: string;
  required?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const describedBy = [hint ? `${name}-hint` : null, error ? `${name}-error` : null]
    .filter(Boolean)
    .join(' ');

  return (
    <label className="block">
      <span className="text-spec text-[var(--fg-muted)]">
        {label} {required && <Required />}
      </span>
      <input
        {...rest}
        id={name}
        name={name}
        type={type}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={`mt-2 h-11 w-full border bg-[var(--bg-raised)] px-3 outline-none transition-colors ${
          error
            ? 'border-[var(--color-flag-bad)]'
            : 'border-[var(--hairline-strong)] focus:border-[var(--accent)]'
        }`}
      />
      {hint && !error && (
        <span id={`${name}-hint`} className="mt-1 block text-spec text-[var(--fg-faint)]">
          {hint}
        </span>
      )}
      {error && (
        <span id={`${name}-error`} className="mt-1 block text-spec text-[var(--color-flag-bad)]">
          {error}
        </span>
      )}
    </label>
  );
}
