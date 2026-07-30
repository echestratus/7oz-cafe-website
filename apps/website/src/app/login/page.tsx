import type { Metadata } from 'next';
import { Suspense } from 'react';

import { SiteShell } from '@/components/layout/site-shell';
import { AuthPageShell } from '@/features/auth/components/auth-page-shell';
import { LoginForm } from '@/features/auth/components/login-form';
import { getPublishedCmsPage } from '@/services/cms';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your 7Oz account to view membership and loyalty.',
  alternates: { canonical: '/login' },
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const footer = await getPublishedCmsPage('footer');

  return (
    <SiteShell footer={footer}>
      <AuthPageShell
        eyebrow="Account"
        title="Sign in"
        description="Access your membership status, loyalty balance, and account details."
      >
        <Suspense
          fallback={
            <p className="text-sm text-text-secondary">Loading sign-in form…</p>
          }
        >
          <LoginForm />
        </Suspense>
      </AuthPageShell>
    </SiteShell>
  );
}
