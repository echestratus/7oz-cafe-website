import type { Metadata } from 'next';

import { SiteShell } from '@/components/layout/site-shell';
import { Container } from '@/components/ui/container';
import { AccountDashboard } from '@/features/account/components/account-dashboard';
import { AuthGuard } from '@/features/auth/components/auth-guard';
import { getPublishedCmsPage } from '@/services/cms';

export const metadata: Metadata = {
  title: 'Account',
  description: 'View your 7Oz membership status and loyalty points.',
  alternates: { canonical: '/account' },
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const footer = await getPublishedCmsPage('footer');

  return (
    <SiteShell footer={footer}>
      <main className="pt-28 pb-24 md:pt-36 md:pb-32">
        <Container>
          <AuthGuard>
            <AccountDashboard />
          </AuthGuard>
        </Container>
      </main>
    </SiteShell>
  );
}
