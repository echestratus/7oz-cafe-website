import type { Metadata } from 'next';

import { SiteShell } from '@/components/layout/site-shell';
import { HomePageView } from '@/features/home/components/home-page-view';
import { metadataFromSeo } from '@/lib/seo';
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
  const [homepage, footer] = await Promise.all([
    getPublishedCmsPage('homepage'),
    getPublishedCmsPage('footer'),
  ]);

  return (
    <SiteShell footer={footer} headerTone="overlay">
      <HomePageView homepage={homepage} />
    </SiteShell>
  );
}
