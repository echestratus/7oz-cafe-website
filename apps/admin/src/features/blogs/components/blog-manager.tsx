'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { ApiClientError } from '@/lib/api-client';
import {
  createAdminBlog,
  deleteAdminBlog,
  listAdminBlogs,
  updateAdminBlog,
  type BlogPost,
} from '@/services/blog';

const emptyForm = {
  title: '',
  slug: '',
  excerpt: '',
  body: '',
  kind: 'news',
  status: 'draft',
  coverUrl: '',
};

export function BlogManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const blogsQuery = useQuery({
    queryKey: ['admin-blogs', search, statusFilter],
    queryFn: () =>
      listAdminBlogs({
        page: 1,
        limit: 50,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
      }),
  });

  const items = useMemo(() => blogsQuery.data?.items ?? [], [blogsQuery.data?.items]);

  function startCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setMessage(null);
  }

  function startEdit(post: BlogPost) {
    setEditing(post);
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      body: post.body,
      kind: post.kind,
      status: post.status,
      coverUrl: post.coverUrl ?? '',
    });
    setError(null);
    setMessage(null);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim() || undefined,
        excerpt: form.excerpt.trim(),
        body: form.body.trim(),
        kind: form.kind,
        status: form.status,
        coverUrl: form.coverUrl.trim() || null,
      };
      if (editing) {
        return updateAdminBlog(editing.id, payload);
      }
      return createAdminBlog(payload);
    },
    onSuccess: async (post) => {
      setMessage(editing ? 'Post updated.' : 'Post created.');
      setError(null);
      setEditing(post);
      setForm({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        body: post.body,
        kind: post.kind,
        status: post.status,
        coverUrl: post.coverUrl ?? '',
      });
      await queryClient.invalidateQueries({ queryKey: ['admin-blogs'] });
    },
    onError: (err) => {
      setMessage(null);
      setError(err instanceof ApiClientError ? err.message : 'Unable to save blog post.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deleteAdminBlog(id),
    onSuccess: async () => {
      setMessage('Post deleted.');
      setError(null);
      startCreate();
      await queryClient.invalidateQueries({ queryKey: ['admin-blogs'] });
    },
    onError: (err) => {
      setMessage(null);
      setError(err instanceof ApiClientError ? err.message : 'Unable to delete blog post.');
    },
  });

  return (
    <div>
      <PageHeader
        title="Blogs"
        description="Publish news and events for the public website."
      />

      {message ? (
        <p className="mb-4 rounded-[12px] border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mb-4 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title or slug"
              className="min-w-[12rem] flex-1 rounded-[12px] border border-border bg-surface px-3 py-2 text-sm"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-[12px] border border-border bg-surface px-3 py-2 text-sm"
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
            <button
              type="button"
              onClick={startCreate}
              className="rounded-[12px] bg-primary px-4 py-2 text-sm text-white hover:bg-primary-hover"
            >
              New post
            </button>
          </div>

          {blogsQuery.isLoading ? <p className="text-sm text-text-secondary">Loading…</p> : null}
          {blogsQuery.isError ? (
            <p className="text-sm text-red-700" role="alert">
              Unable to load blog posts.
            </p>
          ) : null}

          <ul className="divide-y divide-border rounded-[12px] border border-border bg-surface">
            {items.map((post) => (
              <li key={post.id}>
                <button
                  type="button"
                  onClick={() => startEdit(post)}
                  className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors hover:bg-surface-secondary ${
                    editing?.id === post.id ? 'bg-surface-secondary' : ''
                  }`}
                >
                  <span className="text-sm font-medium text-text">{post.title}</span>
                  <span className="text-xs text-text-muted">
                    {post.kind} · {post.status}
                    {post.publishedAt ? ` · ${new Date(post.publishedAt).toLocaleDateString()}` : ''}
                  </span>
                </button>
              </li>
            ))}
            {items.length === 0 && !blogsQuery.isLoading ? (
              <li className="px-4 py-6 text-sm text-text-secondary">No blog posts yet.</li>
            ) : null}
          </ul>
        </section>

        <section className="rounded-[12px] border border-border bg-surface p-6">
          <h2 className="mb-4 text-lg font-medium text-text">
            {editing ? 'Edit post' : 'Create post'}
          </h2>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              saveMutation.mutate();
            }}
          >
            <label className="block space-y-1 text-sm">
              <span className="text-text">Title</span>
              <input
                required
                value={form.title}
                onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-text">Slug</span>
              <input
                value={form.slug}
                onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
                placeholder="auto-generated from title if empty"
                className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1 text-sm">
                <span className="text-text">Kind</span>
                <select
                  value={form.kind}
                  onChange={(event) => setForm((prev) => ({ ...prev, kind: event.target.value }))}
                  className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
                >
                  <option value="news">News</option>
                  <option value="event">Event</option>
                </select>
              </label>
              <label className="block space-y-1 text-sm">
                <span className="text-text">Status</span>
                <select
                  value={form.status}
                  onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
                  className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
            </div>
            <label className="block space-y-1 text-sm">
              <span className="text-text">Excerpt</span>
              <textarea
                rows={2}
                value={form.excerpt}
                onChange={(event) => setForm((prev) => ({ ...prev, excerpt: event.target.value }))}
                className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-text">Body</span>
              <textarea
                rows={10}
                value={form.body}
                onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))}
                className="w-full rounded-[12px] border border-border bg-background px-3 py-2 font-mono text-sm"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-text">Cover URL (optional)</span>
              <input
                value={form.coverUrl}
                onChange={(event) => setForm((prev) => ({ ...prev, coverUrl: event.target.value }))}
                className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
              />
            </label>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="rounded-[12px] bg-primary px-4 py-2 text-sm text-white hover:bg-primary-hover disabled:opacity-60"
              >
                {saveMutation.isPending ? 'Saving…' : editing ? 'Update post' : 'Create post'}
              </button>
              {editing ? (
                <button
                  type="button"
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    if (window.confirm('Delete this blog post?')) {
                      deleteMutation.mutate(editing.id);
                    }
                  }}
                  className="rounded-[12px] border border-red-200 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                >
                  Delete
                </button>
              ) : null}
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
