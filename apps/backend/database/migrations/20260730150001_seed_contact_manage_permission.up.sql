INSERT INTO permissions (id, code, name, description) VALUES
    ('22222222-2222-2222-2222-222222222222', 'contact.manage', 'Manage contact messages', 'View and update public contact form submissions');

INSERT INTO role_permissions (role_id, permission_id)
SELECT '11111111-1111-1111-1111-111111111102', id
FROM permissions
WHERE code = 'contact.manage'
  AND NOT EXISTS (
      SELECT 1
      FROM role_permissions rp
      WHERE rp.role_id = '11111111-1111-1111-1111-111111111102'
        AND rp.permission_id = permissions.id
  );

INSERT INTO role_permissions (role_id, permission_id)
SELECT '11111111-1111-1111-1111-111111111103', id
FROM permissions
WHERE code = 'contact.manage'
  AND NOT EXISTS (
      SELECT 1
      FROM role_permissions rp
      WHERE rp.role_id = '11111111-1111-1111-1111-111111111103'
        AND rp.permission_id = permissions.id
  );
