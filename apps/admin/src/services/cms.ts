import type { CmsPageSnapshot, CmsSection } from '@7oz/shared-types';

import { apiRequest } from '@/lib/api-client';

export type CmsPageSummary = {
  id: string;
  slug: string;
  title: string;
  status: string;
  seo: Record<string, unknown>;
  publishedVersionId?: string;
};

export type CmsVersionSummary = {
  id: string;
  versionNumber: number;
  summary: string;
  publishedAt: string;
  publishedBy?: string;
};

export async function listCmsPages(): Promise<CmsPageSummary[]> {
  return apiRequest<CmsPageSummary[]>('/admin/cms/pages');
}

export async function getCmsDraft(slug: string): Promise<CmsPageSnapshot> {
  return apiRequest<CmsPageSnapshot>(`/admin/cms/pages/${encodeURIComponent(slug)}`);
}

export async function updateSection(
  sectionId: string,
  payload: { data?: Record<string, unknown>; isEnabled?: boolean },
): Promise<CmsSection> {
  return apiRequest<CmsSection>(`/admin/cms/sections/${sectionId}`, {
    method: 'PATCH',
    body: payload,
  });
}

export async function publishCmsPage(slug: string, summary: string): Promise<CmsVersionSummary> {
  return apiRequest<CmsVersionSummary>(`/admin/cms/pages/${encodeURIComponent(slug)}/publish`, {
    method: 'POST',
    body: { summary },
  });
}

export async function rollbackCmsPage(
  slug: string,
  versionNumber: number,
  summary: string,
): Promise<CmsVersionSummary> {
  return apiRequest<CmsVersionSummary>(`/admin/cms/pages/${encodeURIComponent(slug)}/rollback`, {
    method: 'POST',
    body: { versionNumber, summary },
  });
}

export async function listCmsVersions(slug: string): Promise<CmsVersionSummary[]> {
  return apiRequest<CmsVersionSummary[]>(`/admin/cms/pages/${encodeURIComponent(slug)}/versions`);
}
