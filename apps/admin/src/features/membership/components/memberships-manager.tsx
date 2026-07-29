'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { ApiClientError } from '@/lib/api-client';
import {
  listMembershipLevels,
  listMemberships,
  updateMembershipLevel,
  updateMembershipStatus,
  type Membership,
  type MembershipLevel,
} from '@/services/membership';

const statuses = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'expired', label: 'Expired' },
] as const;

export function MembershipsManager() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [tab, setTab] = useState<'members' | 'levels'>('members');

  const membersQuery = useQuery({
    queryKey: ['admin-memberships', status],
    queryFn: () => listMemberships({ status: status || undefined, limit: 50 }),
    enabled: tab === 'members',
  });

  const levelsQuery = useQuery({
    queryKey: ['admin-membership-levels'],
    queryFn: () => listMembershipLevels(),
    enabled: tab === 'levels',
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: string }) =>
      updateMembershipStatus(id, nextStatus, `Status set to ${nextStatus}`),
    onSuccess: async () => {
      setError(null);
      setMessage('Membership status updated.');
      await queryClient.invalidateQueries({ queryKey: ['admin-memberships'] });
    },
    onError: (err) => {
      setMessage(null);
      setError(err instanceof ApiClientError ? err.message : 'Update failed.');
    },
  });

  const levelMutation = useMutation({
    mutationFn: (level: MembershipLevel) =>
      updateMembershipLevel(level.id, {
        qualificationRules: level.qualificationRules,
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
          <label className="mb-4 flex w-fit flex-col gap-1 text-sm">
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

          {membersQuery.isLoading ? <p className="text-sm text-text-secondary">Loading members…</p> : null}
          {!membersQuery.isLoading && (membersQuery.data?.items.length ?? 0) === 0 ? (
            <p className="text-sm text-text-secondary">No memberships found.</p>
          ) : null}

          <div className="space-y-3">
            {(membersQuery.data?.items ?? []).map((item) => (
              <MemberRow
                key={item.id}
                membership={item}
                pending={statusMutation.isPending}
                onStatus={(nextStatus) => statusMutation.mutate({ id: item.id, nextStatus })}
              />
            ))}
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
  pending,
  onStatus,
}: {
  membership: Membership;
  pending: boolean;
  onStatus: (status: string) => void;
}) {
  return (
    <article className="rounded-[16px] border border-border bg-surface p-4 md:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
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
        <div className="flex flex-wrap gap-2">
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
      </div>
    </article>
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
  const [draft, setDraft] = useState(level);

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

      <label className="mb-4 block space-y-1 text-sm">
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
          className="w-full rounded-[12px] border border-border bg-background px-3 py-2 md:w-48"
        />
      </label>

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
