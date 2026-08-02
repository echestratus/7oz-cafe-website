import type { Metadata } from 'next';
import { Suspense } from 'react';

import { SiteShell } from '@/components/layout/site-shell';
import { AuthPageShell } from '@/features/auth/components/auth-page-shell';
import { VerifyEmailForm } from '@/features/auth/components/verify-email-form';
import { getPublishedCmsPage } from '@/services/cms';

export const metadata: Metadata = {
  title: 'Verify email',
  description: 'Verify your 7Oz account email address.',
  alternates: { canonical: '/verify-email' },
  robots: { index: false, follow: false },
};

export default async function VerifyEmailPage() {
  const footer = await getPublishedCmsPage('footer');

  return (
    <SiteShell footer={footer}>
      <AuthPageShell
        eyebrow="Account"
        title="Verify your email"
        description="Confirm your email to activate your account before signing in."
      >
        <Suspense
          fallback={
            <p className="text-sm text-text-secondary">Loading verification form…</p>
          }
        >
          <VerifyEmailForm />
        </Suspense>
      </AuthPageShell>
    </SiteShell>
  );
}
