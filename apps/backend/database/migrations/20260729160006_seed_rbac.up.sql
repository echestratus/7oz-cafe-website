INSERT INTO roles (id, code, name, description) VALUES
    ('11111111-1111-1111-1111-111111111101', 'customer', 'Customer', 'Authenticated cafe customer'),
    ('11111111-1111-1111-1111-111111111102', 'admin', 'Admin', 'Operational administrator'),
    ('11111111-1111-1111-1111-111111111103', 'super_admin', 'Super Admin', 'Full platform administrator');

INSERT INTO permissions (id, code, name, description) VALUES
    ('22222222-2222-2222-2222-222222222201', 'profile.read', 'Read profile', 'View own profile'),
    ('22222222-2222-2222-2222-222222222202', 'profile.update', 'Update profile', 'Update own profile'),
    ('22222222-2222-2222-2222-222222222203', 'menu.read', 'Read menu', 'View public menu'),
    ('22222222-2222-2222-2222-222222222204', 'gallery.read', 'Read gallery', 'View public gallery'),
    ('22222222-2222-2222-2222-222222222205', 'reservation.create', 'Create reservation', 'Create a reservation'),
    ('22222222-2222-2222-2222-222222222206', 'reservation.read_own', 'Read own reservations', 'View own reservations'),
    ('22222222-2222-2222-2222-222222222207', 'reservation.cancel_own', 'Cancel own reservations', 'Cancel eligible own reservations'),
    ('22222222-2222-2222-2222-222222222208', 'membership.read_own', 'Read own membership', 'View own membership'),
    ('22222222-2222-2222-2222-222222222209', 'loyalty.read_own', 'Read own loyalty', 'View own loyalty balance and history'),
    ('22222222-2222-2222-2222-222222222210', 'menu.manage', 'Manage menu', 'Manage menu catalog'),
    ('22222222-2222-2222-2222-222222222211', 'gallery.manage', 'Manage gallery', 'Manage gallery media'),
    ('22222222-2222-2222-2222-222222222212', 'reservation.manage', 'Manage reservations', 'Manage all reservations'),
    ('22222222-2222-2222-2222-222222222213', 'membership.manage', 'Manage membership', 'Manage memberships and tiers'),
    ('22222222-2222-2222-2222-222222222214', 'loyalty.manage', 'Manage loyalty', 'Manage loyalty points and rewards'),
    ('22222222-2222-2222-2222-222222222215', 'cms.manage', 'Manage CMS', 'Manage website CMS content'),
    ('22222222-2222-2222-2222-222222222216', 'customer.read', 'Read customers', 'View customer accounts'),
    ('22222222-2222-2222-2222-222222222217', 'user.manage', 'Manage users', 'Manage staff and customer accounts'),
    ('22222222-2222-2222-2222-222222222218', 'role.manage', 'Manage roles', 'Manage roles and permissions'),
    ('22222222-2222-2222-2222-222222222219', 'settings.manage', 'Manage settings', 'Manage system settings'),
    ('22222222-2222-2222-2222-222222222220', 'audit.read', 'Read audit logs', 'View audit logs');

-- Customer permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT '11111111-1111-1111-1111-111111111101', id
FROM permissions
WHERE code IN (
    'profile.read',
    'profile.update',
    'menu.read',
    'gallery.read',
    'reservation.create',
    'reservation.read_own',
    'reservation.cancel_own',
    'membership.read_own',
    'loyalty.read_own'
);

-- Admin permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT '11111111-1111-1111-1111-111111111102', id
FROM permissions
WHERE code IN (
    'menu.read',
    'gallery.read',
    'menu.manage',
    'gallery.manage',
    'reservation.manage',
    'membership.manage',
    'loyalty.manage',
    'cms.manage',
    'customer.read',
    'profile.read',
    'profile.update'
);

-- Super Admin receives every permission
INSERT INTO role_permissions (role_id, permission_id)
SELECT '11111111-1111-1111-1111-111111111103', id
FROM permissions;
