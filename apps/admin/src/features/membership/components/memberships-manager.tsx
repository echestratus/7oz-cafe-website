'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { ApiClientError } from '@/lib/api-client';
import {
  getMembership,
  getMembershipHistory,
  listMembershipLevels,
  listMemberships,
  updateMembershipLevel,
  updateMembershipStatus,
  type Membership,
  type MembershipHistory,
  type MembershipLevel,
} from '@/services/membership';

const statuses = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'expired', label: 'Expired' },
] as const;

function formatDate(value?: string | null): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en').format(value);
}

export function MembershipsManager() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [levelId, setLevelId] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [tab, setTab] = useState<'members' | 'levels'>('members');

  const membersQuery = useQuery({
    queryKey: ['admin-memberships', status, levelId],
    queryFn: () =>
      listMemberships({
        status: status || undefined,
        levelId: levelId || undefined,
        limit: 50,
      }),
    enabled: tab === 'members',
  });

  const levelsQuery = useQuery({
    queryKey: ['admin-membership-levels'],
    queryFn: () => listMembershipLevels(),
  });

  const detailQuery = useQuery({
    queryKey: ['admin-membership', selectedId],
    queryFn: () => getMembership(selectedId as string),
    enabled: tab === 'members' && Boolean(selectedId),
  });

  const historyQuery = useQuery({
    queryKey: ['admin-membership-history', selectedId],
    queryFn: () => getMembershipHistory(selectedId as string),
    enabled: tab === 'members' && Boolean(selectedId),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: string }) =>
      updateMembershipStatus(id, nextStatus, `Status set to ${nextStatus}`),
    onSuccess: async () => {
      setError(null);
      setMessage('Membership status updated.');
      await queryClient.invalidateQueries({ queryKey: ['admin-memberships'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-membership'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-membership-history'] });
    },
    onError: (err) => {
      setMessage(null);
      setError(err instanceof ApiClientError ? err.message : 'Update failed.');
    },
  });

  const levelMutation = useMutation({
    mutationFn: (level: MembershipLevel) =>
      updateMembershipLevel(level.id, {
        qualificationRules: {
          minCompletedReservations: level.qualificationRules.minCompletedReservations,
          minLifetimeLoyaltyPoints: level.qualificationRules.minLifetimeLoyaltyPoints,
          loyaltyPointMultiplier: level.qualificationRules.loyaltyPointMultiplier,
        },
        description: level.description,
        isActive: level.isActive,
      }),
    onSuccess: async () => {
      setError(null);
      setMessage('Membership level updated.');
      await queryClient.invalidateQueries({ queryKey: ['admin-membership-levels'] });
    },
    onError: (err) => {
      setMessage(null);
      setError(err instanceof ApiClientError ? err.message : 'Level update failed.');
    },
  });

  const selectedSummary = (membersQuery.data?.items ?? []).find((item) => item.id === selectedId);

  return (
    <div>
      <PageHeader
        title="Membership"
        description="Review member progress and configure qualification thresholds."
      />

      <div className="mb-6 flex gap-2">
        <button
          type="button"
          onClick={() => setTab('members')}
          className={`rounded-[12px] px-4 py-2 text-sm ${
            tab === 'members' ? 'bg-primary text-white' : 'border border-border text-text'
          }`}
        >
          Members
        </button>
        <button
          type="button"
          onClick={() => setTab('levels')}
          className={`rounded-[12px] px-4 py-2 text-sm ${
            tab === 'levels' ? 'bg-primary text-white' : 'border border-border text-text'
          }`}
        >
          Levels
        </button>
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

      {tab === 'members' ? (
        <>
          <div className="mb-4 flex flex-wrap gap-4">
            <label className="flex w-fit flex-col gap-1 text-sm">
              <span className="text-text-secondary">Status</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="rounded-[12px] border border-border bg-surface px-3 py-2"
              >
                {statuses.map((item) => (
                  <option key={item.value || 'all'} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex w-fit flex-col gap-1 text-sm">
              <span className="text-text-secondary">Level</span>
              <select
                value={levelId}
                onChange={(event) => setLevelId(event.target.value)}
                className="rounded-[12px] border border-border bg-surface px-3 py-2"
              >
                <option value="">All levels</option>
                {(levelsQuery.data ?? []).map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-3">
              {membersQuery.isLoading ? (
                <p className="text-sm text-text-secondary">Loading members…</p>
              ) : null}
              {!membersQuery.isLoading && (membersQuery.data?.items.length ?? 0) === 0 ? (
                <p className="text-sm text-text-secondary">No memberships found.</p>
              ) : null}

              {(membersQuery.data?.items ?? []).map((item) => (
                <MemberRow
                  key={item.id}
                  membership={item}
                  selected={selectedId === item.id}
                  pending={statusMutation.isPending}
                  onSelect={() => setSelectedId(item.id)}
                  onStatus={(nextStatus) => statusMutation.mutate({ id: item.id, nextStatus })}
                />
              ))}
            </div>

            <aside className="rounded-[16px] border border-border bg-surface p-5">
              {!selectedId ? (
                <p className="text-sm text-text-secondary">Select a member to view progress and history.</p>
              ) : null}
              {detailQuery.isLoading || historyQuery.isLoading ? (
                <p className="text-sm text-text-secondary">Loading details…</p>
              ) : null}
              {detailQuery.error ? (
                <p className="text-sm text-red-700" role="alert">
                  {detailQuery.error instanceof ApiClientError
                    ? detailQuery.error.message
                    : 'Unable to load membership.'}
                </p>
              ) : null}
              {detailQuery.data ? (
                <MemberDetail
                  membership={detailQuery.data}
                  summary={selectedSummary}
                  history={historyQuery.data ?? []}
                  historyError={
                    historyQuery.error instanceof ApiClientError
                      ? historyQuery.error.message
                      : historyQuery.error
                        ? 'Unable to load history.'
                        : null
                  }
                />
              ) : null}
            </aside>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          {levelsQuery.isLoading ? <p className="text-sm text-text-secondary">Loading levels…</p> : null}
          {(levelsQuery.data ?? []).map((level) => (
            <LevelEditor
              key={level.id}
              level={level}
              pending={levelMutation.isPending}
              onSave={(next) => levelMutation.mutate(next)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MemberRow({
  membership,
  selected,
  pending,
  onSelect,
  onStatus,
}: {
  membership: Membership;
  selected: boolean;
  pending: boolean;
  onSelect: () => void;
  onStatus: (status: string) => void;
}) {
  return (
    <article
      className={`rounded-[16px] border p-4 md:p-5 ${
        selected ? 'border-primary bg-primary/5' : 'border-border bg-surface'
      }`}
    >
      <button type="button" onClick={onSelect} className="w-full text-left">
        <div className="space-y-1">
          <p className="font-medium text-text">
            {membership.userFullName || 'Member'}{' '}
            <span className="text-sm font-normal text-text-secondary">
              · {membership.membershipNumber}
            </span>
          </p>
          <p className="text-sm text-text-secondary">
            {membership.level.name} · <span className="capitalize">{membership.status}</span>
          </p>
          <p className="text-sm text-text-muted">{membership.userEmail}</p>
        </div>
      </button>
      <div className="mt-4 flex flex-wrap gap-2">
        {membership.status !== 'active' ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => onStatus('active')}
            className="rounded-[12px] border border-border px-3 py-2 text-sm hover:bg-surface-secondary disabled:opacity-60"
          >
            Restore
          </button>
        ) : null}
        {membership.status === 'active' ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => onStatus('suspended')}
            className="rounded-[12px] border border-border px-3 py-2 text-sm hover:bg-surface-secondary disabled:opacity-60"
          >
            Suspend
          </button>
        ) : null}
      </div>
    </article>
  );
}

function MemberDetail({
  membership,
  summary,
  history,
  historyError,
}: {
  membership: Membership;
  summary?: Membership;
  history: MembershipHistory[];
  historyError: string | null;
}) {
  const progress = membership.progress;
  const displayName = membership.userFullName || summary?.userFullName || 'Member';
  const displayEmail = membership.userEmail || summary?.userEmail;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-heading text-2xl text-text">{displayName}</h2>
        <p className="text-sm text-text-secondary">{membership.membershipNumber}</p>
        {displayEmail ? <p className="text-sm text-text-muted">{displayEmail}</p> : null}
        <p className="text-sm capitalize text-text-secondary">
          {membership.level.name} · {membership.status}
        </p>
        <p className="text-xs text-text-muted">Joined {formatDate(membership.joinedAt)}</p>
      </div>

      {progress ? (
        <div className="space-y-2 rounded-[12px] bg-surface-secondary p-4">
          <p className="text-sm font-medium text-text">Qualification progress</p>
          <p className="text-sm text-text-secondary">
            Completed reservations: {formatNumber(progress.completedReservations)}
          </p>
          <p className="text-sm text-text-secondary">
            Lifetime loyalty points: {formatNumber(progress.lifetimeLoyaltyPoints)}
          </p>
          {progress.nextLevelName ? (
            <p className="text-sm text-text-secondary">
              Next level: {progress.nextLevelName}
              {typeof progress.reservationsRemaining === 'number'
                ? ` · ${formatNumber(progress.reservationsRemaining)} visits remaining`
                : null}
            </p>
          ) : (
            <p className="text-sm text-text-secondary">Highest active level reached.</p>
          )}
        </div>
      ) : null}

      <div className="space-y-3">
        <p className="text-sm font-medium text-text">History</p>
        {historyError ? (
          <p className="text-sm text-red-700" role="alert">
            {historyError}
          </p>
        ) : null}
        {!historyError && history.length === 0 ? (
          <p className="text-sm text-text-secondary">No membership history yet.</p>
        ) : null}
        <ul className="space-y-3">
          {history.map((entry) => (
            <li key={entry.id} className="border-t border-border pt-3 first:border-t-0 first:pt-0">
              <p className="text-sm text-text">
                {entry.fromLevelName ? `${entry.fromLevelName} → ` : ''}
                {entry.toLevelName}
                {entry.toStatus ? (
                  <span className="capitalize text-text-secondary"> · {entry.toStatus}</span>
                ) : null}
              </p>
              <p className="text-xs text-text-muted">
                {formatDate(entry.createdAt)} · {entry.triggerSource}
                {entry.reason ? ` · ${entry.reason}` : ''}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function LevelEditor({
  level,
  pending,
  onSave,
}: {
  level: MembershipLevel;
  pending: boolean;
  onSave: (level: MembershipLevel) => void;
}) {
  const [draft, setDraft] = useState(normalizeLevel(level));

  useEffect(() => {
    setDraft(normalizeLevel(level));
  }, [level]);

  return (
    <article className="rounded-[16px] border border-border bg-surface p-4 md:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl text-text">{draft.name}</h2>
          <p className="text-sm capitalize text-text-secondary">{draft.code}</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-text">
          <input
            type="checkbox"
            checked={draft.isActive}
            onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })}
          />
          Active
        </label>
      </div>

      <label className="mb-3 block space-y-1 text-sm">
        <span className="text-text-secondary">Description</span>
        <textarea
          rows={2}
          value={draft.description}
          onChange={(event) => setDraft({ ...draft, description: event.target.value })}
          className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
        />
      </label>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <label className="block space-y-1 text-sm">
          <span className="text-text-secondary">Min completed reservations</span>
          <input
            type="number"
            min={0}
            value={draft.qualificationRules.minCompletedReservations}
            onChange={(event) =>
              setDraft({
                ...draft,
                qualificationRules: {
                  ...draft.qualificationRules,
                  minCompletedReservations: Number(event.target.value) || 0,
                },
              })
            }
            className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span className="text-text-secondary">Min lifetime loyalty points</span>
          <input
            type="number"
            min={0}
            value={draft.qualificationRules.minLifetimeLoyaltyPoints}
            onChange={(event) =>
              setDraft({
                ...draft,
                qualificationRules: {
                  ...draft.qualificationRules,
                  minLifetimeLoyaltyPoints: Number(event.target.value) || 0,
                },
              })
            }
            className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span className="text-text-secondary">Loyalty point multiplier</span>
          <input
            type="number"
            min={0.1}
            step={0.1}
            value={draft.qualificationRules.loyaltyPointMultiplier}
            onChange={(event) =>
              setDraft({
                ...draft,
                qualificationRules: {
                  ...draft.qualificationRules,
                  loyaltyPointMultiplier: Number(event.target.value) || 1,
                },
              })
            }
            className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
          />
        </label>
      </div>

      <button
        type="button"
        disabled={pending}
        onClick={() => onSave(draft)}
        className="rounded-[12px] bg-primary px-4 py-2 text-sm text-white hover:bg-primary-hover disabled:opacity-60"
      >
        Save level
      </button>
    </article>
  );
}

function normalizeLevel(level: MembershipLevel): MembershipLevel {
  return {
    ...level,
    qualificationRules: {
      minCompletedReservations: level.qualificationRules.minCompletedReservations ?? 0,
      minLifetimeLoyaltyPoints: level.qualificationRules.minLifetimeLoyaltyPoints ?? 0,
      loyaltyPointMultiplier: level.qualificationRules.loyaltyPointMultiplier || 1,
    },
  };
}
