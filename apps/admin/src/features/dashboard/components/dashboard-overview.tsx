'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { ApiClientError } from '@/lib/api-client';
import { listAdminBlogs } from '@/services/blog';
import { listCustomers } from '@/services/customers';
import { listLoyaltyAccounts } from '@/services/loyalty';
import { listMemberships } from '@/services/membership';
import { listReservations, type Reservation } from '@/services/reservations';
import { useAuthStore } from '@/stores/auth-store';

function todayISODate(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 10);
}

const quickLinks = [
  { href: '/reservations', label: 'Reservations', permission: 'reservation.manage' },
  { href: '/customers', label: 'Customers', permission: 'customer.read' },
  { href: '/membership', label: 'Membership', permission: 'membership.manage' },
  { href: '/loyalty', label: 'Loyalty', permission: 'loyalty.manage' },
  { href: '/blogs', label: 'Blogs', permission: 'blog.manage' },
  { href: '/cms', label: 'CMS', permission: 'cms.manage' },
  { href: '/media', label: 'Media', permission: 'cms.manage' },
] as const;

export function DashboardOverview() {
  const user = useAuthStore((state) => state.user);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const today = todayISODate();

  const canReservations = hasPermission('reservation.manage');
  const canCustomers = hasPermission('customer.read');
  const canMembership = hasPermission('membership.manage');
  const canLoyalty = hasPermission('loyalty.manage');
  const canBlogs = hasPermission('blog.manage');

  const todayReservationsQuery = useQuery({
    queryKey: ['admin-dashboard', 'reservations-today', today],
    queryFn: () => listReservations({ date: today, limit: 1 }),
    enabled: canReservations,
  });
  const pendingReservationsQuery = useQuery({
    queryKey: ['admin-dashboard', 'reservations-pending'],
    queryFn: () => listReservations({ status: 'pending', limit: 1 }),
    enabled: canReservations,
  });
  const todayListQuery = useQuery({
    queryKey: ['admin-dashboard', 'reservations-today-list', today],
    queryFn: () => listReservations({ date: today, limit: 8 }),
    enabled: canReservations,
  });
  const customersQuery = useQuery({
    queryKey: ['admin-dashboard', 'customers'],
    queryFn: () => listCustomers({ limit: 1 }),
    enabled: canCustomers,
  });
  const membersQuery = useQuery({
    queryKey: ['admin-dashboard', 'memberships-active'],
    queryFn: () => listMemberships({ status: 'active', limit: 1 }),
    enabled: canMembership,
  });
  const loyaltyQuery = useQuery({
    queryKey: ['admin-dashboard', 'loyalty-accounts'],
    queryFn: () => listLoyaltyAccounts(1, 1),
    enabled: canLoyalty,
  });
  const draftBlogsQuery = useQuery({
    queryKey: ['admin-dashboard', 'blogs-draft'],
    queryFn: () => listAdminBlogs({ status: 'draft', limit: 1 }),
    enabled: canBlogs,
  });

  const visibleQuickLinks = quickLinks.filter((link) => hasPermission(link.permission));

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user?.fullName ?? 'operator'}.`}
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Signed in as"
          value={user?.email ?? '—'}
          hint={user?.roles.join(', ') || undefined}
        />
        {canReservations ? (
          <>
            <StatCard
              label="Today's reservations"
              value={formatTotal(todayReservationsQuery)}
              hint={today}
              href="/reservations"
            />
            <StatCard
              label="Pending reservations"
              value={formatTotal(pendingReservationsQuery)}
              hint="Needs review"
              href="/reservations"
            />
          </>
        ) : null}
        {canCustomers ? (
          <StatCard
            label="Customers"
            value={formatTotal(customersQuery)}
            href="/customers"
          />
        ) : null}
        {canMembership ? (
          <StatCard
            label="Active members"
            value={formatTotal(membersQuery)}
            href="/membership"
          />
        ) : null}
        {canLoyalty ? (
          <StatCard
            label="Loyalty accounts"
            value={formatTotal(loyaltyQuery)}
            href="/loyalty"
          />
        ) : null}
        {canBlogs ? (
          <StatCard
            label="Draft blogs"
            value={formatTotal(draftBlogsQuery)}
            href="/blogs"
          />
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <section className="rounded-[16px] border border-border bg-surface p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-medium text-text">Today&apos;s reservations</h2>
            {canReservations ? (
              <Link href="/reservations" className="text-sm text-primary hover:text-primary-hover">
                View all
              </Link>
            ) : null}
          </div>

          {!canReservations ? (
            <p className="text-sm text-text-secondary">You do not have reservation access.</p>
          ) : null}
          {canReservations && todayListQuery.isLoading ? (
            <p className="text-sm text-text-secondary">Loading reservations…</p>
          ) : null}
          {canReservations && todayListQuery.error ? (
            <p className="text-sm text-red-700" role="alert">
              {todayListQuery.error instanceof ApiClientError
                ? todayListQuery.error.message
                : 'Unable to load reservations.'}
            </p>
          ) : null}
          {canReservations && !todayListQuery.isLoading && (todayListQuery.data?.items.length ?? 0) === 0 ? (
            <p className="text-sm text-text-secondary">No reservations scheduled for today.</p>
          ) : null}

          <ul className="space-y-3">
            {(todayListQuery.data?.items ?? []).map((item) => (
              <ReservationRow key={item.id} reservation={item} />
            ))}
          </ul>
        </section>

        <section className="rounded-[16px] border border-border bg-surface p-5">
          <h2 className="mb-4 text-lg font-medium text-text">Quick actions</h2>
          {visibleQuickLinks.length === 0 ? (
            <p className="text-sm text-text-secondary">No modules available for this account.</p>
          ) : (
            <ul className="space-y-2">
              {visibleQuickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center justify-between rounded-[12px] border border-border px-3 py-2.5 text-sm text-text transition-colors hover:bg-surface-secondary"
                  >
                    <span>{link.label}</span>
                    <span aria-hidden="true" className="text-text-muted">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function formatTotal(query: {
  isLoading: boolean;
  isError: boolean;
  data?: { total: number };
}): string {
  if (query.isLoading) {
    return '…';
  }
  if (query.isError || !query.data) {
    return '—';
  }
  return String(query.data.total);
}

function StatCard({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  href?: string;
}) {
  const body = (
    <>
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="mt-2 text-2xl font-medium text-text">{value}</p>
      {hint ? <p className="mt-1 text-xs text-text-muted">{hint}</p> : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="rounded-[16px] border border-border bg-surface p-5 transition-colors hover:bg-surface-secondary"
      >
        {body}
      </Link>
    );
  }

  return <article className="rounded-[16px] border border-border bg-surface p-5">{body}</article>;
}

function ReservationRow({ reservation }: { reservation: Reservation }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 first:border-t-0 first:pt-0">
      <div>
        <p className="text-sm font-medium text-text">{reservation.guestFullName}</p>
        <p className="text-xs text-text-secondary">
          {reservation.time} · {reservation.guestCount} guests · {reservation.reservationNumber}
        </p>
      </div>
      <span className="rounded-full bg-surface-secondary px-3 py-1 text-xs capitalize text-text">
        {reservation.status.replaceAll('_', ' ')}
      </span>
    </li>
  );
}
