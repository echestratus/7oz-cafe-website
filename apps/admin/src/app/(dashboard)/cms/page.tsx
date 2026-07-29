'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

import { PageHeader } from '@/components/layout/page-header';
import { AuthGuard } from '@/features/auth/components/auth-guard';
import { listCmsPages } from '@/services/cms';

export default function CmsPagesPage() {
  return (
    <AuthGuard permission="cms.manage">
      <CmsPagesContent />
    </AuthGuard>
  );
}

function CmsPagesContent() {
  const pagesQuery = useQuery({
    queryKey: ['cms-pages'],
    queryFn: listCmsPages,
  });

  return (
    <div>
      <PageHeader
        title="CMS"
        description="Edit draft content, publish versions, and roll back website pages."
      />

      {pagesQuery.isLoading ? <p className="text-sm text-text-secondary">Loading pages…</p> : null}
      {pagesQuery.isError ? (
        <p className="text-sm text-red-700" role="alert">
          Unable to load CMS pages.
        </p>
      ) : null}

      <div className="overflow-hidden rounded-[16px] border border-border bg-surface">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-surface-secondary text-text-secondary">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(pagesQuery.data ?? []).map((page) => (
              <tr key={page.id} className="border-t border-border">
                <td className="px-4 py-3 text-text">{page.title}</td>
                <td className="px-4 py-3 text-text-secondary">{page.slug}</td>
                <td className="px-4 py-3 capitalize text-text-secondary">{page.status}</td>
                <td className="px-4 py-3">
                  <Link href={`/cms/${page.slug}`} className="text-primary hover:text-primary-hover">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
