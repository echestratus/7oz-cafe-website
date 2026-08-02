import { readdir } from 'node:fs/promises';
import path from 'node:path';

import type { LightboxImage } from '@/components/ui/image-lightbox';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

export async function listGalleryImages(
  locationLabel = '7Oz cafe',
): Promise<LightboxImage[]> {
  const directory = path.join(process.cwd(), 'public', 'assets', 'gallery');
  try {
    const entries = await readdir(directory);
    return entries
      .filter((entry) => IMAGE_EXTENSIONS.has(path.extname(entry).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((entry, index) => ({
        src: `/assets/gallery/${entry}`,
        alt: `${locationLabel} atmosphere ${index + 1}`,
        caption: `Gallery ${index + 1}`,
      }));
  } catch {
    return [];
  }
}
