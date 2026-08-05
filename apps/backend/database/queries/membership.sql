-- name: ListActiveMembershipLevels :many
SELECT
    id,
    code,
    name,
    description,
    rank,
    qualification_rules,
    is_active,
    sort_order,
    created_at,
    updated_at,
    deleted_at
FROM membership_levels
WHERE deleted_at IS NULL
  AND is_active = TRUE
ORDER BY rank ASC;

-- name: ListMembershipLevelsAdmin :many
SELECT
    id,
    code,
    name,
    description,
    rank,
    qualification_rules,
    is_active,
    sort_order,
    created_at,
    updated_at,
    deleted_at
FROM membership_levels
WHERE deleted_at IS NULL
ORDER BY rank ASC;

-- name: GetMembershipLevelByID :one
SELECT
    id,
    code,
    name,
    description,
    rank,
    qualification_rules,
    is_active,
    sort_order,
    created_at,
    updated_at,
    deleted_at
FROM membership_levels
WHERE id = $1
  AND deleted_at IS NULL;

-- name: GetMembershipLevelByCode :one
SELECT
    id,
    code,
    name,
    description,
    rank,
    qualification_rules,
    is_active,
    sort_order,
    created_at,
    updated_at,
    deleted_at
FROM membership_levels
WHERE code = $1
  AND deleted_at IS NULL;

-- name: UpdateMembershipLevelRules :one
UPDATE membership_levels
SET qualification_rules = $2,
    description = COALESCE(sqlc.narg(description), description),
    is_active = COALESCE(sqlc.narg(is_active), is_active),
    updated_at = NOW()
WHERE id = $1
  AND deleted_at IS NULL
RETURNING
    id,
    code,
    name,
    description,
    rank,
    qualification_rules,
    is_active,
    sort_order,
    created_at,
    updated_at,
    deleted_at;

-- name: ListActiveMembershipBenefits :many
SELECT
    id,
    level_id,
    code,
    title,
    description,
    data,
    is_active,
    sort_order,
    created_at,
    updated_at,
    deleted_at
FROM membership_benefits
WHERE deleted_at IS NULL
  AND is_active = TRUE
  AND (level_id IS NULL OR level_id = sqlc.narg(level_id))
ORDER BY sort_order ASC, created_at ASC;

-- name: ListAllActiveMembershipBenefits :many
SELECT
    id,
    level_id,
    code,
    title,
    description,
    data,
    is_active,
    sort_order,
    created_at,
    updated_at,
    deleted_at
FROM membership_benefits
WHERE deleted_at IS NULL
  AND is_active = TRUE
ORDER BY sort_order ASC, created_at ASC;

-- name: ListMembershipBenefitsAdmin :many
SELECT
    id,
    level_id,
    code,
    title,
    description,
    data,
    is_active,
    sort_order,
    created_at,
    updated_at,
    deleted_at
FROM membership_benefits
WHERE deleted_at IS NULL
ORDER BY sort_order ASC, created_at ASC;

-- name: GetMembershipByUserID :one
SELECT
    id,
    user_id,
    membership_number,
    level_id,
    status,
    qr_token,
    joined_at,
    expires_at,
    created_at,
    updated_at,
    deleted_at
FROM memberships
WHERE user_id = $1
  AND deleted_at IS NULL;

-- name: GetMembershipByID :one
SELECT
    id,
    user_id,
    membership_number,
    level_id,
    status,
    qr_token,
    joined_at,
    expires_at,
    created_at,
    updated_at,
    deleted_at
FROM memberships
WHERE id = $1
  AND deleted_at IS NULL;

-- name: GetMembershipByMembershipNumber :one
SELECT
    id,
    user_id,
    membership_number,
    level_id,
    status,
    qr_token,
    joined_at,
    expires_at,
    created_at,
    updated_at,
    deleted_at
FROM memberships
WHERE lower(membership_number) = lower(sqlc.arg(membership_number))
  AND deleted_at IS NULL;

