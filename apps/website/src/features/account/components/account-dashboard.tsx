'use client';

import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { ApiClientError } from '@/lib/api-client';
import {
  getCustomerLoyaltyAccount,
  getCustomerLoyaltyHistory,
} from '@/services/customer-loyalty';
import {
  getCustomerMembership,
  getCustomerMembershipBenefits,
  getCustomerMembershipHistory,
} from '@/services/customer-membership';
import { useAuthStore } from '@/stores/auth-store';

import { AccountReservationsSection } from './account-reservations-section';
import { LoyaltyRedeemSection } from './loyalty-redeem-section';

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
  }).format(date);
}

export function AccountDashboard() {
  const user = useAuthStore((state) => state.user);

  const membershipQuery = useQuery({
    queryKey: ['customer-membership'],
    queryFn: getCustomerMembership,
  });
  const benefitsQuery = useQuery({
    queryKey: ['customer-membership-benefits'],
    queryFn: getCustomerMembershipBenefits,
  });
  const membershipHistoryQuery = useQuery({
    queryKey: ['customer-membership-history'],
    queryFn: getCustomerMembershipHistory,
  });
  const loyaltyQuery = useQuery({
    queryKey: ['customer-loyalty'],
    queryFn: getCustomerLoyaltyAccount,
  });
  const loyaltyHistoryQuery = useQuery({
    queryKey: ['customer-loyalty-history'],
    queryFn: getCustomerLoyaltyHistory,
  });

  const membership = membershipQuery.data;
  const loyalty = loyaltyQuery.data;

  return (
    <div className="space-y-16">
      <section className="space-y-4 border-b border-border pb-10">
        <p className="text-eyebrow">Your account</p>
        <h1 className="text-page-title text-text">{user?.fullName ?? 'Welcome'}</h1>
        <p className="text-lede max-w-2xl">{user?.email}</p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button href="/reservations" variant="outline">
            Reserve a table
          </Button>
          <Button href="/membership" variant="ghost">
            Membership program
          </Button>
          <Button href="/loyalty" variant="ghost">
            Loyalty rewards
          </Button>
        </div>
      </section>

      <AccountReservationsSection />

      <section className="space-y-6" aria-labelledby="membership-heading">
        <h2 id="membership-heading" className="text-section-title text-text">
          Membership
        </h2>
        {membershipQuery.isLoading ? (
          <p className="text-sm text-text-secondary">Loading membership…</p>
        ) : null}
        {membershipQuery.error ? (
          <p className="text-sm text-red-700" role="alert">
            {membershipQuery.error instanceof ApiClientError
              ? membershipQuery.error.message
              : 'Unable to load membership.'}
          </p>
        ) : null}
        {membership ? (
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-3 border-t border-border pt-6">
              <p className="text-eyebrow">{membership.level.code}</p>
              <h3 className="text-card-title text-text">{membership.level.name}</h3>
              <p className="text-sm text-text-secondary">
                Member #{membership.membershipNumber} ·{' '}
                <span className="capitalize">{membership.status}</span>
              </p>
              <p className="text-sm text-text-secondary">
                Joined {formatDate(membership.joinedAt)}
              </p>
            </div>
            <div className="space-y-3 border-t border-border pt-6">
              <h3 className="text-card-title text-text">Progress</h3>
              <p className="text-sm text-text-secondary">
                {membership.progress.completedReservations} completed visits
              </p>
              <p className="text-sm text-text-secondary">
                {membership.progress.lifetimeLoyaltyPoints} lifetime loyalty points
              </p>
              {membership.progress.nextLevelName ? (
                <p className="text-sm text-text">
                  Next: {membership.progress.nextLevelName}
                  {typeof membership.progress.reservationsRemaining === 'number'
                    ? ` · ${membership.progress.reservationsRemaining} visits remaining`
                    : null}
                </p>
              ) : (
                <p className="text-sm text-text-secondary">You are at the top level.</p>
              )}
            </div>
          </div>
        ) : null}

        {benefitsQuery.data && benefitsQuery.data.length > 0 ? (
          <div className="space-y-4 pt-4">
            <h3 className="text-card-title text-text">Your benefits</h3>
            <ul className="grid gap-4 md:grid-cols-2">
              {benefitsQuery.data.map((benefit) => (
                <li key={benefit.id} className="space-y-1 border-t border-border pt-4">
                  <p className="text-sm font-medium text-text">{benefit.title}</p>
                  <p className="text-sm text-text-secondary">{benefit.description}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {membershipHistoryQuery.data && membershipHistoryQuery.data.length > 0 ? (
          <div className="space-y-4 pt-4">
            <h3 className="text-card-title text-text">Membership history</h3>
            <ul className="space-y-3">
              {membershipHistoryQuery.data.slice(0, 5).map((item) => (
                <li key={item.id} className="text-sm text-text-secondary">
                  <span className="text-text">{item.toLevelName}</span>
                  {item.reason ? ` · ${item.reason}` : null}
                  <span className="text-text-muted"> · {formatDate(item.createdAt)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="space-y-6" aria-labelledby="loyalty-heading">
        <h2 id="loyalty-heading" className="text-section-title text-text">
          Loyalty
        </h2>
        {loyaltyQuery.isLoading ? (
          <p className="text-sm text-text-secondary">Loading loyalty…</p>
        ) : null}
        {loyaltyQuery.error ? (
          <p className="text-sm text-red-700" role="alert">
            {loyaltyQuery.error instanceof ApiClientError
              ? loyaltyQuery.error.message
              : 'Unable to load loyalty.'}
          </p>
        ) : null}
        {loyalty ? (
          <>
            <div className="grid gap-8 sm:grid-cols-3">
              <div className="space-y-2 border-t border-border pt-6">
                <p className="text-eyebrow">Balance</p>
                <p className="text-page-title text-text">{loyalty.balance}</p>
              </div>
              <div className="space-y-2 border-t border-border pt-6">
                <p className="text-eyebrow">Lifetime earned</p>
                <p className="text-section-title text-text">{loyalty.lifetimeEarned}</p>
              </div>
              <div className="space-y-2 border-t border-border pt-6">
                <p className="text-eyebrow">Lifetime redeemed</p>
                <p className="text-section-title text-text">{loyalty.lifetimeRedeemed}</p>
              </div>
            </div>
            <LoyaltyRedeemSection balance={loyalty.balance} />
          </>
        ) : null}

        {loyaltyHistoryQuery.data && loyaltyHistoryQuery.data.length > 0 ? (
          <div className="space-y-4 pt-4">
            <h3 className="text-card-title text-text">Recent activity</h3>
            <ul className="space-y-3">
              {loyaltyHistoryQuery.data.slice(0, 8).map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 border-t border-border pt-3 text-sm"
                >
                  <span className="text-text-secondary">
                    <span className="capitalize text-text">{item.type}</span>
                    {item.description ? ` · ${item.description}` : null}
                    <span className="text-text-muted"> · {formatDate(item.createdAt)}</span>
                  </span>
                  <span className="font-medium text-text">
                    {item.points > 0 ? `+${item.points}` : item.points}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : loyalty && !loyaltyHistoryQuery.isLoading ? (
          <p className="text-sm text-text-secondary">
            No loyalty activity yet. Points appear after completed reservations.
          </p>
        ) : null}
      </section>
    </div>
  );
}
