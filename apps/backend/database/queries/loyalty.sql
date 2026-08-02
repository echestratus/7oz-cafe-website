-- name: GetLoyaltySettings :one
SELECT
    id,
    points_per_completed_reservation,
    expiration_strategy,
    expiration_months,
    created_at,
    updated_at
FROM loyalty_settings
ORDER BY created_at ASC
LIMIT 1;

-- name: UpdateLoyaltySettings :one
UPDATE loyalty_settings
SET points_per_completed_reservation = $2,
    expiration_strategy = $3,
    expiration_months = $4,
    updated_at = NOW()
WHERE id = $1
RETURNING
    id,
    points_per_completed_reservation,
    expiration_strategy,
    expiration_months,
    created_at,
    updated_at;

-- name: ListLoyaltyAccountsWithBalance :many
SELECT
    id,
    user_id,
    balance,
    lifetime_earned,
    lifetime_redeemed,
    created_at,
    updated_at,
    deleted_at
FROM loyalty_accounts
WHERE deleted_at IS NULL
  AND balance > 0
ORDER BY created_at ASC;

-- name: ListLoyaltyTransactionsByAccountAsc :many
SELECT
    id,
    account_id,
    user_id,
    type,
    points,
    balance_after,
    source,
    description,
    related_entity_type,
    related_entity_id,
    campaign_id,
    actor_user_id,
    created_at
FROM loyalty_transactions
WHERE account_id = $1
ORDER BY created_at ASC, id ASC;

-- name: GetLoyaltyAccountByUserID :one
SELECT
    id,
    user_id,
    balance,
    lifetime_earned,
    lifetime_redeemed,
    created_at,
    updated_at,
    deleted_at
FROM loyalty_accounts
WHERE user_id = $1
  AND deleted_at IS NULL;

-- name: GetLoyaltyAccountForUpdate :one
SELECT
    id,
    user_id,
    balance,
    lifetime_earned,
    lifetime_redeemed,
    created_at,
    updated_at,
    deleted_at
FROM loyalty_accounts
WHERE user_id = $1
  AND deleted_at IS NULL
FOR UPDATE;

-- name: CreateLoyaltyAccount :one
INSERT INTO loyalty_accounts (
    id,
    user_id,
    balance,
    lifetime_earned,
    lifetime_redeemed,
    created_at,
    updated_at
) VALUES (
    $1, $2, 0, 0, 0, NOW(), NOW()
) RETURNING
    id,
    user_id,
    balance,
    lifetime_earned,
    lifetime_redeemed,
    created_at,
    updated_at,
    deleted_at;

-- name: UpdateLoyaltyAccountBalances :one
UPDATE loyalty_accounts
SET balance = $2,
    lifetime_earned = $3,
    lifetime_redeemed = $4,
    updated_at = NOW()
WHERE id = $1
  AND deleted_at IS NULL
RETURNING
    id,
    user_id,
    balance,
    lifetime_earned,
    lifetime_redeemed,
    created_at,
    updated_at,
    deleted_at;

-- name: CreateLoyaltyTransaction :one
INSERT INTO loyalty_transactions (
    id,
    account_id,
    user_id,
    type,
    points,
    balance_after,
    source,
    description,
    related_entity_type,
    related_entity_id,
    campaign_id,
    actor_user_id,
    created_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW()
) RETURNING
    id,
    account_id,
    user_id,
    type,
    points,
    balance_after,
    source,
    description,
    related_entity_type,
    related_entity_id,
    campaign_id,
    actor_user_id,
    created_at;

-- name: ListLoyaltyTransactionsByUser :many
SELECT
    id,
    account_id,
    user_id,
    type,
    points,
    balance_after,
    source,
    description,
    related_entity_type,
    related_entity_id,
    campaign_id,
    actor_user_id,
    created_at
FROM loyalty_transactions
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: CountLoyaltyTransactionsByUser :one
SELECT COUNT(*)::bigint AS count
FROM loyalty_transactions
WHERE user_id = $1;

-- name: ListLoyaltyTransactionsAdmin :many
SELECT
    t.id,
    t.account_id,
    t.user_id,
    t.type,
    t.points,
    t.balance_after,
    t.source,
    t.description,
    t.related_entity_type,
    t.related_entity_id,
    t.campaign_id,
    t.actor_user_id,
    t.created_at,
    u.email AS user_email,
    u.full_name AS user_full_name
FROM loyalty_transactions t
INNER JOIN users u ON u.id = t.user_id
WHERE (sqlc.narg(user_id)::uuid IS NULL OR t.user_id = sqlc.narg(user_id))
ORDER BY t.created_at DESC
LIMIT $1 OFFSET $2;

-- name: CountLoyaltyTransactionsAdmin :one
SELECT COUNT(*)::bigint AS count
FROM loyalty_transactions
WHERE (sqlc.narg(user_id)::uuid IS NULL OR user_id = sqlc.narg(user_id));

-- name: ListLoyaltyAccountsAdmin :many
SELECT
    a.id,
    a.user_id,
    a.balance,
    a.lifetime_earned,
    a.lifetime_redeemed,
    a.created_at,
    a.updated_at,
    a.deleted_at,
    u.email AS user_email,
    u.full_name AS user_full_name
FROM loyalty_accounts a
INNER JOIN users u ON u.id = a.user_id
WHERE a.deleted_at IS NULL
ORDER BY a.updated_at DESC
LIMIT $1 OFFSET $2;

-- name: CountLoyaltyAccountsAdmin :one
SELECT COUNT(*)::bigint AS count
FROM loyalty_accounts
WHERE deleted_at IS NULL;

-- name: ListActiveLoyaltyRewards :many
SELECT
    id,
    code,
    title,
    description,
    points_cost,
    stock,
    is_active,
    sort_order,
    data,
    created_at,
    updated_at,
    deleted_at
