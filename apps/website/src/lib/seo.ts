import type { Metadata } from 'next';

import type { CmsSeo } from '@7oz/shared-types';

import { getAppUrl } from '@/lib/env';

export function metadataFromSeo(
  seo: CmsSeo | undefined,
  fallback: { title: string; description: string; path: string },
): Metadata {
  const title = seo?.metaTitle || fallback.title;
  const description = seo?.metaDescription || fallback.description;
  const path = seo?.canonicalPath || fallback.path;
  const url = `${getAppUrl()}${path.startsWith('/') ? path : `/${path}`}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: '7Oz Espresso Cafe',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}
