-- name: ListPublishedBlogPosts :many
SELECT
    id,
    slug,
    title,
    excerpt,
    body,
    kind,
    cover_url,
    cover_media_id,
    status,
    published_at,
    seo,
    created_at,
    updated_at,
    deleted_at
FROM blog_posts
WHERE deleted_at IS NULL
  AND status = 'published'
  AND published_at IS NOT NULL
  AND published_at <= NOW()
ORDER BY published_at DESC
LIMIT $1 OFFSET $2;

-- name: CountPublishedBlogPosts :one
SELECT COUNT(*)::bigint AS total
FROM blog_posts
WHERE deleted_at IS NULL
  AND status = 'published'
  AND published_at IS NOT NULL
  AND published_at <= NOW();

-- name: GetPublishedBlogPostBySlug :one
SELECT
    id,
    slug,
    title,
    excerpt,
    body,
    kind,
    cover_url,
    cover_media_id,
    status,
    published_at,
    seo,
    created_at,
    updated_at,
    deleted_at
FROM blog_posts
WHERE slug = $1
  AND deleted_at IS NULL
  AND status = 'published'
  AND published_at IS NOT NULL
  AND published_at <= NOW();

-- name: ListAdminBlogPosts :many
SELECT
    id,
    slug,
    title,
    excerpt,
    body,
    kind,
    cover_url,
    cover_media_id,
    status,
    published_at,
    seo,
    created_at,
    updated_at,
    deleted_at
FROM blog_posts
WHERE deleted_at IS NULL
  AND (
    sqlc.narg('status')::text IS NULL
    OR status = sqlc.narg('status')
  )
  AND (
    sqlc.narg('kind')::text IS NULL
    OR kind = sqlc.narg('kind')
  )
  AND (
    sqlc.narg('search')::text IS NULL
    OR title ILIKE '%' || sqlc.narg('search') || '%'
    OR slug ILIKE '%' || sqlc.narg('search') || '%'
  )
ORDER BY COALESCE(published_at, created_at) DESC
LIMIT $1 OFFSET $2;

-- name: CountAdminBlogPosts :one
SELECT COUNT(*)::bigint AS total
FROM blog_posts
WHERE deleted_at IS NULL
  AND (
    sqlc.narg('status')::text IS NULL
    OR status = sqlc.narg('status')
  )
  AND (
    sqlc.narg('kind')::text IS NULL
    OR kind = sqlc.narg('kind')
  )
  AND (
    sqlc.narg('search')::text IS NULL
    OR title ILIKE '%' || sqlc.narg('search') || '%'
    OR slug ILIKE '%' || sqlc.narg('search') || '%'
  );

-- name: GetBlogPostByID :one
SELECT
    id,
    slug,
    title,
    excerpt,
    body,
    kind,
    cover_url,
    cover_media_id,
    status,
    published_at,
    seo,
    created_at,
    updated_at,
    deleted_at
FROM blog_posts
WHERE id = $1
  AND deleted_at IS NULL;

-- name: GetBlogPostBySlug :one
SELECT
    id,
    slug,
    title,
    excerpt,
    body,
    kind,
    cover_url,
    cover_media_id,
    status,
    published_at,
    seo,
    created_at,
    updated_at,
    deleted_at
FROM blog_posts
WHERE slug = $1
  AND deleted_at IS NULL;

-- name: CreateBlogPost :one
INSERT INTO blog_posts (
    id,
    slug,
    title,
    excerpt,
    body,
    kind,
    cover_url,
    cover_media_id,
    status,
    published_at,
    seo,
    created_at,
    updated_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()
) RETURNING
    id,
    slug,
    title,
    excerpt,
    body,
    kind,
    cover_url,
    cover_media_id,
    status,
    published_at,
    seo,
    created_at,
    updated_at,
    deleted_at;

-- name: UpdateBlogPost :one
UPDATE blog_posts
SET slug = $2,
    title = $3,
    excerpt = $4,
    body = $5,
    kind = $6,
    cover_url = $7,
    cover_media_id = $8,
    status = $9,
    published_at = $10,
    seo = $11,
    updated_at = NOW()
WHERE id = $1
  AND deleted_at IS NULL
RETURNING
    id,
    slug,
    title,
    excerpt,
    body,
    kind,
    cover_url,
    cover_media_id,
    status,
    published_at,
    seo,
    created_at,
    updated_at,
    deleted_at;

-- name: SoftDeleteBlogPost :exec
UPDATE blog_posts
SET deleted_at = NOW(),
    updated_at = NOW()
WHERE id = $1
  AND deleted_at IS NULL;
