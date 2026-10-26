'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

type Mode = 'login' | 'register';

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const rawNext = params.get('next') ?? '/account/orders';
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/account/orders';

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setFormError(null);
    setFieldErrors({});

    const data = Object.fromEntries(new FormData(event.currentTarget));

    try {
      const response = await fetch(`/api/v1/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const payload = await response.json();

      if (!response.ok) {
        const details = payload?.error?.details;
        if (Array.isArray(details)) {
          setFieldErrors(
            Object.fromEntries(
              details.map((d: { field: string; message: string }) => [d.field, d.message]),
            ),
          );
          setFormError('Please correct the highlighted fields.');
        } else {
          setFormError(payload?.error?.message ?? 'Something went wrong.');
        }
        setBusy(false);
        return;
      }

      router.replace(next);
      router.refresh();
    } catch {
      setFormError('Could not reach the server. Check your connection and try again.');
      setBusy(false);
    }
  }

  const isRegister = mode === 'register';

  return (
    <form onSubmit={handleSubmit} noValidate className="panel rounded-[var(--radius-panel-lg)] p-7 sm:p-9">
      {formError && (
        <div
          role="alert"
          className="mb-6 rounded-[var(--radius-control)] border-l-[3px] border-[var(--color-flag-bad)] bg-[var(--bg-sunken)] px-4 py-3"
        >
          <p className="text-spec text-[var(--color-flag-bad)]">{formError}</p>
        </div>
      )}

      <fieldset disabled={busy} className="space-y-5">
        {isRegister && (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field name="firstName" label="First name" autoComplete="given-name" error={fieldErrors.firstName} required />
            <Field name="lastName" label="Last name" autoComplete="family-name" error={fieldErrors.lastName} />
          </div>
        )}

        <Field
          name="email"
          type="email"
          label="Email"
          autoComplete="email"
          error={fieldErrors.email}
          required
        />

        <Field
          name="password"
          type="password"
          label="Password"
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          hint={isRegister ? 'At least 12 characters' : undefined}
          error={fieldErrors.password}
          required
        />

        {isRegister && (
          <Field
            name="phone"
            type="tel"
            label="Mobile"
            inputMode="numeric"
            autoComplete="tel"
            hint="Optional — 10 digits, for delivery updates"
            error={fieldErrors.phone}
          />
        )}

        {isRegister && (
          <label className="flex items-start gap-3 text-spec text-[var(--fg-muted)]">
            <input
              type="checkbox"
              name="marketingOptIn"
              value="true"
              className="mt-0.5 h-4 w-4 accent-[var(--accent)]"
            />
            Send me occasional email about new products and offers.
          </label>
        )}
      </fieldset>

      <button type="submit" disabled={busy} className="btn btn-primary mt-7 w-full">
        {busy && <Loader2 size={16} className="animate-spin" />}
        {busy ? 'Please wait' : isRegister ? 'Create account' : 'Sign in'}
      </button>

      <p className="mt-6 text-center text-spec text-[var(--fg-muted)]">
        {isRegister ? 'Already have an account? ' : 'New here? '}
        <Link
          href={isRegister ? '/account/login' : '/account/register'}
          className="font-medium text-[var(--accent)] underline underline-offset-4"
        >
          {isRegister ? 'Sign in' : 'Create an account'}
        </Link>
      </p>

      <p className="mt-3 text-center text-micro text-[var(--fg-faint)]">
        You can also check out as a guest — an account is not required to order.
      </p>
    </form>
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
        {label}
        {required && <span className="text-[var(--color-flag-bad)]" aria-hidden> *</span>}
      </span>
      <input
        {...rest}
        id={name}
        name={name}
        type={type}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={`mt-2 h-12 w-full rounded-[var(--radius-control)] border bg-[var(--bg-raised)] px-3.5 outline-none transition-colors ${
          error
            ? 'border-[var(--color-flag-bad)]'
            : 'border-[var(--hairline-strong)] focus:border-[var(--accent)]'
        }`}
      />
      {hint && !error && (
        <span id={`${name}-hint`} className="mt-1.5 block text-micro text-[var(--fg-faint)]">
          {hint}
        </span>
      )}
      {error && (
        <span id={`${name}-error`} className="mt-1.5 block text-micro text-[var(--color-flag-bad)]">
          {error}
        </span>
      )}
    </label>
  );
}
