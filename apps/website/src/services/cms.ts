import type { ApiSuccessResponse, CmsPageSnapshot, CmsSection } from '@7oz/shared-types';

import { getApiBaseUrl } from '@/lib/env';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeSection(raw: unknown): CmsSection | null {
  if (!isRecord(raw)) {
    return null;
  }

  const id = typeof raw.id === 'string' ? raw.id : null;
  const code = typeof raw.code === 'string' ? raw.code : null;
  const label = typeof raw.label === 'string' ? raw.label : '';
  const isEnabled = typeof raw.isEnabled === 'boolean' ? raw.isEnabled : true;
  const sortOrder = typeof raw.sortOrder === 'number' ? raw.sortOrder : 0;
  const data = isRecord(raw.data) ? raw.data : {};

  if (!id || !code) {
    return null;
  }

  return { id, code, label, isEnabled, sortOrder, data };
}

function normalizeSnapshot(raw: unknown): CmsPageSnapshot | null {
  if (!isRecord(raw) || !isRecord(raw.page)) {
    return null;
  }

  const page = raw.page;
  const id = typeof page.id === 'string' ? page.id : null;
  const slug = typeof page.slug === 'string' ? page.slug : null;
  const title = typeof page.title === 'string' ? page.title : '';
  const status = typeof page.status === 'string' ? page.status : 'published';
  const seo = isRecord(page.seo) ? page.seo : {};

  if (!id || !slug) {
    return null;
  }

  const sections = Array.isArray(raw.sections)
    ? raw.sections.map(normalizeSection).filter((section): section is CmsSection => section !== null)
    : [];

  return {
    page: {
      id,
      slug,
      title,
      status,
      seo: {
        metaTitle: typeof seo.metaTitle === 'string' ? seo.metaTitle : undefined,
        metaDescription: typeof seo.metaDescription === 'string' ? seo.metaDescription : undefined,
        canonicalPath: typeof seo.canonicalPath === 'string' ? seo.canonicalPath : undefined,
      },
    },
    sections,
  };
}

export async function getPublishedCmsPage(slug: string): Promise<CmsPageSnapshot | null> {
  const endpoint = `${getApiBaseUrl()}/public/cms/${encodeURIComponent(slug)}`;

  try {
    const response = await fetch(endpoint, {
      next: { revalidate: 60 },
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as ApiSuccessResponse<unknown>;
    if (!payload.success) {
      return null;
    }

    return normalizeSnapshot(payload.data);
  } catch {
    return null;
  }
}

export function getSection(snapshot: CmsPageSnapshot | null, code: string): CmsSection | null {
  if (!snapshot) {
    return null;
  }

  return snapshot.sections.find((section) => section.code === code && section.isEnabled) ?? null;
}

export function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

export function asCta(value: unknown): { label: string; href: string } | null {
  if (!isRecord(value)) {
    return null;
  }

  const label = asString(value.label);
  const href = asString(value.href);
  if (!label || !href) {
    return null;
  }

  return { label, href };
}
