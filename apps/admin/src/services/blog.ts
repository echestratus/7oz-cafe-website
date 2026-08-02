import { apiRequest } from '@/lib/api-client';

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  kind: string;
  coverUrl?: string | null;
  coverMediaId?: string | null;
  status: string;
  publishedAt?: string | null;
  seo?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedBlogs = {
  items: BlogPost[];
  page: number;
  limit: number;
  total: number;
};

export type BlogWriteInput = {
  slug?: string;
  title: string;
  excerpt?: string;
  body?: string;
  kind?: string;
  coverUrl?: string | null;
  coverMediaId?: string | null;
  status?: string;
  publishedAt?: string | null;
  seo?: Record<string, unknown>;
};

export async function listAdminBlogs(params?: {
  page?: number;
  limit?: number;
  status?: string;
  kind?: string;
  search?: string;
}): Promise<PaginatedBlogs> {
  const query = new URLSearchParams();
  query.set('page', String(params?.page ?? 1));
  query.set('limit', String(params?.limit ?? 50));
  if (params?.status) {
    query.set('status', params.status);
  }
  if (params?.kind) {
    query.set('kind', params.kind);
  }
  if (params?.search) {
    query.set('search', params.search);
  }
  return apiRequest<PaginatedBlogs>(`/admin/blogs?${query.toString()}`);
}

export async function getAdminBlog(id: string): Promise<BlogPost> {
  return apiRequest<BlogPost>(`/admin/blogs/${id}`);
}

export async function createAdminBlog(input: BlogWriteInput): Promise<BlogPost> {
  return apiRequest<BlogPost>('/admin/blogs', {
    method: 'POST',
    body: input,
  });
}

export async function updateAdminBlog(id: string, input: Partial<BlogWriteInput>): Promise<BlogPost> {
  return apiRequest<BlogPost>(`/admin/blogs/${id}`, {
    method: 'PATCH',
    body: input,
  });
}

export async function deleteAdminBlog(id: string): Promise<void> {
  await apiRequest<Record<string, never>>(`/admin/blogs/${id}`, {
    method: 'DELETE',
  });
}
