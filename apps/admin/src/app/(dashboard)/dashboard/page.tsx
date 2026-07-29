'use client';

import Link from 'next/link';

import { PageHeader } from '@/components/layout/page-header';
import { useAuthStore } from '@/stores/auth-store';

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const hasPermission = useAuthStore((state) => state.hasPermission);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user?.fullName ?? 'operator'}.`}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[16px] border border-border bg-surface p-5">
          <p className="text-sm text-text-secondary">Signed in as</p>
          <p className="mt-2 text-lg font-medium text-text">{user?.email}</p>
          <p className="mt-1 text-xs text-text-muted">{user?.roles.join(', ')}</p>
        </article>

        <article className="rounded-[16px] border border-border bg-surface p-5">
          <p className="text-sm text-text-secondary">CMS</p>
          <p className="mt-2 text-lg font-medium text-text">
            {hasPermission('cms.manage') ? 'Available' : 'No access'}
          </p>
          {hasPermission('cms.manage') ? (
            <Link href="/cms" className="mt-3 inline-block text-sm text-primary hover:text-primary-hover">
              Manage content
            </Link>
          ) : null}
        </article>

        <article className="rounded-[16px] border border-border bg-surface p-5">
          <p className="text-sm text-text-secondary">Coming next</p>
          <p className="mt-2 text-lg font-medium text-text">Reservations</p>
          <p className="mt-1 text-xs text-text-muted">Membership, loyalty, and analytics follow.</p>
        </article>
      </div>
    </div>
  );
}
