'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { ApiClientError } from '@/lib/api-client';
import { getApiBaseUrl } from '@/lib/env';
import { deleteMedia, listMedia, uploadMedia } from '@/services/media';

export function MediaLibrary() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const mediaQuery = useQuery({
    queryKey: ['media'],
    queryFn: () => listMedia(1, 50),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadMedia(file),
    onSuccess: async () => {
      setError(null);
      setMessage('Media uploaded.');
      await queryClient.invalidateQueries({ queryKey: ['media'] });
    },
    onError: (err) => {
      setMessage(null);
      setError(err instanceof ApiClientError ? err.message : 'Upload failed.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMedia(id),
    onSuccess: async () => {
      setError(null);
      setMessage('Media deleted.');
      await queryClient.invalidateQueries({ queryKey: ['media'] });
    },
    onError: (err) => {
      setMessage(null);
      setError(err instanceof ApiClientError ? err.message : 'Delete failed.');
    },
  });

  return (
    <div>
      <PageHeader
        title="Media Library"
        description="Upload and manage images used by CMS and future modules."
        actions={
          <label className="inline-flex cursor-pointer items-center rounded-[12px] bg-primary px-4 py-2.5 text-sm text-white hover:bg-primary-hover">
            {uploadMutation.isPending ? 'Uploading…' : 'Upload file'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,application/pdf"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  uploadMutation.mutate(file);
                }
                event.currentTarget.value = '';
              }}
            />
          </label>
        }
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

      {mediaQuery.isLoading ? (
        <p className="text-sm text-text-secondary">Loading media…</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(mediaQuery.data ?? []).map((asset) => {
          const absoluteUrl = asset.url.startsWith('http')
            ? asset.url
            : `${getApiBaseUrl().replace(/\/api\/v1$/, '')}${asset.url}`;

          return (
            <article key={asset.id} className="rounded-[16px] border border-border bg-surface p-4">
              <p className="truncate text-sm font-medium text-text">{asset.fileName}</p>
              <p className="mt-1 text-xs text-text-secondary">{asset.mimeType}</p>
              <a
                href={absoluteUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-sm text-primary hover:text-primary-hover"
              >
                Open
              </a>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(asset.id)}
                className="mt-3 ml-4 text-sm text-text-secondary hover:text-text"
              >
                Delete
              </button>
            </article>
          );
        })}
      </div>

      {!mediaQuery.isLoading && (mediaQuery.data?.length ?? 0) === 0 ? (
        <p className="text-sm text-text-secondary">No media uploaded yet.</p>
      ) : null}
    </div>
  );
}