FROM loyalty_rewards
WHERE deleted_at IS NULL
  AND is_active = TRUE
ORDER BY sort_order ASC, created_at ASC;

-- name: ListLoyaltyRewardsAdmin :many
SELECT
    id,
    code,
    title,
    description,
    points_cost,
    stock,
    is_active,
    sort_order,
    data,
    created_at,
    updated_at,
    deleted_at
FROM loyalty_rewards
WHERE deleted_at IS NULL
ORDER BY sort_order ASC, created_at ASC;

-- name: GetLoyaltyRewardByID :one
SELECT
    id,
    code,
    title,
    description,
    points_cost,
    stock,
    is_active,
    sort_order,
    data,
    created_at,
    updated_at,
    deleted_at
FROM loyalty_rewards
WHERE id = $1
  AND deleted_at IS NULL;

-- name: GetLoyaltyRewardForUpdate :one
SELECT
    id,
    code,
    title,
    description,
    points_cost,
    stock,
    is_active,
    sort_order,
    data,
    created_at,
    updated_at,
    deleted_at
FROM loyalty_rewards
WHERE id = $1
  AND deleted_at IS NULL
FOR UPDATE;

-- name: DecrementLoyaltyRewardStock :one
UPDATE loyalty_rewards
SET stock = stock - 1,
    updated_at = NOW()
WHERE id = $1
  AND deleted_at IS NULL
  AND stock IS NOT NULL
  AND stock > 0
RETURNING
    id,
    code,
    title,
    description,
    points_cost,
    stock,
    is_active,
    sort_order,
    data,
    created_at,
    updated_at,
    deleted_at;

-- name: CreateLoyaltyReward :one
INSERT INTO loyalty_rewards (
    id,
    code,
    title,
    description,
    points_cost,
    stock,
    is_active,
    sort_order,
    data,
    created_at,
    updated_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()
) RETURNING
    id,
    code,
    title,
    description,
    points_cost,
    stock,
    is_active,
    sort_order,
    data,
    created_at,
    updated_at,
    deleted_at;

-- name: UpdateLoyaltyReward :one
UPDATE loyalty_rewards
SET title = $2,
    description = $3,
    points_cost = $4,
    stock = $5,
    is_active = $6,
    sort_order = $7,
    data = $8,
    updated_at = NOW()
WHERE id = $1
  AND deleted_at IS NULL
RETURNING
    id,
    code,
    title,
    description,
    points_cost,
    stock,
    is_active,
    sort_order,
    data,
    created_at,
    updated_at,
    deleted_at;

-- name: SoftDeleteLoyaltyReward :one
UPDATE loyalty_rewards
SET deleted_at = NOW(),
    is_active = FALSE,
    updated_at = NOW()
WHERE id = $1
  AND deleted_at IS NULL
RETURNING
    id,
    code,
    title,
    description,
    points_cost,
    stock,
    is_active,
    sort_order,
    data,
    created_at,
    updated_at,
    deleted_at;

-- name: CreateLoyaltyRedemption :one
INSERT INTO loyalty_redemptions (
    id,
    user_id,
    account_id,
    reward_id,
    transaction_id,
    points_spent,
    status,
    created_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, NOW()
) RETURNING
    id,
    user_id,
    account_id,
    reward_id,
    transaction_id,
    points_spent,
    status,
    created_at;

-- name: ListActiveLoyaltyCampaigns :many
SELECT
    id,
    code,
    name,
    description,
    starts_at,
    ends_at,
    point_multiplier,
    bonus_points,
    eligible_level_codes,
    is_active,
    created_at,
    updated_at,
    deleted_at
FROM loyalty_campaigns
WHERE deleted_at IS NULL
  AND is_active = TRUE
  AND starts_at <= NOW()
  AND ends_at >= NOW()
ORDER BY starts_at ASC;

-- name: ListLoyaltyCampaignsAdmin :many
SELECT
    id,
    code,
    name,
    description,
    starts_at,
    ends_at,
    point_multiplier,
    bonus_points,
    eligible_level_codes,
    is_active,
    created_at,
    updated_at,
    deleted_at
FROM loyalty_campaigns
WHERE deleted_at IS NULL
ORDER BY starts_at DESC;

-- name: GetLoyaltyCampaignByID :one
SELECT
    id,
    code,
    name,
    description,
    starts_at,
    ends_at,
    point_multiplier,
    bonus_points,
    eligible_level_codes,
    is_active,
    created_at,
    updated_at,
    deleted_at
FROM loyalty_campaigns
WHERE id = $1
  AND deleted_at IS NULL;

-- name: CreateLoyaltyCampaign :one
INSERT INTO loyalty_campaigns (
    id,
    code,
    name,
    description,
    starts_at,
    ends_at,
    point_multiplier,
    bonus_points,
    eligible_level_codes,
    is_active,
    created_at,
    updated_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
) RETURNING
    id,
    code,
    name,
    description,
    starts_at,
    ends_at,
    point_multiplier,
    bonus_points,
    eligible_level_codes,
    is_active,
    created_at,
    updated_at,
    deleted_at;

-- name: UpdateLoyaltyCampaign :one
UPDATE loyalty_campaigns
SET name = $2,
    description = $3,
    starts_at = $4,
    ends_at = $5,
    point_multiplier = $6,
    bonus_points = $7,
    eligible_level_codes = $8,
    is_active = $9,
    updated_at = NOW()
WHERE id = $1
  AND deleted_at IS NULL
RETURNING
    id,
    code,
    name,
    description,
    starts_at,
    ends_at,
    point_multiplier,
    bonus_points,
    eligible_level_codes,
    is_active,
    created_at,
    updated_at,
    deleted_at;
