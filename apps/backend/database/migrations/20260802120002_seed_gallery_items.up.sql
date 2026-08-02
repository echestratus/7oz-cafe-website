-- Seed City Park gallery from existing static assets (MVP filesystem paths).
INSERT INTO gallery_items (
    id, image_url, media_id, location_slug, category, alt_text, caption, sort_order, is_visible
) VALUES
    ('a1000000-0000-4000-8000-000000000001', '/assets/gallery/7oz-1.webp', NULL, 'city-park', 'atmosphere', '7Oz City Park atmosphere 1', 'Gallery 1', 10, TRUE),
    ('a1000000-0000-4000-8000-000000000002', '/assets/gallery/7oz-2.webp', NULL, 'city-park', 'atmosphere', '7Oz City Park atmosphere 2', 'Gallery 2', 20, TRUE),
    ('a1000000-0000-4000-8000-000000000003', '/assets/gallery/7oz-3.webp', NULL, 'city-park', 'atmosphere', '7Oz City Park atmosphere 3', 'Gallery 3', 30, TRUE),
    ('a1000000-0000-4000-8000-000000000004', '/assets/gallery/7oz-4.webp', NULL, 'city-park', 'atmosphere', '7Oz City Park atmosphere 4', 'Gallery 4', 40, TRUE),
    ('a1000000-0000-4000-8000-000000000005', '/assets/gallery/7oz-5.webp', NULL, 'city-park', 'atmosphere', '7Oz City Park atmosphere 5', 'Gallery 5', 50, TRUE),
    ('a1000000-0000-4000-8000-000000000006', '/assets/gallery/7oz-6.webp', NULL, 'city-park', 'atmosphere', '7Oz City Park atmosphere 6', 'Gallery 6', 60, TRUE),
    ('a1000000-0000-4000-8000-000000000007', '/assets/gallery/7oz-7.webp', NULL, 'city-park', 'atmosphere', '7Oz City Park atmosphere 7', 'Gallery 7', 70, TRUE),
    ('a1000000-0000-4000-8000-000000000008', '/assets/gallery/7oz-8.webp', NULL, 'city-park', 'atmosphere', '7Oz City Park atmosphere 8', 'Gallery 8', 80, TRUE),
    ('a1000000-0000-4000-8000-000000000009', '/assets/gallery/7oz-9.webp', NULL, 'city-park', 'atmosphere', '7Oz City Park atmosphere 9', 'Gallery 9', 90, TRUE),
    ('a1000000-0000-4000-8000-000000000010', '/assets/gallery/7oz-10.webp', NULL, 'city-park', 'atmosphere', '7Oz City Park atmosphere 10', 'Gallery 10', 100, TRUE),
    ('a1000000-0000-4000-8000-000000000011', '/assets/gallery/7oz-11.webp', NULL, 'city-park', 'atmosphere', '7Oz City Park atmosphere 11', 'Gallery 11', 110, TRUE),
    ('a1000000-0000-4000-8000-000000000012', '/assets/gallery/7oz-13.webp', NULL, 'city-park', 'atmosphere', '7Oz City Park atmosphere 12', 'Gallery 12', 120, TRUE),
    ('a1000000-0000-4000-8000-000000000013', '/assets/gallery/7oz-14.webp', NULL, 'city-park', 'atmosphere', '7Oz City Park atmosphere 13', 'Gallery 13', 130, TRUE)
ON CONFLICT (id) DO NOTHING;
