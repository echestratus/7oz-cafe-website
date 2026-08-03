-- name: GetReservationSettings :one
SELECT
    id,
    min_guests,
    max_guests,
    min_advance_minutes,
    max_advance_days,
    slot_interval_minutes,
    duration_minutes,
    buffer_minutes,
    cancel_cutoff_minutes,
    timezone,
    weekly_hours,
    created_at,
    updated_at
FROM reservation_settings
ORDER BY created_at
LIMIT 1;

-- name: UpdateReservationSettings :one
UPDATE reservation_settings
SET min_guests = $2,
    max_guests = $3,
    min_advance_minutes = $4,
    max_advance_days = $5,
    slot_interval_minutes = $6,
    duration_minutes = $7,
    buffer_minutes = $8,
    cancel_cutoff_minutes = $9,
    timezone = $10,
    weekly_hours = $11,
    updated_at = NOW()
WHERE id = $1
RETURNING
    id,
    min_guests,
    max_guests,
    min_advance_minutes,
    max_advance_days,
    slot_interval_minutes,
    duration_minutes,
    buffer_minutes,
    cancel_cutoff_minutes,
    timezone,
    weekly_hours,
    created_at,
    updated_at;

-- name: ListActiveCafeTables :many
SELECT
    id,
    code,
    name,
    capacity,
    is_active,
    sort_order,
    created_at,
    updated_at,
    deleted_at
FROM cafe_tables
WHERE deleted_at IS NULL
  AND is_active = TRUE
ORDER BY sort_order, code;

-- name: GetActiveCafeTableByID :one
SELECT
    id,
    code,
    name,
    capacity,
    is_active,
    sort_order,
    created_at,
    updated_at,
    deleted_at
FROM cafe_tables
WHERE id = $1
  AND deleted_at IS NULL
  AND is_active = TRUE;

-- name: ListCafeTablesAdmin :many
SELECT
    id,
    code,
    name,
    capacity,
    is_active,
    sort_order,
    created_at,
    updated_at,
    deleted_at
FROM cafe_tables
WHERE deleted_at IS NULL
ORDER BY sort_order, code;

-- name: GetCafeTableByID :one
SELECT
    id,
    code,
    name,
    capacity,
    is_active,
    sort_order,
    created_at,
    updated_at,
    deleted_at
FROM cafe_tables
WHERE id = $1
  AND deleted_at IS NULL;

-- name: CreateCafeTable :one
INSERT INTO cafe_tables (
    id,
    code,
    name,
    capacity,
    is_active,
    sort_order,
    created_at,
    updated_at
) VALUES (
    $1, $2, $3, $4, $5, $6, NOW(), NOW()
) RETURNING
    id,
    code,
    name,
    capacity,
    is_active,
    sort_order,
    created_at,
    updated_at,
    deleted_at;

-- name: UpdateCafeTable :one
UPDATE cafe_tables
SET name = $2,
    capacity = $3,
    is_active = $4,
    sort_order = $5,
    updated_at = NOW()
WHERE id = $1
  AND deleted_at IS NULL
RETURNING
    id,
    code,
    name,
    capacity,
    is_active,
    sort_order,
    created_at,
    updated_at,
    deleted_at;

-- name: SoftDeleteCafeTable :one
UPDATE cafe_tables
SET deleted_at = NOW(),
    is_active = FALSE,
    updated_at = NOW()
WHERE id = $1
  AND deleted_at IS NULL
RETURNING
    id,
    code,
    name,
    capacity,
    is_active,
    sort_order,
    created_at,
    updated_at,
    deleted_at;

-- name: SumActiveTableCapacity :one
SELECT COALESCE(SUM(capacity), 0)::bigint AS total_capacity
FROM cafe_tables
WHERE deleted_at IS NULL
  AND is_active = TRUE;

-- name: CreateReservation :one
INSERT INTO reservations (
    id,
    reservation_number,
    customer_user_id,
    guest_full_name,
    guest_email,
    guest_phone,
    reservation_date,
    reservation_time,
    guest_count,
    status,
    notes,
    table_id,
    created_at,
    updated_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
) RETURNING
    id,
    reservation_number,
    customer_user_id,
    guest_full_name,
    guest_email,
    guest_phone,
    reservation_date,
    reservation_time,
    guest_count,
    status,
    notes,
    table_id,
    cancelled_at,
    cancel_reason,
    created_at,
    updated_at,
    deleted_at;

