import type { MetadataRoute } from 'next';

import { getAppUrl } from '@/lib/env';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getAppUrl();
  const routes = ['', '/about', '/menu', '/gallery', '/membership', '/reservations', '/contact'];

  return routes.map((route) => ({
    url: `${base}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.7,
  }));
}
