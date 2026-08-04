DELETE FROM gallery_items
WHERE id IN (
    'a2000000-0000-4000-8000-000000000001',
    'a2000000-0000-4000-8000-000000000002',
    'a2000000-0000-4000-8000-000000000003',
    'a2000000-0000-4000-8000-000000000004',
    'a2000000-0000-4000-8000-000000000005',
    'a2000000-0000-4000-8000-000000000006'
);

UPDATE gallery_items
SET image_url = '/assets/gallery/' || regexp_replace(image_url, '^/assets/gallery/city-park/', '')
WHERE location_slug = 'city-park'
  AND image_url LIKE '/assets/gallery/city-park/%';
