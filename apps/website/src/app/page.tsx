import type { Metadata } from 'next';

import { SiteShell } from '@/components/layout/site-shell';
import { HomePageView } from '@/features/home/components/home-page-view';
import { getMenuCatalog, pickFeaturedMenuItems } from '@/features/menu/lib/menu-catalog';
import { metadataFromSeo } from '@/lib/seo';
import { fallbackBlogPosts, listPublishedBlogs } from '@/services/blog';
import { getPublishedCmsPage } from '@/services/cms';

export async function generateMetadata(): Promise<Metadata> {
  const homepage = await getPublishedCmsPage('homepage');
  return metadataFromSeo(homepage?.page.seo, {
    title: '7Oz Espresso Cafe',
    description: 'Premium espresso and cafe experience.',
    path: '/',
  });
}

export default async function HomePage() {
  const [homepage, footer, blogs, catalog] = await Promise.all([
    getPublishedCmsPage('homepage'),
    getPublishedCmsPage('footer'),
    listPublishedBlogs(1, 3).catch(() => ({
      items: fallbackBlogPosts.slice(0, 3),
      page: 1,
      limit: 3,
      total: fallbackBlogPosts.length,
    })),
    getMenuCatalog(),
  ]);

  const featuredMenu = pickFeaturedMenuItems(catalog);

  return (
    <SiteShell footer={footer} headerTone="overlay">
      <HomePageView homepage={homepage} blogPosts={blogs.items} featuredMenu={featuredMenu} />
    </SiteShell>
  );
}
