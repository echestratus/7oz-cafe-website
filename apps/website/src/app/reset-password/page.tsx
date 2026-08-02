import type { Metadata } from 'next';
import { Suspense } from 'react';

import { SiteShell } from '@/components/layout/site-shell';
import { AuthPageShell } from '@/features/auth/components/auth-page-shell';
import { ResetPasswordForm } from '@/features/auth/components/reset-password-form';
import { getPublishedCmsPage } from '@/services/cms';

export const metadata: Metadata = {
  title: 'Reset password',
  description: 'Choose a new password for your 7Oz account.',
  alternates: { canonical: '/reset-password' },
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage() {
  const footer = await getPublishedCmsPage('footer');

  return (
    <SiteShell footer={footer}>
      <AuthPageShell
        eyebrow="Account"
        title="Reset password"
        description="Enter your reset token and choose a new password."
      >
        <Suspense
          fallback={
            <p className="text-sm text-text-secondary">Loading reset form…</p>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </AuthPageShell>
    </SiteShell>
  );
}
