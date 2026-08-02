-- name: GetRoleByCode :one
SELECT
    id,
    code,
    name,
    description,
    created_at,
    updated_at
FROM roles
WHERE code = $1;

-- name: ListRoles :many
SELECT
    id,
    code,
    name,
    description,
    created_at,
    updated_at
FROM roles
ORDER BY code;

-- name: ListPermissions :many
SELECT
    id,
    code,
    name,
    description,
    created_at,
    updated_at
FROM permissions
ORDER BY code;
