-- name: ListCMSPages :many
SELECT
    id,
    slug,
    title,
    status,
    seo,
    published_version_id,
    created_at,
    updated_at,
    deleted_at
FROM cms_pages
WHERE deleted_at IS NULL
ORDER BY slug;

-- name: GetCMSPageBySlug :one
SELECT
    id,
    slug,
    title,
    status,
    seo,
    published_version_id,
    created_at,
    updated_at,
    deleted_at
FROM cms_pages
WHERE slug = $1
  AND deleted_at IS NULL;

-- name: GetCMSPageByID :one
SELECT
    id,
    slug,
    title,
    status,
    seo,
    published_version_id,
    created_at,
    updated_at,
    deleted_at
FROM cms_pages
WHERE id = $1
  AND deleted_at IS NULL;

-- name: UpdateCMSPageSEO :one
UPDATE cms_pages
SET seo = $2,
    updated_at = NOW()
WHERE id = $1
  AND deleted_at IS NULL
RETURNING
    id,
    slug,
    title,
    status,
    seo,
    published_version_id,
    created_at,
    updated_at,
    deleted_at;

-- name: MarkCMSPagePublished :one
UPDATE cms_pages
SET status = 'published',
    published_version_id = $2,
    updated_at = NOW()
WHERE id = $1
  AND deleted_at IS NULL
RETURNING
    id,
    slug,
    title,
    status,
    seo,
    published_version_id,
    created_at,
    updated_at,
    deleted_at;

-- name: ListCMSSectionsByPageID :many
SELECT
    id,
    page_id,
    code,
    label,
    is_enabled,
    sort_order,
    created_at,
    updated_at,
    deleted_at
FROM cms_sections
WHERE page_id = $1
  AND deleted_at IS NULL
ORDER BY sort_order, code;

-- name: GetCMSSectionByID :one
SELECT
    id,
    page_id,
    code,
    label,
    is_enabled,
    sort_order,
    created_at,
    updated_at,
    deleted_at
FROM cms_sections
WHERE id = $1
  AND deleted_at IS NULL;

-- name: UpdateCMSSectionEnabled :one
UPDATE cms_sections
SET is_enabled = $2,
    updated_at = NOW()
WHERE id = $1
  AND deleted_at IS NULL
RETURNING
    id,
    page_id,
    code,
    label,
    is_enabled,
    sort_order,
    created_at,
    updated_at,
    deleted_at;

-- name: GetCMSContentBySectionID :one
SELECT
    id,
    section_id,
    data,
    updated_by,
    created_at,
    updated_at
FROM cms_contents
WHERE section_id = $1;

-- name: UpdateCMSContentData :one
UPDATE cms_contents
SET data = $2,
    updated_by = $3,
    updated_at = NOW()
WHERE section_id = $1
RETURNING
    id,
    section_id,
    data,
    updated_by,
    created_at,
    updated_at;

-- name: ListCMSContentsByPageID :many
SELECT
    c.id,
    c.section_id,
    c.data,
    c.updated_by,
    c.created_at,
    c.updated_at
FROM cms_contents c
INNER JOIN cms_sections s ON s.id = c.section_id
WHERE s.page_id = $1
  AND s.deleted_at IS NULL
ORDER BY s.sort_order, s.code;

-- name: GetLatestCMSVersionNumber :one
SELECT COALESCE(MAX(version_number), 0)::int AS version_number
FROM cms_versions
WHERE page_id = $1;

-- name: CreateCMSVersion :one
INSERT INTO cms_versions (
    id,
    page_id,
    version_number,
    summary,
    snapshot,
    published_by,
    published_at,
    created_at
) VALUES (
    $1, $2, $3, $4, $5, $6, NOW(), NOW()
) RETURNING
    id,
    page_id,
    version_number,
    summary,
    snapshot,
    published_by,
    published_at,
    created_at;

-- name: GetCMSVersionByID :one
SELECT
    id,
    page_id,
    version_number,
    summary,
    snapshot,
    published_by,
    published_at,
    created_at
FROM cms_versions
WHERE id = $1;

-- name: GetCMSVersionByPageAndNumber :one
SELECT
    id,
    page_id,
    version_number,
    summary,
    snapshot,
    published_by,
    published_at,
    created_at
FROM cms_versions
WHERE page_id = $1
  AND version_number = $2;

-- name: ListCMSVersionsByPageID :many
SELECT
    id,
    page_id,
    version_number,
    summary,
    snapshot,
    published_by,
    published_at,
    created_at
FROM cms_versions
WHERE page_id = $1
ORDER BY version_number DESC;
