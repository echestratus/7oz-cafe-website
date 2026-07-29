'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { ApiClientError } from '@/lib/api-client';
import {
  adjustLoyalty,
  listLoyaltyAccounts,
  listLoyaltyCampaigns,
  listLoyaltyHistory,
} from '@/services/loyalty';

export function LoyaltyManager() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'accounts' | 'history' | 'campaigns'>('accounts');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [userId, setUserId] = useState('');
  const [points, setPoints] = useState(50);
  const [reason, setReason] = useState('');

  const accountsQuery = useQuery({
    queryKey: ['admin-loyalty-accounts'],
    queryFn: () => listLoyaltyAccounts(1, 50),
    enabled: tab === 'accounts',
  });
  const historyQuery = useQuery({
    queryKey: ['admin-loyalty-history'],
    queryFn: () => listLoyaltyHistory(1, 40),
    enabled: tab === 'history',
  });
  const campaignsQuery = useQuery({
    queryKey: ['admin-loyalty-campaigns'],
    queryFn: () => listLoyaltyCampaigns(),
    enabled: tab === 'campaigns',
  });

  const adjustMutation = useMutation({
    mutationFn: () =>
      adjustLoyalty({
        userId: userId.trim(),
        points,
        reason: reason.trim(),
      }),
    onSuccess: async () => {
      setError(null);
      setMessage('Adjustment applied.');
      setReason('');
      await queryClient.invalidateQueries({ queryKey: ['admin-loyalty-accounts'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-loyalty-history'] });
    },
    onError: (err) => {
      setMessage(null);
      setError(err instanceof ApiClientError ? err.message : 'Adjustment failed.');
    },
  });

  return (
    <div>
      <PageHeader
        title="Loyalty"
        description="Review balances, apply audited adjustments, and monitor campaigns."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {(
          [
            ['accounts', 'Accounts'],
            ['history', 'History'],
            ['campaigns', 'Campaigns'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`rounded-[12px] px-4 py-2 text-sm ${
              tab === value ? 'bg-primary text-white' : 'border border-border text-text'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {message ? (
        <p className="mb-4 rounded-[12px] border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mb-4 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {tab === 'accounts' ? (
        <div className="space-y-6">
          <form
            className="grid gap-3 rounded-[16px] border border-border bg-surface p-4 md:grid-cols-4"
            onSubmit={(event) => {
              event.preventDefault();
              adjustMutation.mutate();
            }}
          >
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="text-text-secondary">Customer user ID</span>
              <input
                required
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-text-secondary">Points (+/-)</span>
              <input
                type="number"
                required
                value={points}
                onChange={(event) => setPoints(Number(event.target.value) || 0)}
                className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm md:col-span-3">
              <span className="text-text-secondary">Reason</span>
              <input
                required
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
              />
            </label>
            <button
              type="submit"
              disabled={adjustMutation.isPending}
              className="rounded-[12px] bg-primary px-4 py-2 text-sm text-white hover:bg-primary-hover disabled:opacity-60 md:self-end"
            >
              Adjust
            </button>
          </form>

          {accountsQuery.isLoading ? <p className="text-sm text-text-secondary">Loading accounts…</p> : null}
          <div className="space-y-3">
            {(accountsQuery.data?.items ?? []).map((account) => (
              <article key={account.id} className="rounded-[16px] border border-border bg-surface p-4">
                <p className="font-medium text-text">
                  {account.userFullName || 'Customer'}{' '}
                  <span className="text-sm font-normal text-text-secondary">· {account.balance} pts</span>
                </p>
                <p className="text-sm text-text-secondary">{account.userEmail}</p>
                <p className="text-sm text-text-muted">
                  Earned {account.lifetimeEarned} · Redeemed {account.lifetimeRedeemed}
                </p>
                <p className="mt-1 text-xs text-text-muted">{account.userId}</p>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {tab === 'history' ? (
        <div className="space-y-3">
          {historyQuery.isLoading ? <p className="text-sm text-text-secondary">Loading history…</p> : null}
          {(historyQuery.data?.items ?? []).map((item) => (
            <article key={item.id} className="rounded-[16px] border border-border bg-surface p-4">
              <p className="font-medium capitalize text-text">
                {item.type} · {item.points > 0 ? '+' : ''}
                {item.points}
              </p>
              <p className="text-sm text-text-secondary">
                {item.userFullName || item.userEmail} · {item.description}
              </p>
              <p className="text-xs text-text-muted">{new Date(item.createdAt).toLocaleString()}</p>
            </article>
          ))}
        </div>
      ) : null}

      {tab === 'campaigns' ? (
        <div className="space-y-3">
          {campaignsQuery.isLoading ? <p className="text-sm text-text-secondary">Loading campaigns…</p> : null}
          {(campaignsQuery.data ?? []).map((campaign) => (
            <article key={campaign.id} className="rounded-[16px] border border-border bg-surface p-4">
              <p className="font-medium text-text">{campaign.name}</p>
              <p className="text-sm text-text-secondary">{campaign.description}</p>
              <p className="text-sm text-text-muted">
                {campaign.pointMultiplier}x · +{campaign.bonusPoints} bonus ·{' '}
                {campaign.isActive ? 'Active' : 'Inactive'}
              </p>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
