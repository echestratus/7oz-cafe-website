import type { ApiErrorResponse, ApiSuccessResponse } from '@7oz/shared-types';

import { getApiBaseUrl } from '@/lib/env';

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  kind: 'news' | 'event' | string;
  coverUrl?: string | null;
  status: string;
  publishedAt?: string | null;
  seo?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type BlogListResult = {
  items: BlogPost[];
  page: number;
  limit: number;
  total: number;
};

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | ApiSuccessResponse<T>
    | ApiErrorResponse
    | null;

  if (!response.ok || !payload || payload.success === false) {
    throw new Error(payload && 'message' in payload ? payload.message : 'Unable to load blogs.');
  }

  return payload.data;
}

export async function listPublishedBlogs(page = 1, limit = 12): Promise<BlogListResult> {
  const response = await fetch(
    `${getApiBaseUrl()}/public/blogs?page=${page}&limit=${limit}`,
    {
      next: { revalidate: 60 },
      headers: { Accept: 'application/json' },
    },
  );
  return parseResponse<BlogListResult>(response);
}

export async function getPublishedBlogBySlug(slug: string): Promise<BlogPost> {
  const response = await fetch(`${getApiBaseUrl()}/public/blogs/${encodeURIComponent(slug)}`, {
    next: { revalidate: 60 },
    headers: { Accept: 'application/json' },
  });
  return parseResponse<BlogPost>(response);
}

export const fallbackBlogPosts: BlogPost[] = [
  {
    id: 'fallback-1',
    slug: 'malaysias-minister-of-religious-affairs-visits-7oz-cafe-in-uzbekistan',
    title: "Malaysia's Minister of Religious Affairs Visits 7oz Cafe in Uzbekistan",
    excerpt:
      "Malaysia's Minister of Religious Affairs visited 7oz Cafe in Uzbekistan during an official visit.",
    body: "Malaysia's Minister of Religious Affairs visited 7oz Cafe in Uzbekistan during an official visit. The stop showcased the cafe's warm hospitality, inviting atmosphere, and commitment to serving quality food and beverages.",
    kind: 'news',
    status: 'published',
    publishedAt: '2026-05-25T07:00:00Z',
    createdAt: '2026-05-25T07:00:00Z',
    updatedAt: '2026-05-25T07:00:00Z',
  },
  {
    id: 'fallback-2',
    slug: 'grand-opening-7oz-espresso-cafe-in-tashkent',
    title: 'Grand Opening 7oz Espresso Cafe in Tashkent',
    excerpt:
      '7oz Espresso Cafe opened in Tashkent Boulevard on April 15, 2026 — bringing Indonesian coffee heritage to Uzbekistan.',
    body: '7oz Espresso Cafe officially made history by hosting a festive grand opening on Wednesday, April 15, 2026, in Tashkent Boulevard, Uzbekistan.',
    kind: 'event',
    status: 'published',
    publishedAt: '2026-04-15T10:00:00Z',
    createdAt: '2026-04-15T10:00:00Z',
    updatedAt: '2026-04-15T10:00:00Z',
  },
];
