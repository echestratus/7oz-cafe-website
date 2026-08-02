import { apiRequest } from '@/lib/api-client';

export type GalleryItem = {
  id: string;
  imageUrl: string;
  mediaId?: string | null;
  locationSlug: string;
  category: string;
  altText: string;
  caption: string;
  sortOrder: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedGallery = {
  items: GalleryItem[];
  page: number;
  limit: number;
  total: number;
};

export type GalleryWriteInput = {
  imageUrl: string;
  mediaId?: string | null;
  locationSlug: string;
  category?: string;
  altText?: string;
  caption?: string;
  sortOrder?: number;
  isVisible?: boolean;
};

export async function listAdminGallery(params?: {
  page?: number;
  limit?: number;
  locationSlug?: string;
}): Promise<PaginatedGallery> {
  const query = new URLSearchParams();
  query.set('page', String(params?.page ?? 1));
  query.set('limit', String(params?.limit ?? 50));
  if (params?.locationSlug) {
    query.set('locationSlug', params.locationSlug);
  }
  return apiRequest<PaginatedGallery>(`/admin/gallery?${query.toString()}`);
}

export async function createAdminGalleryItem(input: GalleryWriteInput): Promise<GalleryItem> {
  return apiRequest<GalleryItem>('/admin/gallery', {
    method: 'POST',
    body: input,
  });
}

export async function updateAdminGalleryItem(
  id: string,
  input: GalleryWriteInput,
): Promise<GalleryItem> {
  return apiRequest<GalleryItem>(`/admin/gallery/${id}`, {
    method: 'PATCH',
    body: input,
  });
}

export async function deleteAdminGalleryItem(id: string): Promise<void> {
  await apiRequest<Record<string, never>>(`/admin/gallery/${id}`, {
    method: 'DELETE',
  });
}
