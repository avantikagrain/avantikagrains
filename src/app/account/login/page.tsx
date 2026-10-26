import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/site/page-header';
import { AuthForm } from '../auth-form';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your Avantika Grain Mills account to view orders and saved addresses.',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <>
      <PageHeader
        crumb={{ label: 'Avantika', href: '/' }}
        title="Welcome back."
        intro="Sign in to see your orders, track a delivery and reuse saved addresses."
      />

      <div className="mx-auto max-w-md px-4 py-14 sm:px-6 sm:py-16">

        <Suspense fallback={<div className="panel h-96 rounded-[var(--radius-panel-lg)]" />}>
          <AuthForm mode="login" />
        </Suspense>
      </div>
    </>
  );
}
