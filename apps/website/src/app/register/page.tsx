import type { Metadata } from 'next';

import { SiteShell } from '@/components/layout/site-shell';
import { AuthPageShell } from '@/features/auth/components/auth-page-shell';
import { RegisterForm } from '@/features/auth/components/register-form';
import { getPublishedCmsPage } from '@/services/cms';

export const metadata: Metadata = {
  title: 'Create account',
  description: 'Create a 7Oz customer account to track membership and loyalty.',
  alternates: { canonical: '/register' },
  robots: { index: false, follow: false },
};

export default async function RegisterPage() {
  const footer = await getPublishedCmsPage('footer');

  return (
    <SiteShell footer={footer}>
      <AuthPageShell
        eyebrow="Account"
        title="Create your account"
        description="Join 7Oz to follow membership progression and loyalty points from your visits."
      >
        <RegisterForm />
      </AuthPageShell>
    </SiteShell>
  );
}