-- name: GetMembershipByQrToken :one
SELECT
    id,
    user_id,
    membership_number,
    level_id,
    status,
    qr_token,
    joined_at,
    expires_at,
    created_at,
    updated_at,
    deleted_at
FROM memberships
WHERE qr_token = $1
  AND deleted_at IS NULL;

-- name: CreateMembership :one
INSERT INTO memberships (
    id,
    user_id,
    membership_number,
    level_id,
    status,
    qr_token,
    joined_at,
    expires_at,
    created_at,
    updated_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
) RETURNING
    id,
    user_id,
    membership_number,
    level_id,
    status,
    qr_token,
    joined_at,
    expires_at,
    created_at,
    updated_at,
    deleted_at;

-- name: UpdateMembershipLevel :one
UPDATE memberships
SET level_id = $2,
    updated_at = NOW()
WHERE id = $1
  AND deleted_at IS NULL
RETURNING
    id,
    user_id,
    membership_number,
    level_id,
    status,
    qr_token,
    joined_at,
    expires_at,
    created_at,
    updated_at,
    deleted_at;

-- name: UpdateMembershipStatus :one
UPDATE memberships
SET status = $2,
    updated_at = NOW()
WHERE id = $1
  AND deleted_at IS NULL
RETURNING
    id,
    user_id,
    membership_number,
    level_id,
    status,
    qr_token,
    joined_at,
    expires_at,
    created_at,
    updated_at,
    deleted_at;

-- name: CountMembershipsAdmin :one
SELECT COUNT(*)::bigint AS count
FROM memberships
WHERE deleted_at IS NULL
  AND (sqlc.narg(status)::text IS NULL OR status = sqlc.narg(status))
  AND (sqlc.narg(level_id)::uuid IS NULL OR level_id = sqlc.narg(level_id));

-- name: ListMembershipsAdmin :many
SELECT
    m.id,
    m.user_id,
    m.membership_number,
    m.level_id,
    m.status,
    m.qr_token,
    m.joined_at,
    m.expires_at,
    m.created_at,
    m.updated_at,
    m.deleted_at,
    u.email AS user_email,
    u.full_name AS user_full_name,
    l.code AS level_code,
    l.name AS level_name,
    l.rank AS level_rank
FROM memberships m
INNER JOIN users u ON u.id = m.user_id
INNER JOIN membership_levels l ON l.id = m.level_id
WHERE m.deleted_at IS NULL
  AND (sqlc.narg(status)::text IS NULL OR m.status = sqlc.narg(status))
  AND (sqlc.narg(level_id)::uuid IS NULL OR m.level_id = sqlc.narg(level_id))
ORDER BY m.joined_at DESC
LIMIT $1 OFFSET $2;

-- name: CreateMembershipHistory :exec
INSERT INTO membership_histories (
    id,
    membership_id,
    from_level_id,
    to_level_id,
    from_status,
    to_status,
    reason,
    trigger_source,
    actor_user_id,
    created_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()
);

-- name: ListMembershipHistories :many
SELECT
    h.id,
    h.membership_id,
    h.from_level_id,
    h.to_level_id,
    h.from_status,
    h.to_status,
    h.reason,
    h.trigger_source,
    h.actor_user_id,
    h.created_at,
    fl.code AS from_level_code,
    fl.name AS from_level_name,
    tl.code AS to_level_code,
    tl.name AS to_level_name
FROM membership_histories h
LEFT JOIN membership_levels fl ON fl.id = h.from_level_id
INNER JOIN membership_levels tl ON tl.id = h.to_level_id
WHERE h.membership_id = $1
ORDER BY h.created_at DESC;

-- name: CountCompletedReservationsByUser :one
SELECT COUNT(*)::bigint AS count
FROM reservations
WHERE deleted_at IS NULL
  AND customer_user_id = $1
  AND status = 'completed';
