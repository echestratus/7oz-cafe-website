'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { ApiClientError } from '@/lib/api-client';
import {
  getContactMessage,
  listContactMessages,
  updateContactMessageStatus,
  type ContactMessage,
  type ContactMessageStatus,
} from '@/services/contact-messages';

const statuses = [
  { value: '', label: 'All statuses' },
  { value: 'new', label: 'New' },
  { value: 'read', label: 'Read' },
  { value: 'archived', label: 'Archived' },
] as const;

function formatDate(value?: string | null): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function previewMessage(message: string): string {
  const trimmed = message.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= 100) {
    return trimmed;
  }
  return `${trimmed.slice(0, 97)}…`;
}

export function ContactMessagesManager() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ['admin-contact-messages', status, search],
    queryFn: () =>
      listContactMessages({
        status: status || undefined,
        search: search || undefined,
        limit: 50,
      }),
  });

  const detailQuery = useQuery({
    queryKey: ['admin-contact-message', selectedId],
    queryFn: () => getContactMessage(selectedId as string),
    enabled: Boolean(selectedId),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: ContactMessageStatus }) =>
      updateContactMessageStatus(id, nextStatus),
    onSuccess: async () => {
      setError(null);
      setMessage('Message status updated.');
      await queryClient.invalidateQueries({ queryKey: ['admin-contact-messages'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-contact-message'] });
    },
    onError: (err) => {
      setMessage(null);
      setError(err instanceof ApiClientError ? err.message : 'Update failed.');
    },
  });

  return (
    <div>
      <PageHeader
        title="Contact inbox"
        description="Review messages submitted from the public contact form."
      />

      {message ? (
        <p className="mb-4 rounded-[12px] border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {message}
        </p>
      ) : null}
      {error ? (
        <p
          className="mb-4 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
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
          {listQuery.isLoading ? (
            <p className="text-sm text-text-secondary">Loading messages…</p>
          ) : null}
          {!listQuery.isLoading && (listQuery.data?.items.length ?? 0) === 0 ? (
            <p className="text-sm text-text-secondary">No contact messages found.</p>
          ) : null}
          {(listQuery.data?.items ?? []).map((item) => (
            <MessageRow
              key={item.id}
              item={item}
              selected={selectedId === item.id}
              onSelect={() => {
                setMessage(null);
                setError(null);
                setSelectedId(item.id);
              }}
            />
          ))}
        </div>

        <aside className="rounded-[16px] border border-border bg-surface p-5">
          {!selectedId ? (
            <p className="text-sm text-text-secondary">Select a message to read it.</p>
          ) : null}
          {detailQuery.isLoading ? (
            <p className="text-sm text-text-secondary">Loading message…</p>
          ) : null}
          {detailQuery.error ? (
            <p className="text-sm text-red-700" role="alert">
              {detailQuery.error instanceof ApiClientError
                ? detailQuery.error.message
                : 'Unable to load message.'}
            </p>
          ) : null}
          {detailQuery.data ? (
            <MessageDetail
              item={detailQuery.data}
              pending={statusMutation.isPending}
              onStatus={(nextStatus) => {
                setMessage(null);
                setError(null);
                statusMutation.mutate({ id: detailQuery.data.id, nextStatus });
              }}
            />
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function MessageRow({
  item,
  selected,
  onSelect,
}: {
  item: ContactMessage;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-[16px] border px-4 py-4 text-left transition-colors ${
        selected
          ? 'border-primary bg-surface-secondary'
          : 'border-border bg-surface hover:bg-surface-secondary'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-text">{item.fullName}</p>
          <p className="text-sm text-text-secondary">{item.email}</p>
        </div>
        <span className="rounded-full bg-surface-secondary px-2.5 py-1 text-xs capitalize text-text">
          {item.status}
        </span>
      </div>
      <p className="mt-2 text-sm text-text-secondary">{previewMessage(item.message)}</p>
      <p className="mt-2 text-xs text-text-muted">{formatDate(item.createdAt)}</p>
    </button>
  );
}

function MessageDetail({
  item,
  pending,
  onStatus,
}: {
  item: ContactMessage;
  pending: boolean;
  onStatus: (status: ContactMessageStatus) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-text-secondary">From</p>
        <p className="text-base font-medium text-text">{item.fullName}</p>
        <p className="text-sm text-text-secondary">
          <a className="text-primary hover:underline" href={`mailto:${item.email}`}>
            {item.email}
          </a>
        </p>
        {item.phone ? <p className="text-sm text-text-secondary">{item.phone}</p> : null}
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-text-secondary">Received</p>
        <p className="text-sm text-text">{formatDate(item.createdAt)}</p>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-text-secondary">Status</p>
        <p className="text-sm capitalize text-text">{item.status}</p>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-text-secondary">Message</p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-text">{item.message}</p>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        {item.status !== 'read' ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => onStatus('read')}
            className="rounded-[12px] border border-border px-3 py-2 text-sm text-text disabled:opacity-50"
          >
            Mark read
          </button>
        ) : null}
        {item.status !== 'archived' ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => onStatus('archived')}
            className="rounded-[12px] bg-primary px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            Archive
          </button>
        ) : null}
        {item.status === 'archived' ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => onStatus('new')}
            className="rounded-[12px] border border-border px-3 py-2 text-sm text-text disabled:opacity-50"
          >
            Mark new
          </button>
        ) : null}
      </div>
    </div>
  );
}
