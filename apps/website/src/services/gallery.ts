import type { ApiErrorResponse, ApiSuccessResponse } from '@7oz/shared-types';

import type { LightboxImage } from '@/components/ui/image-lightbox';
import { getApiBaseUrl } from '@/lib/env';

export type GalleryItem = {
  id: string;
  imageUrl: string;
  locationSlug: string;
  category: string;
  altText: string;
  caption: string;
  sortOrder: number;
  isVisible: boolean;
};

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | ApiSuccessResponse<T>
    | ApiErrorResponse
    | null;

  if (!response.ok || !payload || payload.success === false) {
    throw new Error(payload && 'message' in payload ? payload.message : 'Unable to load gallery.');
  }

  return payload.data;
}

export async function listPublicGallery(locationSlug: string): Promise<GalleryItem[]> {
  const search = new URLSearchParams({ locationSlug });
  const response = await fetch(`${getApiBaseUrl()}/public/gallery?${search.toString()}`, {
    next: { revalidate: 60 },
    headers: { Accept: 'application/json' },
  });
  return parseResponse<GalleryItem[]>(response);
}

export function toLightboxImages(items: GalleryItem[], locationLabel: string): LightboxImage[] {
  return items.map((item, index) => ({
    src: item.imageUrl,
    alt: item.altText || `${locationLabel} atmosphere ${index + 1}`,
    caption: item.caption || `Gallery ${index + 1}`,
  }));
}
