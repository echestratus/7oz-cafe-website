-- name: CreateAuthToken :one
INSERT INTO auth_tokens (
    id,
    user_id,
    token_hash,
    purpose,
    expires_at,
    created_at
) VALUES (
    $1, $2, $3, $4, $5, NOW()
) RETURNING
    id,
    user_id,
    token_hash,
    purpose,
    expires_at,
    used_at,
    created_at;

-- name: GetAuthTokenByHash :one
SELECT
    id,
    user_id,
    token_hash,
    purpose,
    expires_at,
    used_at,
    created_at
FROM auth_tokens
WHERE token_hash = $1;

-- name: MarkAuthTokenUsed :exec
UPDATE auth_tokens
SET used_at = NOW()
WHERE id = $1
  AND used_at IS NULL;
