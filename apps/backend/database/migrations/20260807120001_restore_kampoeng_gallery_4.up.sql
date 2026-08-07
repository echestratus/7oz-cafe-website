-- Restore Kampoeng Indonesia gallery photo 4 with the replacement asset.
UPDATE gallery_items
SET
    deleted_at = NULL,
    image_url = '/assets/gallery/kampoeng-indonesia/7oz-4.webp',
    alt_text = '7Oz Kampoeng Indonesia atmosphere 4',
    caption = 'Gallery 4',
    sort_order = 40,
    is_visible = TRUE,
    updated_at = NOW()
WHERE id = 'a2000000-0000-4000-8000-000000000004';
