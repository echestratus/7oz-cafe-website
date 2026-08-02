import { apiRequest } from '@/lib/api-client';

export type MediaAsset = {
  id: string;
  fileName: string;
  storageKey: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  altText: string;
  createdAt: string;
};

export async function listMedia(page = 1, limit = 20): Promise<MediaAsset[]> {
  return apiRequest<MediaAsset[]>(`/admin/media?page=${page}&limit=${limit}`);
}

export async function uploadMedia(file: File, altText = ''): Promise<MediaAsset> {
  const formData = new FormData();
  formData.append('file', file);
  if (altText) {
    formData.append('altText', altText);
  }

  return apiRequest<MediaAsset>('/admin/media', {
    method: 'POST',
    formData,
  });
}

export async function deleteMedia(id: string): Promise<void> {
  await apiRequest<Record<string, never>>(`/admin/media/${id}`, {
    method: 'DELETE',
  });
}
