-- Blog permissions and seed posts from legacy 7oz-espresso.com.

INSERT INTO permissions (id, code, name, description) VALUES
    ('22222222-2222-2222-2222-222222222221', 'blog.manage', 'Manage blog', 'Manage blog posts, news, and events');

INSERT INTO role_permissions (role_id, permission_id)
SELECT '11111111-1111-1111-1111-111111111102', id
FROM permissions
WHERE code = 'blog.manage'
  AND NOT EXISTS (
      SELECT 1
      FROM role_permissions rp
      WHERE rp.role_id = '11111111-1111-1111-1111-111111111102'
        AND rp.permission_id = permissions.id
  );

INSERT INTO role_permissions (role_id, permission_id)
SELECT '11111111-1111-1111-1111-111111111103', id
FROM permissions
WHERE code = 'blog.manage'
  AND NOT EXISTS (
      SELECT 1
      FROM role_permissions rp
      WHERE rp.role_id = '11111111-1111-1111-1111-111111111103'
        AND rp.permission_id = permissions.id
  );

INSERT INTO blog_posts (
    id,
    slug,
    title,
    excerpt,
    body,
    kind,
    cover_url,
    status,
    published_at,
    seo
) VALUES
(
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee01',
    'malaysias-minister-of-religious-affairs-visits-7oz-cafe-in-uzbekistan',
    'Malaysia''s Minister of Religious Affairs Visits 7oz Cafe in Uzbekistan',
    'Malaysia''s Minister of Religious Affairs visited 7oz Cafe in Uzbekistan during an official visit, highlighting warm hospitality and quality coffee culture.',
    $body1$Malaysia's Minister of Religious Affairs visited 7oz Cafe in Uzbekistan during an official visit. The stop showcased the cafe's warm hospitality, inviting atmosphere, and commitment to serving quality food and beverages, making it a memorable moment that reflects the growing friendship between Malaysia and Uzbekistan.$body1$,
    'news',
    NULL,
    'published',
    TIMESTAMPTZ '2026-05-25 07:00:00+00',
    '{"metaTitle":"Malaysia''s Minister of Religious Affairs Visits 7oz Cafe","metaDescription":"Official visit to 7oz Cafe in Uzbekistan.","canonicalPath":"/blogs/malaysias-minister-of-religious-affairs-visits-7oz-cafe-in-uzbekistan"}'::jsonb
),
(
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeee02',
    'grand-opening-7oz-espresso-cafe-in-tashkent',
    'Grand Opening 7oz Espresso Cafe in Tashkent',
    '7oz Espresso Cafe opened in Tashkent Boulevard on April 15, 2026 — bringing Indonesian coffee heritage to Uzbekistan.',
    $body2$7oz Espresso Cafe officially made history by hosting a festive grand opening on Wednesday, April 15, 2026, in one of Tashkent's most prestigious commercial areas, Tashkent Boulevard, Uzbekistan. The modern urban coffee shop marks a proud expansion of Indonesian coffee culture abroad and is managed by EGI Food under PT. EGI Resources.

## EGI Resources on the international stage

Opening the first international branch in Central Asia reflects a long-term global vision. Market entry into Uzbekistan was based on careful research into urban lifestyle growth in the capital.

## Modern architecture with Nusantara warmth

The facade and interior blend modern industrial aesthetics with warm Nusantara hospitality — natural wood, soft lighting, ergonomic seating, and indoor greenery for guests who come to meet, work, or unwind.

## Opening day energy

On inauguration day, locals and the Indonesian diaspora filled the cafe. The program included coffee cupping, latte art demonstrations by a head barista from Jakarta, and freshly baked pastries from the EGI Food kitchen — a strong start for international F&B operations.$body2$,
    'event',
    NULL,
    'published',
    TIMESTAMPTZ '2026-04-15 10:00:00+00',
    '{"metaTitle":"Grand Opening 7oz Espresso Cafe in Tashkent","metaDescription":"7oz opens in Tashkent Boulevard, Uzbekistan.","canonicalPath":"/blogs/grand-opening-7oz-espresso-cafe-in-tashkent"}'::jsonb
);
