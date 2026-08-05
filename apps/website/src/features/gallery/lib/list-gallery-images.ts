import { readdir } from 'node:fs/promises';
import path from 'node:path';

import type { LightboxImage } from '@/components/ui/image-lightbox';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

/**
 * Lists image files under `public/assets/gallery/{locationSlug}/`.
 * Gallery assets are organized per location slug (e.g. city-park, kampoeng-indonesia).
 */
export async function listGalleryImages(
  locationSlug: string,
  locationLabel = '7Oz cafe',
): Promise<LightboxImage[]> {
  const slug = locationSlug.trim();
  if (!slug) {
    return [];
  }

  const directory = path.join(process.cwd(), 'public', 'assets', 'gallery', slug);
  try {
    const entries = await readdir(directory);
    return entries
      .filter((entry) => IMAGE_EXTENSIONS.has(path.extname(entry).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((entry, index) => ({
        src: `/assets/gallery/${slug}/${entry}`,
        alt: `${locationLabel} atmosphere ${index + 1}`,
        caption: `Gallery ${index + 1}`,
      }));
  } catch {
    return [];
  }
}
