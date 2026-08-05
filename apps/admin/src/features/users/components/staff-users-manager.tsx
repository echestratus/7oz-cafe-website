'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { ApiClientError } from '@/lib/api-client';
import {
  createStaffUser,
  getStaffUser,
  listStaffUsers,
  updateStaffUserRole,
  updateStaffUserStatus,
  type StaffUser,
} from '@/services/users';
import { useAuthStore } from '@/stores/auth-store';

const statuses = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'inactive', label: 'Inactive' },
] as const;

const roleFilters = [
  { value: '', label: 'All roles' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin' },
] as const;

function formatDate(value?: string | null): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(date);
}

function formatRole(roles: string[]): string {
  if (roles.includes('super_admin')) {
    return 'Super Admin';
  }
  if (roles.includes('admin')) {
    return 'Admin';
  }
  return roles.join(', ') || '—';
}

export function StaffUsersManager() {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const canManage = useAuthStore((state) => state.hasPermission('user.manage'));
  const canManageRoles = useAuthStore((state) => state.hasPermission('role.manage'));

  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [createEmail, setCreateEmail] = useState('');
  const [createName, setCreateName] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState<'admin' | 'super_admin'>('admin');

  const listQuery = useQuery({
    queryKey: ['admin-staff-users', status, role, search],
    queryFn: () =>
      listStaffUsers({
        status: status || undefined,
        role: role || undefined,
        search: search || undefined,
        limit: 50,
      }),
  });

  const detailQuery = useQuery({
    queryKey: ['admin-staff-user', selectedId],
    queryFn: () => getStaffUser(selectedId as string),
    enabled: Boolean(selectedId),
  });

  const createMutation = useMutation({
    mutationFn: createStaffUser,
    onSuccess: async (created) => {
      setError(null);
      setMessage(`Created ${created.fullName}.`);
      setCreateEmail('');
      setCreateName('');
      setCreatePassword('');
      setCreateRole('admin');
      setSelectedId(created.id);
      await queryClient.invalidateQueries({ queryKey: ['admin-staff-users'] });
    },
    onError: (err) => {
      setMessage(null);
      setError(err instanceof ApiClientError ? err.message : 'Create failed.');
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: string }) =>
      updateStaffUserStatus(id, nextStatus, `Status set to ${nextStatus}`),
    onSuccess: async () => {
      setError(null);
      setMessage('Staff status updated.');
      await queryClient.invalidateQueries({ queryKey: ['admin-staff-users'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-staff-user'] });
    },
    onError: (err) => {
      setMessage(null);
      setError(err instanceof ApiClientError ? err.message : 'Update failed.');
    },
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, roleCode }: { id: string; roleCode: string }) =>
      updateStaffUserRole(id, roleCode),
    onSuccess: async () => {
      setError(null);
      setMessage('Staff role updated.');
      await queryClient.invalidateQueries({ queryKey: ['admin-staff-users'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-staff-user'] });
    },
    onError: (err) => {
      setMessage(null);
      setError(err instanceof ApiClientError ? err.message : 'Role update failed.');
    },
  });

  return (
    <div>
      <PageHeader
        title="Staff"
        description="Manage admin accounts, roles, and access status."
      />

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

      {canManage ? (
        <form
          className="mb-6 grid gap-4 rounded-[16px] border border-border bg-surface p-5 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            createMutation.mutate({
              email: createEmail.trim(),
              fullName: createName.trim(),
              password: createPassword,
              roleCode: createRole,
            });
          }}
        >
          <p className="md:col-span-2 font-medium text-text">Create staff user</p>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-text-secondary">Full name</span>
            <input
              required
              value={createName}
              onChange={(event) => setCreateName(event.target.value)}
              className="rounded-[12px] border border-border bg-surface px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-text-secondary">Email</span>
            <input
              required
              type="email"
              value={createEmail}
              onChange={(event) => setCreateEmail(event.target.value)}
              className="rounded-[12px] border border-border bg-surface px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-text-secondary">Temporary password</span>
            <input
              required
              type="password"
              autoComplete="new-password"
              value={createPassword}
              onChange={(event) => setCreatePassword(event.target.value)}
              className="rounded-[12px] border border-border bg-surface px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-text-secondary">Role</span>
            <select
              value={createRole}
              onChange={(event) =>
                setCreateRole(event.target.value as 'admin' | 'super_admin')
              }
              className="rounded-[12px] border border-border bg-surface px-3 py-2"
            >
              <option value="admin">Admin</option>
              {canManageRoles ? <option value="super_admin">Super Admin</option> : null}
            </select>
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-[12px] bg-primary px-4 py-2 text-sm text-white disabled:opacity-60"
            >
              {createMutation.isPending ? 'Creating…' : 'Create staff'}
            </button>
          </div>
        </form>
      ) : null}

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-sm">
          <span className="text-text-secondary">Search</span>
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                setSearch(searchInput.trim());
              }
            }}
            placeholder="Name or email"
            className="rounded-[12px] border border-border bg-surface px-3 py-2"
          />
        </label>
        <button
          type="button"
          onClick={() => setSearch(searchInput.trim())}
          className="rounded-[12px] bg-primary px-4 py-2 text-sm text-white"
        >
          Search
        </button>
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
          <span className="text-text-secondary">Role</span>
          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="rounded-[12px] border border-border bg-surface px-3 py-2"
          >
            {roleFilters.map((item) => (
              <option key={item.value || 'all-roles'} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          {listQuery.isLoading ? <p className="text-sm text-text-secondary">Loading staff…</p> : null}
          {!listQuery.isLoading && (listQuery.data?.items.length ?? 0) === 0 ? (
            <p className="text-sm text-text-secondary">No staff users found.</p>
          ) : null}
          {(listQuery.data?.items ?? []).map((item) => (
            <StaffRow
              key={item.id}
              user={item}
              selected={selectedId === item.id}
              isSelf={item.id === currentUserId}
              canManage={canManage}
              pending={statusMutation.isPending}
              onSelect={() => setSelectedId(item.id)}
              onStatus={(nextStatus) => statusMutation.mutate({ id: item.id, nextStatus })}
            />
          ))}
        </div>

        <aside className="rounded-[16px] border border-border bg-surface p-5">
          {!selectedId ? (
            <p className="text-sm text-text-secondary">Select a staff user to view details.</p>
          ) : null}
          {detailQuery.isLoading ? (
            <p className="text-sm text-text-secondary">Loading details…</p>
          ) : null}
          {detailQuery.error ? (
            <p className="text-sm text-red-700" role="alert">
              {detailQuery.error instanceof ApiClientError
                ? detailQuery.error.message
                : 'Unable to load staff user.'}
            </p>
          ) : null}
          {detailQuery.data ? (
            <StaffDetail
              user={detailQuery.data}
              isSelf={detailQuery.data.id === currentUserId}
              canManageRoles={canManageRoles}
              rolePending={roleMutation.isPending}
              onRoleChange={(roleCode) =>
                roleMutation.mutate({ id: detailQuery.data.id, roleCode })
              }
            />
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function StaffRow({
  user,
  selected,
  isSelf,
  canManage,
  pending,
  onSelect,
  onStatus,
}: {
  user: StaffUser;
  selected: boolean;
  isSelf: boolean;
  canManage: boolean;
  pending: boolean;
  onSelect: () => void;
  onStatus: (status: string) => void;
}) {
  return (
    <article
      className={`rounded-[16px] border p-4 transition-colors ${
        selected ? 'border-primary bg-surface-secondary' : 'border-border bg-surface'
      }`}
    >
      <button type="button" onClick={onSelect} className="w-full text-left">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium text-text">{user.fullName}</p>
            <p className="text-sm text-text-secondary">{user.email}</p>
          </div>
          <span className="rounded-full bg-surface-secondary px-2.5 py-1 text-xs text-text-secondary">
            {user.status}
          </span>
        </div>
        <p className="mt-2 text-sm text-text-secondary">{formatRole(user.roles)}</p>
      </button>
      {canManage && !isSelf ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {user.status !== 'active' ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => onStatus('active')}
              className="rounded-[8px] border border-border px-3 py-1.5 text-xs text-text hover:bg-surface-secondary disabled:opacity-60"
            >
              Activate
            </button>
          ) : null}
          {user.status !== 'suspended' ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => onStatus('suspended')}
              className="rounded-[8px] border border-border px-3 py-1.5 text-xs text-text hover:bg-surface-secondary disabled:opacity-60"
            >
              Suspend
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function StaffDetail({
  user,
  isSelf,
  canManageRoles,
  rolePending,
  onRoleChange,
}: {
  user: StaffUser;
  isSelf: boolean;
  canManageRoles: boolean;
  rolePending: boolean;
  onRoleChange: (roleCode: string) => void;
}) {
  const currentRole = user.roles.includes('super_admin')
    ? 'super_admin'
    : user.roles.includes('admin')
      ? 'admin'
      : '';

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-2xl text-text">{user.fullName}</h2>
        <p className="text-sm text-text-secondary">{user.email}</p>
      </div>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-text-secondary">Status</dt>
          <dd className="text-text">{user.status}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-text-secondary">Role</dt>
          <dd className="text-text">{formatRole(user.roles)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-text-secondary">Last login</dt>
          <dd className="text-text">{formatDate(user.lastLoginAt)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-text-secondary">Created</dt>
          <dd className="text-text">{formatDate(user.createdAt)}</dd>
        </div>
      </dl>
      {canManageRoles && !isSelf ? (
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-text-secondary">Change role</span>
          <select
            value={currentRole}
            disabled={rolePending || !currentRole}
            onChange={(event) => onRoleChange(event.target.value)}
            className="rounded-[12px] border border-border bg-surface px-3 py-2"
          >
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </label>
      ) : null}
      {isSelf ? (
        <p className="text-xs text-text-secondary">You cannot change your own role or status.</p>
      ) : null}
    </div>
  );
}
