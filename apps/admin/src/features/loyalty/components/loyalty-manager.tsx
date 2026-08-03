'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { ApiClientError } from '@/lib/api-client';
import {
  adjustLoyalty,
  createLoyaltyCampaign,
  createLoyaltyReward,
  deleteLoyaltyReward,
  getLoyaltySettings,
  listLoyaltyAccounts,
  listLoyaltyCampaigns,
  listLoyaltyHistory,
  listLoyaltyRewards,
  lookupDeskCustomer,
  redeemLoyaltyForCustomer,
  updateLoyaltyCampaign,
  updateLoyaltyReward,
  updateLoyaltySettings,
  type DeskCustomer,
  type LoyaltyCampaign,
  type LoyaltyReward,
} from '@/services/loyalty';
import { listMembershipLevels } from '@/services/membership';

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

type CampaignFormState = {
  code: string;
  name: string;
  description: string;
  startsAt: string;
  endsAt: string;
  pointMultiplier: number;
  bonusPoints: number;
  eligibleLevelCodes: string[];
  isActive: boolean;
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

function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultCampaignWindow(): { startsAt: string; endsAt: string } {
  const starts = new Date();
  const ends = new Date(starts.getTime() + 30 * 24 * 60 * 60 * 1000);
  return {
    startsAt: toDatetimeLocalValue(starts.toISOString()),
    endsAt: toDatetimeLocalValue(ends.toISOString()),
  };
}

const emptyCampaignForm = (): CampaignFormState => ({
  code: '',
  name: '',
  description: '',
  ...defaultCampaignWindow(),
  pointMultiplier: 1.5,
  bonusPoints: 0,
  eligibleLevelCodes: [],
  isActive: true,
});

export function LoyaltyManager() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<
    'desk' | 'accounts' | 'history' | 'campaigns' | 'rewards' | 'settings'
  >('desk');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [userId, setUserId] = useState('');
  const [adjustTargetLabel, setAdjustTargetLabel] = useState<string | null>(null);
  const [historyUserId, setHistoryUserId] = useState('');
  const [historyTargetLabel, setHistoryTargetLabel] = useState<string | null>(null);
  const [points, setPoints] = useState(50);
  const [reason, setReason] = useState('');
  const [editingRewardId, setEditingRewardId] = useState<string | null>(null);
  const [rewardForm, setRewardForm] = useState<RewardFormState>(emptyRewardForm);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [campaignForm, setCampaignForm] = useState<CampaignFormState>(emptyCampaignForm);
  const [pointsPerReservation, setPointsPerReservation] = useState(50);
  const [expirationStrategy, setExpirationStrategy] = useState<'never' | 'rolling_months'>('never');
  const [expirationMonths, setExpirationMonths] = useState(12);
  const [settingsHydrated, setSettingsHydrated] = useState(false);
  const [deskQuery, setDeskQuery] = useState('');
  const [deskCustomer, setDeskCustomer] = useState<DeskCustomer | null>(null);
  const [deskRewardId, setDeskRewardId] = useState('');

  const accountsQuery = useQuery({
    queryKey: ['admin-loyalty-accounts'],
    queryFn: () => listLoyaltyAccounts(1, 50),
    enabled: tab === 'accounts',
  });
  const historyQuery = useQuery({
    queryKey: ['admin-loyalty-history', historyUserId],
    queryFn: () => listLoyaltyHistory(1, 40, historyUserId || undefined),
    enabled: tab === 'history',
  });
  const campaignsQuery = useQuery({
    queryKey: ['admin-loyalty-campaigns'],
    queryFn: () => listLoyaltyCampaigns(),
    enabled: tab === 'campaigns',
  });
  const membershipLevelsQuery = useQuery({
    queryKey: ['admin-membership-levels'],
    queryFn: () => listMembershipLevels(),
    enabled: tab === 'campaigns',
  });
  const rewardsQuery = useQuery({
    queryKey: ['admin-loyalty-rewards'],
    queryFn: () => listLoyaltyRewards(),
    enabled: tab === 'rewards' || tab === 'desk',
  });
  const settingsQuery = useQuery({
    queryKey: ['admin-loyalty-settings'],
    queryFn: () => getLoyaltySettings(),
    enabled: tab === 'settings',
  });

  useEffect(() => {
    if (!settingsQuery.data || settingsHydrated) {
      return;
    }
    setPointsPerReservation(settingsQuery.data.pointsPerCompletedReservation);
    setExpirationStrategy(
      settingsQuery.data.expirationStrategy === 'rolling_months' ? 'rolling_months' : 'never',
    );
    setExpirationMonths(settingsQuery.data.expirationMonths);
    setSettingsHydrated(true);
  }, [settingsQuery.data, settingsHydrated]);

  const deskLookupMutation = useMutation({
    mutationFn: () => lookupDeskCustomer(deskQuery.trim()),
    onSuccess: (customer) => {
      setError(null);
      setMessage(null);
      setDeskCustomer(customer);
      setDeskRewardId('');
    },
    onError: (err) => {
      setDeskCustomer(null);
      setMessage(null);
      setError(err instanceof ApiClientError ? err.message : 'Lookup failed.');
    },
  });

  const deskRedeemMutation = useMutation({
    mutationFn: () => {
      if (!deskCustomer) {
        throw new Error('Select a customer first.');
      }
      return redeemLoyaltyForCustomer({
        rewardId: deskRewardId,
        userId: deskCustomer.userId,
      });
    },
    onSuccess: async (redemption) => {
      setError(null);
      setMessage(`Redeemed ${redemption.reward.title} (−${redemption.pointsSpent} pts).`);
      setDeskCustomer((prev) =>
        prev
          ? {
              ...prev,
              account: redemption.account,
            }
          : prev,
      );
      setDeskRewardId('');
      await queryClient.invalidateQueries({ queryKey: ['admin-loyalty-accounts'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-loyalty-rewards'] });
    },
    onError: (err) => {
      setMessage(null);
      setError(err instanceof ApiClientError ? err.message : 'Redemption failed.');
    },
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

  const campaignMutation = useMutation({
    mutationFn: async () => {
      const startsAt = new Date(campaignForm.startsAt);
      const endsAt = new Date(campaignForm.endsAt);
      if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
        throw new Error('Start and end dates must be valid.');
      }
      if (!endsAt.getTime() || endsAt <= startsAt) {
        throw new Error('End date must be after the start date.');
      }
      if (campaignForm.pointMultiplier <= 0) {
        throw new Error('Point multiplier must be greater than zero.');
      }
      if (campaignForm.bonusPoints < 0) {
        throw new Error('Bonus points cannot be negative.');
      }
      const payload = {
        code: campaignForm.code.trim(),
        name: campaignForm.name.trim(),
        description: campaignForm.description.trim(),
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        pointMultiplier: campaignForm.pointMultiplier,
        bonusPoints: campaignForm.bonusPoints,
        eligibleLevelCodes: campaignForm.eligibleLevelCodes,
        isActive: campaignForm.isActive,
      };
      if (editingCampaignId) {
        return updateLoyaltyCampaign(editingCampaignId, payload);
      }
      return createLoyaltyCampaign(payload);
    },
    onSuccess: async () => {
      setError(null);
      setMessage(editingCampaignId ? 'Campaign updated.' : 'Campaign created.');
      setEditingCampaignId(null);
      setCampaignForm(emptyCampaignForm());
      await queryClient.invalidateQueries({ queryKey: ['admin-loyalty-campaigns'] });
    },
    onError: (err) => {
      setMessage(null);
      setError(
        err instanceof ApiClientError || err instanceof Error ? err.message : 'Campaign save failed.',
      );
    },
  });

  const settingsMutation = useMutation({
    mutationFn: () =>
      updateLoyaltySettings({
        pointsPerCompletedReservation: pointsPerReservation,
        expirationStrategy,
        expirationMonths,
      }),
    onSuccess: async () => {
      setError(null);
      setMessage('Loyalty settings updated.');
      setSettingsHydrated(false);
      await queryClient.invalidateQueries({ queryKey: ['admin-loyalty-settings'] });
    },
    onError: (err) => {
      setMessage(null);
      setError(err instanceof ApiClientError ? err.message : 'Settings update failed.');
    },
  });

  function accountLabel(account: {
    userFullName?: string;
    userEmail?: string;
    userId: string;
  }): string {
    return account.userFullName || account.userEmail || account.userId;
  }

  function prepareAdjust(account: {
    userId: string;
    userFullName?: string;
    userEmail?: string;
  }) {
    setTab('accounts');
    setUserId(account.userId);
    setAdjustTargetLabel(accountLabel(account));
    setMessage(`Ready to adjust points for ${accountLabel(account)}.`);
    setError(null);
  }

  function viewHistory(account: {
    userId: string;
    userFullName?: string;
    userEmail?: string;
  }) {
    setHistoryUserId(account.userId);
    setHistoryTargetLabel(accountLabel(account));
    setTab('history');
    setError(null);
    setMessage(null);
  }

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

  function startEditCampaign(campaign: LoyaltyCampaign) {
    setEditingCampaignId(campaign.id);
    setCampaignForm({
      code: campaign.code,
      name: campaign.name,
      description: campaign.description,
      startsAt: toDatetimeLocalValue(campaign.startsAt),
      endsAt: toDatetimeLocalValue(campaign.endsAt),
      pointMultiplier: campaign.pointMultiplier,
      bonusPoints: campaign.bonusPoints,
      eligibleLevelCodes: campaign.eligibleLevelCodes ?? [],
      isActive: campaign.isActive,
    });
  }

  return (
    <div>
      <PageHeader
        title="Loyalty"
        description="Redeem rewards at the desk, review balances, and configure the loyalty program."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {(
          [
            ['desk', 'Desk'],
            ['accounts', 'Accounts'],
            ['history', 'History'],
            ['rewards', 'Rewards'],
            ['campaigns', 'Campaigns'],
            ['settings', 'Settings'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setTab(value);
              setError(null);
              setMessage(null);
              if (value === 'settings') {
                setSettingsHydrated(false);
              }
            }}
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

      {tab === 'desk' ? (
        <div className="space-y-6">
          <form
            className="grid max-w-3xl gap-3 rounded-[16px] border border-border bg-surface p-4"
            onSubmit={(event) => {
              event.preventDefault();
              deskLookupMutation.mutate();
            }}
          >
            <p className="text-sm font-medium text-text">Find customer</p>
            <p className="text-xs text-text-muted">
              Search by membership number, email, or scanned QR payload (`7oz-member:…`).
            </p>
            <label className="space-y-1 text-sm">
              <span className="text-text-secondary">Lookup</span>
              <input
                required
                value={deskQuery}
                onChange={(event) => setDeskQuery(event.target.value)}
                placeholder="7OZ-M-… / guest@email.com / 7oz-member:…"
                className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
              />
            </label>
            <button
              type="submit"
              disabled={deskLookupMutation.isPending}
              className="w-fit rounded-[12px] bg-primary px-4 py-2 text-sm text-white hover:bg-primary-hover disabled:opacity-60"
            >
              {deskLookupMutation.isPending ? 'Looking up…' : 'Lookup up'}
            </button>
          </form>

          {deskCustomer ? (
            <div className="grid max-w-3xl gap-4 rounded-[16px] border border-border bg-surface p-4">
              <div>
                <p className="font-medium text-text">{deskCustomer.fullName || 'Customer'}</p>
                <p className="text-sm text-text-secondary">{deskCustomer.email}</p>
                <p className="mt-1 text-sm text-text-muted">
                  {deskCustomer.membershipNumber
                    ? `${deskCustomer.membershipNumber} · ${deskCustomer.membershipStatus || 'unknown'}`
                    : 'No membership on file'}{' '}
                  · Balance {deskCustomer.account.balance} pts
                </p>
              </div>

              <form
                className="grid gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  deskRedeemMutation.mutate();
                }}
              >
                <label className="space-y-1 text-sm">
                  <span className="text-text-secondary">Reward</span>
                  <select
                    required
                    value={deskRewardId}
                    onChange={(event) => setDeskRewardId(event.target.value)}
                    className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
                  >
                    <option value="">Select reward</option>
                    {(rewardsQuery.data ?? [])
                      .filter((reward) => reward.isActive)
                      .map((reward) => (
                        <option
                          key={reward.id}
                          value={reward.id}
                          disabled={
                            reward.pointsCost > deskCustomer.account.balance ||
                            (reward.stock !== null && reward.stock <= 0)
                          }
                        >
                          {reward.title} · {reward.pointsCost} pts
                          {reward.stock !== null ? ` · stock ${reward.stock}` : ''}
                        </option>
                      ))}
                  </select>
                </label>
                <button
                  type="submit"
                  disabled={deskRedeemMutation.isPending || !deskRewardId}
                  className="w-fit rounded-[12px] bg-primary px-4 py-2 text-sm text-white hover:bg-primary-hover disabled:opacity-60"
                >
                  {deskRedeemMutation.isPending ? 'Redeeming…' : 'Redeem for customer'}
                </button>
              </form>
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === 'accounts' ? (
        <div className="space-y-6">
          <form
            id="loyalty-adjust-form"
            className="grid gap-3 rounded-[16px] border border-border bg-surface p-4 md:grid-cols-4"
            onSubmit={(event) => {
              event.preventDefault();
              adjustMutation.mutate();
            }}
          >
            <div className="space-y-1 text-sm md:col-span-2">
              <label className="block space-y-1">
                <span className="text-text-secondary">Customer user ID</span>
                <input
                  required
                  value={userId}
                  onChange={(event) => {
                    setUserId(event.target.value);
                    setAdjustTargetLabel(null);
                  }}
                  className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
                />
              </label>
              {adjustTargetLabel ? (
                <p className="text-xs text-text-muted">Selected: {adjustTargetLabel}</p>
              ) : null}
            </div>
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
          {!accountsQuery.isLoading && (accountsQuery.data?.items.length ?? 0) === 0 ? (
            <p className="text-sm text-text-secondary">No loyalty accounts found.</p>
          ) : null}
          <div className="space-y-3">
            {(accountsQuery.data?.items ?? []).map((account) => (
              <article
                key={account.id}
                className={`rounded-[16px] border bg-surface p-4 ${
                  userId === account.userId ? 'border-primary' : 'border-border'
                }`}
              >
                <p className="font-medium text-text">
                  {account.userFullName || 'Customer'}{' '}
                  <span className="text-sm font-normal text-text-secondary">· {account.balance} pts</span>
                </p>
                <p className="text-sm text-text-secondary">{account.userEmail}</p>
                <p className="text-sm text-text-muted">
                  Earned {account.lifetimeEarned} · Redeemed {account.lifetimeRedeemed}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      prepareAdjust(account);
                      document.getElementById('loyalty-adjust-form')?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                      });
                    }}
                    className="rounded-[12px] border border-border px-3 py-2 text-sm hover:bg-surface-secondary"
                  >
                    Adjust
                  </button>
                  <button
                    type="button"
                    onClick={() => viewHistory(account)}
                    className="rounded-[12px] border border-border px-3 py-2 text-sm hover:bg-surface-secondary"
                  >
                    View history
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {tab === 'history' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-border bg-surface p-4">
            <p className="text-sm text-text-secondary">
              {historyUserId
                ? `Showing history for ${historyTargetLabel || historyUserId}`
                : 'Showing all loyalty transactions'}
            </p>
            {historyUserId ? (
              <button
                type="button"
                onClick={() => {
                  setHistoryUserId('');
                  setHistoryTargetLabel(null);
                }}
                className="rounded-[12px] border border-border px-3 py-2 text-sm hover:bg-surface-secondary"
              >
                Clear filter
              </button>
            ) : null}
          </div>
          {historyQuery.isLoading ? <p className="text-sm text-text-secondary">Loading history…</p> : null}
          {!historyQuery.isLoading && (historyQuery.data?.items.length ?? 0) === 0 ? (
            <p className="text-sm text-text-secondary">No loyalty history found.</p>
          ) : null}
          <div className="space-y-3">
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
        <div className="space-y-6">
          <form
            className="grid gap-3 rounded-[16px] border border-border bg-surface p-4 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              campaignMutation.mutate();
            }}
          >
            <p className="md:col-span-2 text-sm font-medium text-text">
              {editingCampaignId ? 'Edit campaign' : 'Create campaign'}
            </p>
            <label className="space-y-1 text-sm">
              <span className="text-text-secondary">Code</span>
              <input
                required={!editingCampaignId}
                disabled={Boolean(editingCampaignId)}
                value={campaignForm.code}
                onChange={(event) =>
                  setCampaignForm((prev) => ({ ...prev, code: event.target.value }))
                }
                className="w-full rounded-[12px] border border-border bg-background px-3 py-2 disabled:opacity-60"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-text-secondary">Name</span>
              <input
                required
                value={campaignForm.name}
                onChange={(event) =>
                  setCampaignForm((prev) => ({ ...prev, name: event.target.value }))
                }
                className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm md:col-span-2">
              <span className="text-text-secondary">Description</span>
              <textarea
                value={campaignForm.description}
                onChange={(event) =>
                  setCampaignForm((prev) => ({ ...prev, description: event.target.value }))
                }
                rows={3}
                className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-text-secondary">Starts at</span>
              <input
                type="datetime-local"
                required
                value={campaignForm.startsAt}
                onChange={(event) =>
                  setCampaignForm((prev) => ({ ...prev, startsAt: event.target.value }))
                }
                className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-text-secondary">Ends at</span>
              <input
                type="datetime-local"
                required
                value={campaignForm.endsAt}
                onChange={(event) =>
                  setCampaignForm((prev) => ({ ...prev, endsAt: event.target.value }))
                }
                className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-text-secondary">Point multiplier</span>
              <input
                type="number"
                min={0.1}
                step={0.1}
                required
                value={campaignForm.pointMultiplier}
                onChange={(event) =>
                  setCampaignForm((prev) => ({
                    ...prev,
                    pointMultiplier: Number(event.target.value) || 0,
                  }))
                }
                className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-text-secondary">Bonus points</span>
              <input
                type="number"
                min={0}
                required
                value={campaignForm.bonusPoints}
                onChange={(event) =>
                  setCampaignForm((prev) => ({
                    ...prev,
                    bonusPoints: Number(event.target.value) || 0,
                  }))
                }
                className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
              />
            </label>
            <fieldset className="space-y-2 md:col-span-2">
              <legend className="text-sm text-text-secondary">
                Eligible membership levels (none selected = all levels)
              </legend>
              <div className="flex flex-wrap gap-3">
                {(membershipLevelsQuery.data ?? []).map((level) => {
                  const checked = campaignForm.eligibleLevelCodes.includes(level.code);
                  return (
                    <label key={level.id} className="inline-flex items-center gap-2 text-sm text-text">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          setCampaignForm((prev) => {
                            const next = event.target.checked
                              ? [...prev.eligibleLevelCodes, level.code]
                              : prev.eligibleLevelCodes.filter((code) => code !== level.code);
                            return { ...prev, eligibleLevelCodes: next };
                          });
                        }}
                      />
                      {level.name}
                    </label>
                  );
                })}
                {membershipLevelsQuery.isLoading ? (
                  <p className="text-sm text-text-secondary">Loading levels…</p>
                ) : null}
              </div>
            </fieldset>
            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <input
                type="checkbox"
                checked={campaignForm.isActive}
                onChange={(event) =>
                  setCampaignForm((prev) => ({ ...prev, isActive: event.target.checked }))
                }
              />
              <span className="text-text">Active</span>
            </label>
            <div className="flex flex-wrap gap-2 md:col-span-2">
              <button
                type="submit"
                disabled={campaignMutation.isPending}
                className="rounded-[12px] bg-primary px-4 py-2 text-sm text-white hover:bg-primary-hover disabled:opacity-60"
              >
                {editingCampaignId ? 'Save campaign' : 'Create campaign'}
              </button>
              {editingCampaignId ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingCampaignId(null);
                    setCampaignForm(emptyCampaignForm());
                  }}
                  className="rounded-[12px] border border-border px-4 py-2 text-sm text-text"
                >
                  Cancel edit
                </button>
              ) : null}
            </div>
          </form>

          {campaignsQuery.isLoading ? (
            <p className="text-sm text-text-secondary">Loading campaigns…</p>
          ) : null}
          {!campaignsQuery.isLoading && (campaignsQuery.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-text-secondary">No campaigns configured yet.</p>
          ) : null}
          <div className="space-y-3">
            {(campaignsQuery.data ?? []).map((campaign) => (
              <article key={campaign.id} className="rounded-[16px] border border-border bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-text">{campaign.name}</p>
                    <p className="text-sm text-text-secondary">
                      {campaign.description || 'No description'}
                    </p>
                    <p className="mt-1 text-sm text-text-muted">
                      {campaign.pointMultiplier}x · +{campaign.bonusPoints} bonus ·{' '}
                      {campaign.isActive ? 'Active' : 'Inactive'} · {campaign.code}
                    </p>
                    <p className="text-xs text-text-muted">
                      {new Date(campaign.startsAt).toLocaleString()} →{' '}
                      {new Date(campaign.endsAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-text-muted">
                      Levels:{' '}
                      {(campaign.eligibleLevelCodes ?? []).length > 0
                        ? campaign.eligibleLevelCodes.join(', ')
                        : 'All'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => startEditCampaign(campaign)}
                    className="rounded-[10px] border border-border px-3 py-1.5 text-xs text-text"
                  >
                    Edit
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {tab === 'settings' ? (
        <div className="space-y-6">
          {settingsQuery.isLoading ? (
            <p className="text-sm text-text-secondary">Loading settings…</p>
          ) : null}
          {settingsQuery.error ? (
            <p className="text-sm text-red-700" role="alert">
              {settingsQuery.error instanceof ApiClientError
                ? settingsQuery.error.message
                : 'Unable to load settings.'}
            </p>
          ) : null}
          <form
            className="grid max-w-xl gap-4 rounded-[16px] border border-border bg-surface p-4"
            onSubmit={(event) => {
              event.preventDefault();
              settingsMutation.mutate();
            }}
          >
            <p className="text-sm font-medium text-text">Program settings</p>
            <label className="space-y-1 text-sm">
              <span className="text-text-secondary">Points per completed reservation</span>
              <input
                type="number"
                min={0}
                required
                value={pointsPerReservation}
                onChange={(event) => setPointsPerReservation(Number(event.target.value) || 0)}
                className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-text-secondary">Expiration strategy</span>
              <select
                value={expirationStrategy}
                onChange={(event) =>
                  setExpirationStrategy(event.target.value as 'never' | 'rolling_months')
                }
                className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
              >
                <option value="never">Never expire</option>
                <option value="rolling_months">Rolling months (FIFO)</option>
              </select>
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-text-secondary">Expiration months</span>
              <input
                type="number"
                min={1}
                required
                disabled={expirationStrategy !== 'rolling_months'}
                value={expirationMonths}
                onChange={(event) => setExpirationMonths(Number(event.target.value) || 1)}
                className="w-full rounded-[12px] border border-border bg-background px-3 py-2 disabled:opacity-60"
              />
            </label>
            <p className="text-xs text-text-muted">
              Run <code className="rounded bg-surface-secondary px-1">pnpm --filter @7oz/backend loyalty:expire</code>{' '}
              on a schedule after enabling rolling months.
            </p>
            <button
              type="submit"
              disabled={settingsMutation.isPending || settingsQuery.isLoading}
              className="w-fit rounded-[12px] bg-primary px-4 py-2 text-sm text-white hover:bg-primary-hover disabled:opacity-60"
            >
              Save settings
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
