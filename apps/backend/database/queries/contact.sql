-- name: CreateContactMessage :one
INSERT INTO contact_messages (
    id,
    full_name,
    email,
    phone,
    message,
    status,
    ip_address,
    user_agent,
    created_at,
    updated_at
) VALUES (
    $1, $2, $3, $4, $5, 'new', $6, $7, NOW(), NOW()
) RETURNING
    id,
    full_name,
    email,
    phone,
    message,
    status,
    ip_address,
    user_agent,
    created_at,
    updated_at;

-- name: ListContactMessagesAdmin :many
SELECT
    id,
    full_name,
    email,
    phone,
    message,
    status,
    ip_address,
    user_agent,
    created_at,
    updated_at
FROM contact_messages
WHERE (
    sqlc.narg('status')::text IS NULL
    OR status = sqlc.narg('status')
)
AND (
    sqlc.narg('search')::text IS NULL
    OR email::text ILIKE '%' || sqlc.narg('search') || '%'
    OR full_name ILIKE '%' || sqlc.narg('search') || '%'
)
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountContactMessagesAdmin :one
SELECT COUNT(*)::bigint AS total
FROM contact_messages
WHERE (
    sqlc.narg('status')::text IS NULL
    OR status = sqlc.narg('status')
)
AND (
    sqlc.narg('search')::text IS NULL
    OR email::text ILIKE '%' || sqlc.narg('search') || '%'
    OR full_name ILIKE '%' || sqlc.narg('search') || '%'
);

-- name: GetContactMessageByID :one
SELECT
    id,
    full_name,
    email,
    phone,
    message,
    status,
    ip_address,
    user_agent,
    created_at,
    updated_at
FROM contact_messages
WHERE id = $1;

-- name: UpdateContactMessageStatus :one
UPDATE contact_messages
SET status = $2,
    updated_at = NOW()
WHERE id = $1
RETURNING
    id,
    full_name,
    email,
    phone,
    message,
    status,
    ip_address,
    user_agent,
    created_at,
    updated_at;
