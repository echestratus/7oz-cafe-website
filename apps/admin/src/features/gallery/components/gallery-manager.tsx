'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { PageHeader } from '@/components/layout/page-header';
import { ApiClientError } from '@/lib/api-client';
import {
  createAdminGalleryItem,
  deleteAdminGalleryItem,
  listAdminGallery,
  updateAdminGalleryItem,
  type GalleryItem,
} from '@/services/gallery';

const locations = [
  { value: '', label: 'All locations' },
  { value: 'city-park', label: 'City Park' },
  { value: 'kampoeng-indonesia', label: 'Kampoeng Indonesia' },
  { value: 'dharmawangsa', label: 'Dharmawangsa' },
] as const;

const categories = ['atmosphere', 'interior', 'exterior', 'coffee', 'food', 'events'] as const;

const emptyForm = {
  imageUrl: '',
  locationSlug: 'city-park',
  category: 'atmosphere',
  altText: '',
  caption: '',
  sortOrder: 0,
  isVisible: true,
};

export function GalleryManager() {
  const queryClient = useQueryClient();
  const [locationFilter, setLocationFilter] = useState('city-park');
  const [editing, setEditing] = useState<GalleryItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const galleryQuery = useQuery({
    queryKey: ['admin-gallery', locationFilter],
    queryFn: () =>
      listAdminGallery({
        page: 1,
        limit: 100,
        locationSlug: locationFilter || undefined,
      }),
  });

  const items = useMemo(() => galleryQuery.data?.items ?? [], [galleryQuery.data?.items]);

  function startCreate() {
    setEditing(null);
    setForm({
      ...emptyForm,
      locationSlug: locationFilter || 'city-park',
    });
    setError(null);
    setMessage(null);
  }

  function startEdit(item: GalleryItem) {
    setEditing(item);
    setForm({
      imageUrl: item.imageUrl,
      locationSlug: item.locationSlug,
      category: item.category,
      altText: item.altText,
      caption: item.caption,
      sortOrder: item.sortOrder,
      isVisible: item.isVisible,
    });
    setError(null);
    setMessage(null);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        imageUrl: form.imageUrl.trim(),
        locationSlug: form.locationSlug.trim(),
        category: form.category,
        altText: form.altText.trim(),
        caption: form.caption.trim(),
        sortOrder: Number(form.sortOrder) || 0,
        isVisible: form.isVisible,
      };
      if (editing) {
        return updateAdminGalleryItem(editing.id, payload);
      }
      return createAdminGalleryItem(payload);
    },
    onSuccess: async (item) => {
      setMessage(editing ? 'Gallery item updated.' : 'Gallery item created.');
      setError(null);
      setEditing(item);
      setForm({
        imageUrl: item.imageUrl,
        locationSlug: item.locationSlug,
        category: item.category,
        altText: item.altText,
        caption: item.caption,
        sortOrder: item.sortOrder,
        isVisible: item.isVisible,
      });
      await queryClient.invalidateQueries({ queryKey: ['admin-gallery'] });
    },
    onError: (err) => {
      setMessage(null);
      setError(err instanceof ApiClientError ? err.message : 'Unable to save gallery item.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deleteAdminGalleryItem(id),
    onSuccess: async () => {
      setMessage('Gallery item deleted.');
      setError(null);
      startCreate();
      await queryClient.invalidateQueries({ queryKey: ['admin-gallery'] });
    },
    onError: (err) => {
      setMessage(null);
      setError(err instanceof ApiClientError ? err.message : 'Unable to delete gallery item.');
    },
  });

  return (
    <div>
      <PageHeader
        title="Gallery"
        description="Curate location gallery images shown on the public website. Upload files in Media, then paste the public URL here."
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
            <select
              value={locationFilter}
              onChange={(event) => setLocationFilter(event.target.value)}
              className="rounded-[12px] border border-border bg-surface px-3 py-2 text-sm"
            >
              {locations.map((location) => (
                <option key={location.value || 'all'} value={location.value}>
                  {location.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={startCreate}
              className="rounded-[12px] bg-primary px-4 py-2 text-sm text-white hover:bg-primary-hover"
            >
              New item
            </button>
          </div>

          {galleryQuery.isLoading ? (
            <p className="text-sm text-text-secondary">Loading gallery…</p>
          ) : null}
          {galleryQuery.isError ? (
            <p className="text-sm text-red-700" role="alert">
              {galleryQuery.error instanceof ApiClientError
                ? galleryQuery.error.message
                : 'Unable to load gallery.'}
            </p>
          ) : null}

          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => startEdit(item)}
                  className={`w-full rounded-[12px] border px-3 py-3 text-left text-sm transition-colors ${
                    editing?.id === item.id
                      ? 'border-primary bg-surface-secondary'
                      : 'border-border bg-surface hover:bg-surface-secondary'
                  }`}
                >
                  <p className="font-medium text-text">{item.caption || item.altText || item.imageUrl}</p>
                  <p className="text-text-secondary">
                    {item.locationSlug} · {item.category} · sort {item.sortOrder}
                    {item.isVisible ? '' : ' · hidden'}
                  </p>
                </button>
              </li>
            ))}
          </ul>
          {!galleryQuery.isLoading && items.length === 0 ? (
            <p className="text-sm text-text-secondary">No gallery items for this filter.</p>
          ) : null}
        </section>

        <form
          className="space-y-4 rounded-[16px] border border-border bg-surface p-4"
          onSubmit={(event) => {
            event.preventDefault();
            saveMutation.mutate();
          }}
        >
          <p className="text-sm font-medium text-text">{editing ? 'Edit item' : 'Create item'}</p>

          <label className="block space-y-1 text-sm">
            <span className="text-text-secondary">Image URL</span>
            <input
              required
              value={form.imageUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
              placeholder="/assets/gallery/city-park/7oz-1.webp or /media/…"
              className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span className="text-text-secondary">Location</span>
              <select
                required
                value={form.locationSlug}
                onChange={(event) => setForm((prev) => ({ ...prev, locationSlug: event.target.value }))}
                className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
              >
                <option value="city-park">City Park</option>
                <option value="kampoeng-indonesia">Kampoeng Indonesia</option>
                <option value="dharmawangsa">Dharmawangsa</option>
              </select>
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-text-secondary">Category</span>
              <select
                value={form.category}
                onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block space-y-1 text-sm">
            <span className="text-text-secondary">Alt text</span>
            <input
              value={form.altText}
              onChange={(event) => setForm((prev) => ({ ...prev, altText: event.target.value }))}
              className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span className="text-text-secondary">Caption</span>
            <input
              value={form.caption}
              onChange={(event) => setForm((prev) => ({ ...prev, caption: event.target.value }))}
              className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span className="text-text-secondary">Sort order</span>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, sortOrder: Number(event.target.value) || 0 }))
                }
                className="w-full rounded-[12px] border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="flex items-center gap-2 pt-7 text-sm text-text">
              <input
                type="checkbox"
                checked={form.isVisible}
                onChange={(event) => setForm((prev) => ({ ...prev, isVisible: event.target.checked }))}
              />
              Visible on website
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="rounded-[12px] bg-primary px-4 py-2 text-sm text-white hover:bg-primary-hover disabled:opacity-60"
            >
              {editing ? 'Save changes' : 'Create item'}
            </button>
            {editing ? (
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  if (window.confirm('Delete this gallery item?')) {
                    deleteMutation.mutate(editing.id);
                  }
                }}
                className="rounded-[12px] border border-red-200 px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
              >
                Delete
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}
