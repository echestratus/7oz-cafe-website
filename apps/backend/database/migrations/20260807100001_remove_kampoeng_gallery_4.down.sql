UPDATE gallery_items
SET
    deleted_at = NULL,
    updated_at = NOW()
WHERE id = 'a2000000-0000-4000-8000-000000000004';
