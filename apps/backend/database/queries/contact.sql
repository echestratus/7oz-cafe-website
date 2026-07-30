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
