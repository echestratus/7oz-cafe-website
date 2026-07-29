-- name: CreateAuditLog :exec
INSERT INTO audit_logs (
    id,
    actor_user_id,
    action,
    resource_type,
    resource_id,
    ip_address,
    user_agent,
    metadata,
    created_at
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, NOW()
);
