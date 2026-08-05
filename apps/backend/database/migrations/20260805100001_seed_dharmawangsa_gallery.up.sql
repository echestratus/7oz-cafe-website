-- Seed Dharmawangsa gallery items from assets/gallery/dharmawangsa/.

INSERT INTO gallery_items (
    id, image_url, media_id, location_slug, category, alt_text, caption, sort_order, is_visible
) VALUES
    ('a3000000-0000-4000-8000-000000000001', '/assets/gallery/dharmawangsa/1.webp', NULL, 'dharmawangsa', 'atmosphere', '7Oz Dharmawangsa atmosphere 1', 'Gallery 1', 10, TRUE),
    ('a3000000-0000-4000-8000-000000000002', '/assets/gallery/dharmawangsa/2.webp', NULL, 'dharmawangsa', 'atmosphere', '7Oz Dharmawangsa atmosphere 2', 'Gallery 2', 20, TRUE),
    ('a3000000-0000-4000-8000-000000000003', '/assets/gallery/dharmawangsa/3.webp', NULL, 'dharmawangsa', 'atmosphere', '7Oz Dharmawangsa atmosphere 3', 'Gallery 3', 30, TRUE),
    ('a3000000-0000-4000-8000-000000000004', '/assets/gallery/dharmawangsa/4.webp', NULL, 'dharmawangsa', 'atmosphere', '7Oz Dharmawangsa atmosphere 4', 'Gallery 4', 40, TRUE),
    ('a3000000-0000-4000-8000-000000000005', '/assets/gallery/dharmawangsa/5.webp', NULL, 'dharmawangsa', 'atmosphere', '7Oz Dharmawangsa atmosphere 5', 'Gallery 5', 50, TRUE)
ON CONFLICT (id) DO NOTHING;
