import type { Metadata } from 'next';

import { SiteShell } from '@/components/layout/site-shell';
import { GalleryLocationPicker } from '@/features/gallery/components/gallery-location-picker';
import { getPublishedCmsPage } from '@/services/cms';

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'Choose a 7Oz location and explore atmosphere from each cafe.',
  alternates: { canonical: '/gallery' },
};

export default async function GalleryPage() {
  const footer = await getPublishedCmsPage('footer');

  return (
    <SiteShell footer={footer}>
      <GalleryLocationPicker />
    </SiteShell>
  );
}
