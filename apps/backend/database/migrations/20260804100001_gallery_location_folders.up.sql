-- Re-home City Park gallery asset paths under assets/gallery/city-park/
-- and seed Kampoeng Indonesia gallery items.

UPDATE gallery_items
SET image_url = '/assets/gallery/city-park/' || regexp_replace(image_url, '^/assets/gallery/', '')
WHERE location_slug = 'city-park'
  AND image_url LIKE '/assets/gallery/%'
  AND image_url NOT LIKE '/assets/gallery/city-park/%';

INSERT INTO gallery_items (
    id, image_url, media_id, location_slug, category, alt_text, caption, sort_order, is_visible
) VALUES
    ('a2000000-0000-4000-8000-000000000001', '/assets/gallery/kampoeng-indonesia/7oz-1.webp', NULL, 'kampoeng-indonesia', 'atmosphere', '7Oz Kampoeng Indonesia atmosphere 1', 'Gallery 1', 10, TRUE),
    ('a2000000-0000-4000-8000-000000000002', '/assets/gallery/kampoeng-indonesia/7oz-2.webp', NULL, 'kampoeng-indonesia', 'atmosphere', '7Oz Kampoeng Indonesia atmosphere 2', 'Gallery 2', 20, TRUE),
    ('a2000000-0000-4000-8000-000000000003', '/assets/gallery/kampoeng-indonesia/7oz-3.webp', NULL, 'kampoeng-indonesia', 'atmosphere', '7Oz Kampoeng Indonesia atmosphere 3', 'Gallery 3', 30, TRUE),
    ('a2000000-0000-4000-8000-000000000004', '/assets/gallery/kampoeng-indonesia/7oz-4.webp', NULL, 'kampoeng-indonesia', 'atmosphere', '7Oz Kampoeng Indonesia atmosphere 4', 'Gallery 4', 40, TRUE),
    ('a2000000-0000-4000-8000-000000000005', '/assets/gallery/kampoeng-indonesia/7oz-5.webp', NULL, 'kampoeng-indonesia', 'atmosphere', '7Oz Kampoeng Indonesia atmosphere 5', 'Gallery 5', 50, TRUE),
    ('a2000000-0000-4000-8000-000000000006', '/assets/gallery/kampoeng-indonesia/7oz-6.webp', NULL, 'kampoeng-indonesia', 'atmosphere', '7Oz Kampoeng Indonesia atmosphere 6', 'Gallery 6', 60, TRUE)
ON CONFLICT (id) DO NOTHING;