-- name: GetReservationByID :one
SELECT
    id,
    reservation_number,
    customer_user_id,
    guest_full_name,
    guest_email,
    guest_phone,
    reservation_date,
    reservation_time,
    guest_count,
    status,
    notes,
    table_id,
    cancelled_at,
    cancel_reason,
    created_at,
    updated_at,
    deleted_at
FROM reservations
WHERE id = $1
  AND deleted_at IS NULL;

-- name: GetReservationByNumber :one
SELECT
    id,
    reservation_number,
    customer_user_id,
    guest_full_name,
    guest_email,
    guest_phone,
    reservation_date,
    reservation_time,
    guest_count,
    status,
    notes,
    table_id,
    cancelled_at,
    cancel_reason,
    created_at,
    updated_at,
    deleted_at
FROM reservations
WHERE reservation_number = $1
  AND deleted_at IS NULL;

-- name: ListReservationsByCustomer :many
SELECT
    id,
    reservation_number,
    customer_user_id,
    guest_full_name,
    guest_email,
    guest_phone,
    reservation_date,
    reservation_time,
    guest_count,
    status,
    notes,
    table_id,
    cancelled_at,
    cancel_reason,
    created_at,
    updated_at,
    deleted_at
FROM reservations
WHERE customer_user_id = $1
  AND deleted_at IS NULL
ORDER BY reservation_date DESC, reservation_time DESC;

-- name: ListReservationsAdmin :many
SELECT
    id,
    reservation_number,
    customer_user_id,
    guest_full_name,
    guest_email,
    guest_phone,
    reservation_date,
    reservation_time,
    guest_count,
    status,
    notes,
    table_id,
    cancelled_at,
    cancel_reason,
    created_at,
    updated_at,
    deleted_at
FROM reservations
WHERE deleted_at IS NULL
  AND (sqlc.narg('reservation_date')::date IS NULL OR reservation_date = sqlc.narg('reservation_date'))
  AND (sqlc.narg('status')::text IS NULL OR status = sqlc.narg('status'))
ORDER BY reservation_date DESC, reservation_time DESC
LIMIT sqlc.arg('limit') OFFSET sqlc.arg('offset');

-- name: CountReservationsAdmin :one
SELECT COUNT(*)::bigint AS count
FROM reservations
WHERE deleted_at IS NULL
  AND (sqlc.narg('reservation_date')::date IS NULL OR reservation_date = sqlc.narg('reservation_date'))
  AND (sqlc.narg('status')::text IS NULL OR status = sqlc.narg('status'));

-- name: ListActiveReservationsForDate :many
SELECT
    id,
    reservation_number,
    customer_user_id,
    guest_full_name,
    guest_email,
    guest_phone,
    reservation_date,
    reservation_time,
    guest_count,
    status,
    notes,
    table_id,
    cancelled_at,
    cancel_reason,
    created_at,
    updated_at,
    deleted_at
FROM reservations
WHERE deleted_at IS NULL
  AND reservation_date = $1
  AND status IN ('pending', 'confirmed', 'checked_in');

-- name: UpdateReservationStatus :one
UPDATE reservations
SET status = $2,
    cancelled_at = $3,
    cancel_reason = $4,
    updated_at = NOW()
WHERE id = $1
  AND deleted_at IS NULL
RETURNING
    id,
    reservation_number,
    customer_user_id,
    guest_full_name,
    guest_email,
    guest_phone,
    reservation_date,
    reservation_time,
    guest_count,
    status,
    notes,
    table_id,
    cancelled_at,
    cancel_reason,
    created_at,
    updated_at,
    deleted_at;

-- name: AssignReservationTable :one
UPDATE reservations
SET table_id = $2,
    updated_at = NOW()
WHERE id = $1
  AND deleted_at IS NULL
RETURNING
    id,
    reservation_number,
    customer_user_id,
    guest_full_name,
    guest_email,
    guest_phone,
    reservation_date,
    reservation_time,
    guest_count,
    status,
    notes,
    table_id,
    cancelled_at,
    cancel_reason,
    created_at,
    updated_at,
    deleted_at;

-- name: CreateReservationHistory :exec
INSERT INTO reservation_histories (
    id,
    reservation_id,
    from_status,
    to_status,
    actor_user_id,
    note,
    created_at
) VALUES (
    $1, $2, $3, $4, $5, $6, NOW()
);

-- name: CountDuplicateGuestReservation :one
SELECT COUNT(*)::bigint AS count
FROM reservations
WHERE deleted_at IS NULL
  AND guest_email = $1
  AND reservation_date = $2
  AND reservation_time = $3
  AND status IN ('pending', 'confirmed', 'checked_in');
