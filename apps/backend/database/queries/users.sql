-- name: CreateUser :one
INSERT INTO users (
    id,
    email,
    password_hash,
    full_name,
    status,
    email_verified_at,
    created_at,
    updated_at
) VALUES (
    $1, $2, $3, $4, $5, $6, NOW(), NOW()
) RETURNING
    id,
    email,
    password_hash,
    full_name,
    status,
    email_verified_at,
    last_login_at,
    created_at,
    updated_at,
    deleted_at;

-- name: GetUserByID :one
SELECT
    id,
    email,
    password_hash,
    full_name,
    status,
    email_verified_at,
    last_login_at,
    created_at,
    updated_at,
    deleted_at
FROM users
WHERE id = $1
  AND deleted_at IS NULL;

-- name: GetUserByEmail :one
SELECT
    id,
    email,
    password_hash,
    full_name,
    status,
    email_verified_at,
    last_login_at,
    created_at,
    updated_at,
    deleted_at
FROM users
WHERE email = $1
  AND deleted_at IS NULL;

-- name: AssignUserRole :exec
INSERT INTO user_roles (user_id, role_id, created_at)
VALUES ($1, $2, NOW())
ON CONFLICT DO NOTHING;

-- name: ListUserRoleCodes :many
SELECT r.code
FROM user_roles ur
INNER JOIN roles r ON r.id = ur.role_id
WHERE ur.user_id = $1
ORDER BY r.code;

-- name: ListUserPermissionCodes :many
SELECT DISTINCT p.code
FROM user_roles ur
INNER JOIN role_permissions rp ON rp.role_id = ur.role_id
INNER JOIN permissions p ON p.id = rp.permission_id
WHERE ur.user_id = $1
ORDER BY p.code;

-- name: UpdateUserLastLogin :exec
UPDATE users
SET last_login_at = NOW(),
    updated_at = NOW()
WHERE id = $1
  AND deleted_at IS NULL;

-- name: MarkUserEmailVerified :one
UPDATE users
SET status = 'active',
    email_verified_at = NOW(),
    updated_at = NOW()
WHERE id = $1
  AND deleted_at IS NULL
RETURNING
    id,
    email,
    password_hash,
    full_name,
    status,
    email_verified_at,
    last_login_at,
    created_at,
    updated_at,
    deleted_at;

-- name: UpdateUserPassword :exec
UPDATE users
SET password_hash = $2,
    updated_at = NOW()
WHERE id = $1
  AND deleted_at IS NULL;

-- name: ListCustomersAdmin :many
SELECT
    u.id,
    u.email,
    u.full_name,
    u.status,
    u.email_verified_at,
    u.last_login_at,
    u.created_at,
    u.updated_at
FROM users u
WHERE u.deleted_at IS NULL
  AND EXISTS (
    SELECT 1
    FROM user_roles ur
    INNER JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = u.id
      AND r.code = 'customer'
  )
  AND (
    sqlc.narg('status')::text IS NULL
    OR u.status = sqlc.narg('status')
  )
  AND (
    sqlc.narg('search')::text IS NULL
    OR u.email::text ILIKE '%' || sqlc.narg('search') || '%'
    OR u.full_name ILIKE '%' || sqlc.narg('search') || '%'
  )
ORDER BY u.created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountCustomersAdmin :one
SELECT COUNT(*)::bigint AS total
FROM users u
WHERE u.deleted_at IS NULL
  AND EXISTS (
    SELECT 1
    FROM user_roles ur
    INNER JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = u.id
      AND r.code = 'customer'
  )
  AND (
    sqlc.narg('status')::text IS NULL
    OR u.status = sqlc.narg('status')
  )
  AND (
    sqlc.narg('search')::text IS NULL
    OR u.email::text ILIKE '%' || sqlc.narg('search') || '%'
    OR u.full_name ILIKE '%' || sqlc.narg('search') || '%'
  );

-- name: UserHasRoleCode :one
SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    INNER JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = $1
      AND r.code = $2
)::bool AS has_role;

-- name: UpdateUserStatus :one
UPDATE users
SET status = $2,
    updated_at = NOW()
WHERE id = $1
  AND deleted_at IS NULL
RETURNING
    id,
    email,
    password_hash,
    full_name,
    status,
    email_verified_at,
    last_login_at,
    created_at,
    updated_at,
    deleted_at;
