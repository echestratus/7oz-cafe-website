'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { ApiClientError } from '@/lib/api-client';
import {
  getCustomer,
  listCustomers,
  updateCustomerStatus,
  type Customer,
} from '@/services/customers';
import { useAuthStore } from '@/stores/auth-store';

const statuses = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'pending_verification', label: 'Pending verification' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'inactive', label: 'Inactive' },
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

export function CustomersManager() {
  const queryClient = useQueryClient();
  const canManage = useAuthStore((state) => state.hasPermission('user.manage'));
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ['admin-customers', status, search],
    queryFn: () =>
      listCustomers({
        status: status || undefined,
        search: search || undefined,
        limit: 50,
      }),
  });

  const detailQuery = useQuery({
    queryKey: ['admin-customer', selectedId],
    queryFn: () => getCustomer(selectedId as string),
    enabled: Boolean(selectedId),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: string }) =>
      updateCustomerStatus(id, nextStatus, `Status set to ${nextStatus}`),
    onSuccess: async () => {
      setError(null);
      setMessage('Customer status updated.');
      await queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-customer'] });
    },
    onError: (err) => {
      setMessage(null);
      setError(err instanceof ApiClientError ? err.message : 'Update failed.');
    },
  });

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Search customer accounts and manage access status."
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
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          {listQuery.isLoading ? <p className="text-sm text-text-secondary">Loading customers…</p> : null}
          {!listQuery.isLoading && (listQuery.data?.items.length ?? 0) === 0 ? (
            <p className="text-sm text-text-secondary">No customers found.</p>
          ) : null}
          {(listQuery.data?.items ?? []).map((item) => (
            <CustomerRow
              key={item.id}
              customer={item}
              selected={selectedId === item.id}
              canManage={canManage}
              pending={statusMutation.isPending}
              onSelect={() => setSelectedId(item.id)}
              onStatus={(nextStatus) => statusMutation.mutate({ id: item.id, nextStatus })}
            />
          ))}
        </div>

        <aside className="rounded-[16px] border border-border bg-surface p-5">
          {!selectedId ? (
            <p className="text-sm text-text-secondary">Select a customer to view details.</p>
          ) : null}
          {detailQuery.isLoading ? (
            <p className="text-sm text-text-secondary">Loading details…</p>
          ) : null}
          {detailQuery.error ? (
            <p className="text-sm text-red-700" role="alert">
              {detailQuery.error instanceof ApiClientError
                ? detailQuery.error.message
                : 'Unable to load customer.'}
            </p>
          ) : null}
          {detailQuery.data ? <CustomerDetail customer={detailQuery.data} /> : null}
        </aside>
      </div>
    </div>
  );
}

function CustomerRow({
  customer,
  selected,
  canManage,
  pending,
  onSelect,
  onStatus,
}: {
  customer: Customer;
  selected: boolean;
  canManage: boolean;
  pending: boolean;
  onSelect: () => void;
  onStatus: (status: string) => void;
}) {
  return (
    <article
      className={`rounded-[16px] border p-4 ${
        selected ? 'border-primary bg-primary/5' : 'border-border bg-surface'
      }`}
    >
      <button type="button" onClick={onSelect} className="w-full text-left">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-medium text-text">{customer.fullName}</p>
            <p className="text-sm text-text-secondary">{customer.email}</p>
          </div>
          <p className="rounded-full bg-surface-secondary px-3 py-1 text-xs capitalize text-text">
            {customer.status.replaceAll('_', ' ')}
          </p>
        </div>
        <p className="mt-2 text-xs text-text-muted">
          Joined {formatDate(customer.createdAt)}
          {customer.emailVerified ? ' · Verified' : ' · Unverified'}
        </p>
      </button>

      {canManage ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {customer.status !== 'active' ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => onStatus('active')}
              className="rounded-[10px] border border-border px-3 py-1.5 text-xs text-text hover:bg-surface-secondary disabled:opacity-50"
            >
              Activate
            </button>
          ) : null}
          {customer.status !== 'suspended' ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => onStatus('suspended')}
              className="rounded-[10px] border border-border px-3 py-1.5 text-xs text-text hover:bg-surface-secondary disabled:opacity-50"
            >
              Suspend
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function CustomerDetail({ customer }: { customer: Customer }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-wide text-text-secondary">Customer</p>
        <h2 className="mt-1 text-xl text-text">{customer.fullName}</h2>
        <p className="text-sm text-text-secondary">{customer.email}</p>
      </div>

      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-text-secondary">Status</dt>
          <dd className="capitalize text-text">{customer.status.replaceAll('_', ' ')}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-text-secondary">Email</dt>
          <dd className="text-text">{customer.emailVerified ? 'Verified' : 'Not verified'}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-text-secondary">Last login</dt>
          <dd className="text-text">{formatDate(customer.lastLoginAt)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-text-secondary">Roles</dt>
          <dd className="text-text">{customer.roles.join(', ') || '—'}</dd>
        </div>
      </dl>

      <section className="space-y-2 border-t border-border pt-4">
        <h3 className="text-sm font-medium text-text">Membership</h3>
        {customer.membership ? (
          <p className="text-sm text-text-secondary">
            {customer.membership.levelName} ({customer.membership.levelCode}) · #
            {customer.membership.membershipNumber} ·{' '}
            <span className="capitalize">{customer.membership.status}</span>
          </p>
        ) : (
          <p className="text-sm text-text-secondary">No membership yet.</p>
        )}
      </section>

      <section className="space-y-2 border-t border-border pt-4">
        <h3 className="text-sm font-medium text-text">Loyalty</h3>
        {customer.loyalty ? (
          <p className="text-sm text-text-secondary">
            Balance {customer.loyalty.balance} · Earned {customer.loyalty.lifetimeEarned} · Redeemed{' '}
            {customer.loyalty.lifetimeRedeemed}
          </p>
        ) : (
          <p className="text-sm text-text-secondary">No loyalty account yet.</p>
        )}
      </section>
    </div>
  );
}
