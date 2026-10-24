import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/site/page-header';
import { AuthForm } from '../auth-form';

export const metadata: Metadata = {
  title: 'Create an account',
  description: 'Create an Avantika Grain Mills account to track orders and save addresses.',
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <>
      <PageHeader
        crumb={{ label: 'Avantika', href: '/' }}
        title="Create an account."
        intro="Keep your orders, addresses and delivery updates in one place. Ordering as a guest works too."
      />

      <div className="mx-auto max-w-md px-4 py-14 sm:px-6 sm:py-16">
        <Suspense fallback={<div className="panel h-96 rounded-[var(--radius-panel-lg)]" />}>
          <AuthForm mode="register" />
        </Suspense>
      </div>
    </>
  );
}
