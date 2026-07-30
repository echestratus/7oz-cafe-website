'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { ApiClientError } from '@/lib/api-client';
import {
  adjustLoyalty,
  createLoyaltyReward,
  deleteLoyaltyReward,
  listLoyaltyAccounts,
  listLoyaltyCampaigns,
  listLoyaltyHistory,
  listLoyaltyRewards,
  updateLoyaltyReward,
  type LoyaltyReward,
} from '@/services/loyalty';

type RewardFormState = {
  code: string;
  title: string;
  description: string;
  pointsCost: number;
  stock: string;
  sortOrder: number;
  isActive: boolean;
  category: string;
};

const emptyRewardForm = (): RewardFormState => ({
  code: '',
  title: '',
  description: '',
  pointsCost: 100,
  stock: '',
  sortOrder: 0,
  isActive: true,
  category: 'drink',
});

export function LoyaltyManager() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'accounts' | 'history' | 'campaigns' | 'rewards'>('accounts');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [userId, setUserId] = useState('');
  const [points, setPoints] = useState(50);
  const [reason, setReason] = useState('');
  const [editingRewardId, setEditingRewardId] = useState<string | null>(null);
  const [rewardForm, setRewardForm] = useState<RewardFormState>(emptyRewardForm);

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
  const rewardsQuery = useQuery({
    queryKey: ['admin-loyalty-rewards'],
    queryFn: () => listLoyaltyRewards(),
    enabled: tab === 'rewards',
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

  const rewardMutation = useMutation({
    mutationFn: async () => {
      const stockValue = rewardForm.stock.trim();
      const stock = stockValue === '' ? null : Number(stockValue);
      if (stock !== null && (Number.isNaN(stock) || stock < 0)) {
        throw new Error('Stock must be empty (unlimited) or a non-negative number.');
      }
      const payload = {
        code: rewardForm.code.trim(),
        title: rewardForm.title.trim(),
        description: rewardForm.description.trim(),
        pointsCost: rewardForm.pointsCost,
        stock,
        sortOrder: rewardForm.sortOrder,
        isActive: rewardForm.isActive,
        data: { category: rewardForm.category },
      };
      if (editingRewardId) {
        return updateLoyaltyReward(editingRewardId, payload);
      }
      return createLoyaltyReward(payload);
    },
    onSuccess: async () => {
      setError(null);
      setMessage(editingRewardId ? 'Reward updated.' : 'Reward created.');
      setEditingRewardId(null);
      setRewardForm(emptyRewardForm());
      await queryClient.invalidateQueries({ queryKey: ['admin-loyalty-rewards'] });
    },
    onError: (err) => {
      setMessage(null);
      setError(err instanceof ApiClientError || err instanceof Error ? err.message : 'Reward save failed.');
    },
  });

  const deleteRewardMutation = useMutation({
    mutationFn: (id: string) => deleteLoyaltyReward(id),
    onSuccess: async () => {
      setError(null);
      setMessage('Reward deleted.');
      if (editingRewardId) {
        setEditingRewardId(null);
        setRewardForm(emptyRewardForm());
      }
      await queryClient.invalidateQueries({ queryKey: ['admin-loyalty-rewards'] });
    },
    onError: (err) => {
      setMessage(null);
      setError(err instanceof ApiClientError ? err.message : 'Delete failed.');
    },
  });

  function startEdit(reward: LoyaltyReward) {
    setEditingRewardId(reward.id);
    setRewardForm({
      code: reward.code,
      title: reward.title,
      description: reward.description,
      pointsCost: reward.pointsCost,
      stock: reward.stock === null || reward.stock === undefined ? '' : String(reward.stock),
      sortOrder: reward.sortOrder,
      isActive: reward.isActive,
      category: typeof reward.data.category === 'string' ? reward.data.category : 'drink',
    });
  }

  return (
    <div>
      <PageHeader
        title="Loyalty"
        description="Review balances, configure rewards, apply audited adjustments, and monitor campaigns."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {(
          [
            ['accounts', 'Accounts'],
            ['history', 'History'],
            ['rewards', 'Rewards'],
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

      {tab === 'rewards' ? (
        <div className="space-y-6">
          <form
            className="grid gap-3 rounded-[16px] border border-border bg-surface p-4 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              rewardMutation.mutate();
            }}
          >
            <p className="md:col-span-2 text-sm font-medium text-text">
              {editingRewardId ? 'Edit reward' : 'Create reward'}
            </p>
            <label className="space-y-1 text-sm">
              <span className="text-text-secondary">Code</span>
              <input
                required={!editingRewardId}
                disabled={Boolean(editingRewardId)}
                value={rewardForm.code}
                onChange={(event) => setRewardForm((prev) => ({ ...prev, code: event.target.value }))}
                className="w-full rounded-[12px] border border-border bg-background px-3 py-2 disabled:opacity-60"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-text-secondary">Title</span>
              <input
                required
                value={rewardForm.title}
                onChange={(event) => setRewardForm((prev) => ({ ...prev, title: event.target.value }))}
                className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="text-text-secondary">Description</span>
              <textarea
                value={rewardForm.description}
                onChange={(event) =>
                  setRewardForm((prev) => ({ ...prev, description: event.target.value }))
                }
                rows={3}
                className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-text-secondary">Points cost</span>
              <input
                type="number"
                min={1}
                required
                value={rewardForm.pointsCost}
                onChange={(event) =>
                  setRewardForm((prev) => ({ ...prev, pointsCost: Number(event.target.value) || 0 }))
                }
                className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-text-secondary">Stock (empty = unlimited)</span>
              <input
                type="number"
                min={0}
                value={rewardForm.stock}
                onChange={(event) => setRewardForm((prev) => ({ ...prev, stock: event.target.value }))}
                className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-text-secondary">Sort order</span>
              <input
                type="number"
                value={rewardForm.sortOrder}
                onChange={(event) =>
                  setRewardForm((prev) => ({ ...prev, sortOrder: Number(event.target.value) || 0 }))
                }
                className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-text-secondary">Category</span>
              <select
                value={rewardForm.category}
                onChange={(event) => setRewardForm((prev) => ({ ...prev, category: event.target.value }))}
                className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
              >
                <option value="drink">Drink</option>
                <option value="food">Food</option>
                <option value="voucher">Voucher</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <input
                type="checkbox"
                checked={rewardForm.isActive}
                onChange={(event) =>
                  setRewardForm((prev) => ({ ...prev, isActive: event.target.checked }))
                }
              />
              <span className="text-text">Active (visible on public catalog)</span>
            </label>
            <div className="flex flex-wrap gap-2 md:col-span-2">
              <button
                type="submit"
                disabled={rewardMutation.isPending}
                className="rounded-[12px] bg-primary px-4 py-2 text-sm text-white hover:bg-primary-hover disabled:opacity-60"
              >
                {editingRewardId ? 'Save reward' : 'Create reward'}
              </button>
              {editingRewardId ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingRewardId(null);
                    setRewardForm(emptyRewardForm());
                  }}
                  className="rounded-[12px] border border-border px-4 py-2 text-sm text-text"
                >
                  Cancel edit
                </button>
              ) : null}
            </div>
          </form>

          {rewardsQuery.isLoading ? <p className="text-sm text-text-secondary">Loading rewards…</p> : null}
          {!rewardsQuery.isLoading && (rewardsQuery.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-text-secondary">No rewards configured yet.</p>
          ) : null}
          <div className="space-y-3">
            {(rewardsQuery.data ?? []).map((reward) => (
              <article key={reward.id} className="rounded-[16px] border border-border bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-text">{reward.title}</p>
                    <p className="text-sm text-text-secondary">{reward.description || 'No description'}</p>
                    <p className="mt-1 text-sm text-text-muted">
                      {reward.pointsCost} pts ·{' '}
                      {reward.stock === null || reward.stock === undefined
                        ? 'Unlimited stock'
                        : `${reward.stock} in stock`}{' '}
                      · {reward.isActive ? 'Active' : 'Inactive'} · {reward.code}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(reward)}
                      className="rounded-[10px] border border-border px-3 py-1.5 text-xs text-text"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={deleteRewardMutation.isPending}
                      onClick={() => deleteRewardMutation.mutate(reward.id)}
                      className="rounded-[10px] border border-border px-3 py-1.5 text-xs text-text"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
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
