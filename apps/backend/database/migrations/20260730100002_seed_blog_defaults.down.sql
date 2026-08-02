DELETE FROM blog_posts
WHERE id IN (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee02'
);

DELETE FROM role_permissions
WHERE permission_id = '22222222-2222-2222-2222-222222222221';

DELETE FROM permissions
WHERE id = '22222222-2222-2222-2222-222222222221';
