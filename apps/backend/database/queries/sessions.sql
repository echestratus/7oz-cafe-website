-- name: CreateSession :one
INSERT INTO sessions (
    id,
    user_id,
    refresh_token_hash,
    user_agent,
    ip_address,
    expires_at,
    last_activity_at,
    created_at,
    updated_at
) VALUES (
    $1, $2, $3, $4, $5, $6, NOW(), NOW(), NOW()
) RETURNING
    id,
    user_id,
    refresh_token_hash,
    user_agent,
    ip_address,
    expires_at,
    revoked_at,
    last_activity_at,
    created_at,
    updated_at;

-- name: GetSessionByRefreshTokenHash :one
SELECT
    id,
    user_id,
    refresh_token_hash,
    user_agent,
    ip_address,
    expires_at,
    revoked_at,
    last_activity_at,
    created_at,
    updated_at
FROM sessions
WHERE refresh_token_hash = $1;

-- name: RevokeSession :exec
UPDATE sessions
SET revoked_at = NOW(),
    updated_at = NOW()
WHERE id = $1
  AND revoked_at IS NULL;

-- name: RevokeUserSessions :exec
UPDATE sessions
SET revoked_at = NOW(),
    updated_at = NOW()
WHERE user_id = $1
  AND revoked_at IS NULL;

-- name: TouchSessionActivity :exec
UPDATE sessions
SET last_activity_at = NOW(),
    updated_at = NOW()
WHERE id = $1
  AND revoked_at IS NULL;
