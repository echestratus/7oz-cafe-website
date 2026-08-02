-- name: ListMediaAssets :many
SELECT
    id,
    folder_id,
    file_name,
    storage_key,
    mime_type,
    size_bytes,
    alt_text,
    uploaded_by,
    created_at,
    updated_at,
    deleted_at
FROM media_assets
WHERE deleted_at IS NULL
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountMediaAssets :one
SELECT COUNT(*)::bigint AS count
FROM media_assets
WHERE deleted_at IS NULL;

-- name: GetMediaAssetByID :one
SELECT
    id,
    folder_id,
    file_name,
    storage_key,
    mime_type,
    size_bytes,
    alt_text,
    uploaded_by,
    created_at,
    updated_at,
    deleted_at
FROM media_assets
WHERE id = $1
  AND deleted_at IS NULL;

-- name: CreateMediaAsset :one
INSERT INTO media_assets (
    id,
    folder_id,
    file_name,
    storage_key,
    mime_type,
    size_bytes,
    alt_text,
    uploaded_by,
    created_at,
    updated_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
) RETURNING
    id,
    folder_id,
    file_name,
    storage_key,
    mime_type,
    size_bytes,
    alt_text,
    uploaded_by,
    created_at,
    updated_at,
    deleted_at;

-- name: SoftDeleteMediaAsset :exec
UPDATE media_assets
SET deleted_at = NOW(),
    updated_at = NOW()
WHERE id = $1
  AND deleted_at IS NULL;
