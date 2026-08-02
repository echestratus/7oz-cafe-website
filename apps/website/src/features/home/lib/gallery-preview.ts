import { listGalleryImages } from '@/features/gallery/lib/list-gallery-images';
import { getPrimaryLocation } from '@/features/locations/lib/locations';
import { listPublicGallery } from '@/services/gallery';

export interface GalleryPreviewImage {
  src: string;
  alt: string;
}

/** Curated fallback when API and filesystem gallery are both unavailable. */
const CURATED_PREVIEW_IMAGES = [
  '/assets/gallery/7oz-5.webp',
  '/assets/gallery/7oz-9.webp',
  '/assets/gallery/7oz-2.webp',
  '/assets/gallery/7oz-7.webp',
  '/assets/gallery/7oz-6.webp',
  '/assets/gallery/7oz-13.webp',
] as const;

const PREVIEW_FETCH_LIMIT = 12;

function curatedPreview(locationLabel: string, limit: number): GalleryPreviewImage[] {
  return CURATED_PREVIEW_IMAGES.slice(0, limit).map((src, index) => ({
    src,
    alt: `${locationLabel} atmosphere ${index + 1}`,
  }));
}

/**
 * Loads homepage gallery preview for the primary open location.
 * Prefers the public gallery API, then filesystem assets, then curated paths.
 */
export async function getGalleryPreviewImages(
  limit = PREVIEW_FETCH_LIMIT,
): Promise<GalleryPreviewImage[]> {
  const primary = getPrimaryLocation();
  const capped = Math.min(Math.max(limit, 1), PREVIEW_FETCH_LIMIT);

  try {
    const remote = await listPublicGallery(primary.slug);
    if (remote.length > 0) {
      return remote.slice(0, capped).map((item, index) => ({
        src: item.imageUrl,
        alt: item.altText || `${primary.shortName} atmosphere ${index + 1}`,
      }));
    }
  } catch {
    // Fall through to filesystem / curated.
  }

  const fromDisk = await listGalleryImages(primary.name);
  if (fromDisk.length > 0) {
    return fromDisk.slice(0, capped).map((image) => ({
      src: image.src,
      alt: image.alt,
    }));
  }

  return curatedPreview(primary.shortName, capped);
}
