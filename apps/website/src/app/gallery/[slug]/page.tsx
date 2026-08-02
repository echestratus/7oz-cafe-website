import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SiteShell } from '@/components/layout/site-shell';
import { LocationGalleryView } from '@/features/gallery/components/location-gallery-view';
import { listGalleryImages } from '@/features/gallery/lib/list-gallery-images';
import { ComingSoonLocationView } from '@/features/locations/components/coming-soon-location-view';
import {
  CAFE_LOCATIONS,
  getLocationBySlug,
} from '@/features/locations/lib/locations';
import { getPublishedCmsPage } from '@/services/cms';
import { listPublicGallery, toLightboxImages } from '@/services/gallery';

interface GalleryLocationPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return CAFE_LOCATIONS.map((location) => ({ slug: location.slug }));
}

export async function generateMetadata({
  params,
}: GalleryLocationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const location = getLocationBySlug(slug);
  if (!location) {
    return { title: 'Gallery' };
  }

  const isOpen = location.status === 'open';
  return {
    title: isOpen ? `${location.shortName} Gallery` : `${location.shortName} — Coming Soon`,
    description: isOpen
      ? `Atmosphere and craft from ${location.name}.`
      : `${location.name} is coming soon. ${location.address}`,
    alternates: { canonical: `/gallery/${location.slug}` },
  };
}

export default async function GalleryLocationPage({ params }: GalleryLocationPageProps) {
  const { slug } = await params;
  const location = getLocationBySlug(slug);
  if (!location) {
    notFound();
  }

  const footer = await getPublishedCmsPage('footer');

  if (location.status === 'coming_soon' || !location.hasGallery) {
    return (
      <SiteShell footer={footer} headerTone="overlay">
        <ComingSoonLocationView location={location} />
      </SiteShell>
    );
  }

  let images = await listGalleryImages(location.name);
  try {
    const remote = await listPublicGallery(location.slug);
    if (remote.length > 0) {
      images = toLightboxImages(remote, location.name);
    }
  } catch {
    // Keep filesystem gallery if the API is unavailable or empty.
  }

  return (
    <SiteShell footer={footer}>
      <LocationGalleryView location={location} images={images} />
    </SiteShell>
  );
}
