-- name: ListPublicGalleryItems :many
SELECT
    id,
    image_url,
    media_id,
    location_slug,
    category,
    alt_text,
    caption,
    sort_order,
    is_visible,
    created_at,
    updated_at,
    deleted_at
FROM gallery_items
WHERE deleted_at IS NULL
  AND is_visible = TRUE
  AND location_slug = $1
ORDER BY sort_order ASC, created_at ASC;

-- name: ListAdminGalleryItems :many
SELECT
    id,
    image_url,
    media_id,
    location_slug,
    category,
    alt_text,
    caption,
    sort_order,
    is_visible,
    created_at,
    updated_at,
    deleted_at
FROM gallery_items
WHERE deleted_at IS NULL
  AND (
    sqlc.narg('location_slug')::text IS NULL
    OR location_slug = sqlc.narg('location_slug')
  )
ORDER BY location_slug ASC, sort_order ASC, created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountAdminGalleryItems :one
SELECT COUNT(*)::bigint AS total
FROM gallery_items
WHERE deleted_at IS NULL
  AND (
    sqlc.narg('location_slug')::text IS NULL
    OR location_slug = sqlc.narg('location_slug')
  );

-- name: GetGalleryItemByID :one
SELECT
    id,
    image_url,
    media_id,
    location_slug,
    category,
    alt_text,
    caption,
    sort_order,
    is_visible,
    created_at,
    updated_at,
    deleted_at
FROM gallery_items
WHERE id = $1
  AND deleted_at IS NULL;

-- name: CreateGalleryItem :one
INSERT INTO gallery_items (
    id,
    image_url,
    media_id,
    location_slug,
    category,
    alt_text,
    caption,
    sort_order,
    is_visible,
    created_at,
    updated_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()
) RETURNING
    id,
    image_url,
    media_id,
    location_slug,
    category,
    alt_text,
    caption,
    sort_order,
    is_visible,
    created_at,
    updated_at,
    deleted_at;

-- name: UpdateGalleryItem :one
UPDATE gallery_items
SET image_url = $2,
    media_id = $3,
    location_slug = $4,
    category = $5,
    alt_text = $6,
    caption = $7,
    sort_order = $8,
    is_visible = $9,
    updated_at = NOW()
WHERE id = $1
  AND deleted_at IS NULL
RETURNING
    id,
    image_url,
    media_id,
    location_slug,
    category,
    alt_text,
    caption,
    sort_order,
    is_visible,
    created_at,
    updated_at,
    deleted_at;

-- name: SoftDeleteGalleryItem :exec
UPDATE gallery_items
SET deleted_at = NOW(),
    updated_at = NOW()
WHERE id = $1
  AND deleted_at IS NULL;
