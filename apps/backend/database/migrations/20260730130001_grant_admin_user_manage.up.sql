-- Grant operational customer status management to Admin role.
INSERT INTO role_permissions (role_id, permission_id)
SELECT '11111111-1111-1111-1111-111111111102', id
FROM permissions
WHERE code = 'user.manage'
ON CONFLICT DO NOTHING;
