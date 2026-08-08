-- Seed Kampoeng Indonesia gallery photos 7 and 8.

INSERT INTO gallery_items (
    id, image_url, media_id, location_slug, category, alt_text, caption, sort_order, is_visible
) VALUES
    ('a2000000-0000-4000-8000-000000000007', '/assets/gallery/kampoeng-indonesia/7oz-7.webp', NULL, 'kampoeng-indonesia', 'atmosphere', '7Oz Kampoeng Indonesia atmosphere 7', 'Gallery 7', 70, TRUE),
    ('a2000000-0000-4000-8000-000000000008', '/assets/gallery/kampoeng-indonesia/7oz-8.webp', NULL, 'kampoeng-indonesia', 'atmosphere', '7Oz Kampoeng Indonesia atmosphere 8', 'Gallery 8', 80, TRUE)
ON CONFLICT (id) DO NOTHING;
