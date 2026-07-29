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
