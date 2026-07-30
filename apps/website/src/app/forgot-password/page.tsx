import type { Metadata } from 'next';

import { SiteShell } from '@/components/layout/site-shell';
import { AuthPageShell } from '@/features/auth/components/auth-page-shell';
import { ForgotPasswordForm } from '@/features/auth/components/forgot-password-form';
import { getPublishedCmsPage } from '@/services/cms';

export const metadata: Metadata = {
  title: 'Forgot password',
  description: 'Reset your 7Oz account password.',
  alternates: { canonical: '/forgot-password' },
  robots: { index: false, follow: false },
};

export default async function ForgotPasswordPage() {
  const footer = await getPublishedCmsPage('footer');

  return (
    <SiteShell footer={footer}>
      <AuthPageShell
        eyebrow="Account"
        title="Forgot password"
        description="Enter your email and we will start a password reset when an account exists."
      >
        <ForgotPasswordForm />
      </AuthPageShell>
    </SiteShell>
  );
}
