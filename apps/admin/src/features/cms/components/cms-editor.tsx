'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { ApiClientError } from '@/lib/api-client';
import {
  getCmsDraft,
  listCmsVersions,
  publishCmsPage,
  rollbackCmsPage,
  updateSection,
} from '@/services/cms';

interface CmsEditorProps {
  slug: string;
}

export function CmsEditor({ slug }: CmsEditorProps) {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState('');
  const [rollbackVersion, setRollbackVersion] = useState(1);
  const [draftBySection, setDraftBySection] = useState<Record<string, string>>({});

  const draftQuery = useQuery({
    queryKey: ['cms-draft', slug],
    queryFn: () => getCmsDraft(slug),
  });

  const versionsQuery = useQuery({
    queryKey: ['cms-versions', slug],
    queryFn: () => listCmsVersions(slug),
  });

  const sectionDrafts = useMemo(() => {
    const map: Record<string, string> = {};
    for (const section of draftQuery.data?.sections ?? []) {
      map[section.id] = draftBySection[section.id] ?? JSON.stringify(section.data, null, 2);
    }
    return map;
  }, [draftBySection, draftQuery.data?.sections]);

  const saveMutation = useMutation({
    mutationFn: async (sectionId: string) => {
      const raw = sectionDrafts[sectionId] ?? '{}';
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      return updateSection(sectionId, { data: parsed });
    },
    onSuccess: async () => {
      setError(null);
      setMessage('Section draft saved.');
      await queryClient.invalidateQueries({ queryKey: ['cms-draft', slug] });
    },
    onError: (err) => {
      setMessage(null);
      setError(err instanceof Error ? err.message : 'Failed to save section.');
    },
  });

  const publishMutation = useMutation({
    mutationFn: () => publishCmsPage(slug, summary || `Publish ${slug}`),
    onSuccess: async (version) => {
      setError(null);
      setMessage(`Published version ${version.versionNumber}.`);
      setSummary('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cms-draft', slug] }),
        queryClient.invalidateQueries({ queryKey: ['cms-versions', slug] }),
        queryClient.invalidateQueries({ queryKey: ['cms-pages'] }),
      ]);
    },
    onError: (err) => {
      setMessage(null);
      setError(err instanceof ApiClientError ? err.message : 'Publish failed.');
    },
  });

  const rollbackMutation = useMutation({
    mutationFn: () =>
      rollbackCmsPage(slug, rollbackVersion, summary || `Rollback to v${rollbackVersion}`),
    onSuccess: async (version) => {
      setError(null);
      setMessage(`Rolled back and republished as version ${version.versionNumber}.`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cms-draft', slug] }),
        queryClient.invalidateQueries({ queryKey: ['cms-versions', slug] }),
        queryClient.invalidateQueries({ queryKey: ['cms-pages'] }),
      ]);
    },
    onError: (err) => {
      setMessage(null);
      setError(err instanceof ApiClientError ? err.message : 'Rollback failed.');
    },
  });

  if (draftQuery.isLoading) {
    return <p className="text-sm text-text-secondary">Loading CMS draft…</p>;
  }

  if (draftQuery.isError || !draftQuery.data) {
    return (
      <p className="text-sm text-red-700" role="alert">
        Unable to load CMS page.
      </p>
    );
  }

  const page = draftQuery.data.page;

  return (
    <div>
      <PageHeader
        title={page.title}
        description={`Slug: ${page.slug} · Status: ${page.status}`}
        actions={
          <Link
            href="/cms"
            className="rounded-[12px] border border-border px-4 py-2 text-sm text-text hover:bg-surface-secondary"
          >
            Back to pages
          </Link>
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

      <div className="mb-8 grid gap-4 rounded-[16px] border border-border bg-surface p-5 md:grid-cols-[1fr_auto_auto] md:items-end">
        <div className="space-y-2">
          <label htmlFor="summary" className="text-sm font-medium text-text">
            Publish / rollback summary
          </label>
          <input
            id="summary"
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            className="w-full rounded-[12px] border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            placeholder="Optional change summary"
          />
        </div>
        <button
          type="button"
          onClick={() => publishMutation.mutate()}
          disabled={publishMutation.isPending}
          className="rounded-[12px] bg-primary px-4 py-2.5 text-sm text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {publishMutation.isPending ? 'Publishing…' : 'Publish'}
        </button>
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            value={rollbackVersion}
            onChange={(event) => setRollbackVersion(Number(event.target.value))}
            className="w-20 rounded-[12px] border border-border px-3 py-2 text-sm"
            aria-label="Rollback version number"
          />
          <button
            type="button"
            onClick={() => rollbackMutation.mutate()}
            disabled={rollbackMutation.isPending}
            className="rounded-[12px] border border-border px-4 py-2.5 text-sm hover:bg-surface-secondary disabled:opacity-60"
          >
            Rollback
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {draftQuery.data.sections.map((section) => (
          <section key={section.id} className="rounded-[16px] border border-border bg-surface p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-medium text-text">{section.label}</h2>
                <p className="text-xs text-text-secondary">
                  {section.code} · {section.isEnabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  try {
                    JSON.parse(sectionDrafts[section.id] ?? '{}');
                    saveMutation.mutate(section.id);
                  } catch {
                    setError(`Invalid JSON in section ${section.code}.`);
                  }
                }}
                className="rounded-[12px] border border-border px-3 py-2 text-sm hover:bg-surface-secondary"
              >
                Save draft
              </button>
            </div>
            <textarea
              value={sectionDrafts[section.id] ?? ''}
              onChange={(event) =>
                setDraftBySection((prev) => ({ ...prev, [section.id]: event.target.value }))
              }
              rows={12}
              className="w-full rounded-[12px] border border-border bg-background px-3 py-3 font-mono text-xs leading-relaxed outline-none focus:border-primary"
              aria-label={`${section.label} JSON content`}
            />
          </section>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="mb-4 text-lg font-medium text-text">Versions</h2>
        <div className="overflow-hidden rounded-[16px] border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface-secondary text-text-secondary">
              <tr>
                <th className="px-4 py-3 font-medium">Version</th>
                <th className="px-4 py-3 font-medium">Summary</th>
                <th className="px-4 py-3 font-medium">Published</th>
              </tr>
            </thead>
            <tbody>
              {(versionsQuery.data ?? []).map((version) => (
                <tr key={version.id} className="border-t border-border">
                  <td className="px-4 py-3">v{version.versionNumber}</td>
                  <td className="px-4 py-3">{version.summary || '—'}</td>
                  <td className="px-4 py-3 text-text-secondary">
                    {new Date(version.publishedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
