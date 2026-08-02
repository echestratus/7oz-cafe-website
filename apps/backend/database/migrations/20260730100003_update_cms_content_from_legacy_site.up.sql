-- Sync CMS draft content from legacy 7oz-espresso.com (Tashkent MVP).
-- Also adds homepage blogs_preview section and republishes version snapshots.

INSERT INTO cms_sections (id, page_id, code, label, is_enabled, sort_order)
VALUES (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb08',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'blogs_preview',
    'Blogs Preview',
    TRUE,
    45
)
ON CONFLICT (page_id, code) DO UPDATE
SET label = EXCLUDED.label,
    is_enabled = EXCLUDED.is_enabled,
    sort_order = EXCLUDED.sort_order,
    deleted_at = NULL,
    updated_at = NOW();

INSERT INTO cms_contents (id, section_id, data)
VALUES (
    'cccccccc-cccc-cccc-cccc-cccccccccc08',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb08',
    '{"heading":"News & Events","description":"Stories from the cafe — openings, visits, and moments worth sharing.","limit":3}'::jsonb
)
ON CONFLICT (section_id) DO UPDATE
SET data = EXCLUDED.data,
    updated_at = NOW();

UPDATE cms_contents
SET data = '{"heading":"From Jakarta to Tashkent","description":"Jakarta''s finest has arrived in the heart of Tashkent — bringing Indonesian coffee heritage to an international stage.","cta":{"label":"Our Story","href":"/about"}}'::jsonb,
    updated_at = NOW()
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccc03';

UPDATE cms_contents
SET data = '{"heading":"Our Story","body":"7oz Espresso was born from a passionate mission to bring the rich heritage of Indonesian coffee to the global stage. Originating from our roots in Jakarta, we are now proudly brewing exceptional coffee in the heart of Tashkent, Uzbekistan. The name \"7oz\" represents the ideal volume for a perfect cup — a symbol of our uncompromising commitment to excellence.\n\nWe believe that extraordinary coffee starts at the source. That is why we exclusively select the finest Indonesian coffee beans, then elevate these authentic flavors with modern equipment and premium presentation.\n\nCrafted by experienced baristas, every drop we pour delivers a refined tasting experience. More than just a cafe, 7oz Espresso is where craftsmanship and connection meet.","imageMediaId":null}'::jsonb,
    updated_at = NOW()
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccc11';

UPDATE cms_contents
SET data = '{"heading":"Values","items":[{"title":"Experienced Barista","body":"Every cup is crafted by skilled hands with calm precision."},{"title":"Selected Beans","body":"We choose Indonesian beans known for character and depth."},{"title":"Modern Craft","body":"State-of-the-art equipment meets premium presentation."}]}'::jsonb,
    updated_at = NOW()
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccc12';

UPDATE cms_contents
SET data = '{"tagline":"Seven ounces of care.","links":[{"label":"Menu","href":"/menu"},{"label":"Blogs","href":"/blogs"},{"label":"About","href":"/about"},{"label":"Contact","href":"/contact"}],"copyright":"© 7Oz Espresso Cafe"}'::jsonb,
    updated_at = NOW()
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccc21';

UPDATE cms_contents
SET data = '{"address":"City Park, Ukchi ko''chasi 3A, 100011, Tashkent, Uzbekistan","phone":"+998 92 04 333 14","whatsapp":"+998920433314","email":"support@7oz-espresso.com","mapsUrl":"","reservationContact":"+998 92 04 333 14"}'::jsonb,
    updated_at = NOW()
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccc31';

UPDATE cms_contents
SET data = '{"timezone":"Asia/Tashkent","weekly":[{"day":"monday","open":"08:00","close":"00:00"},{"day":"tuesday","open":"08:00","close":"00:00"},{"day":"wednesday","open":"08:00","close":"00:00"},{"day":"thursday","open":"08:00","close":"00:00"},{"day":"friday","open":"08:00","close":"00:00"},{"day":"saturday","open":"07:30","close":"23:00"},{"day":"sunday","open":"07:30","close":"23:00"}],"holidays":[]}'::jsonb,
    updated_at = NOW()
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccc32';

-- Republish snapshots so public CMS API reflects updated draft content.
INSERT INTO cms_versions (id, page_id, version_number, summary, snapshot, published_at)
SELECT
    nv.version_id,
    p.id,
    nv.version_number,
    'Legacy site content sync',
    jsonb_build_object(
        'page', jsonb_build_object(
            'id', p.id,
            'slug', p.slug,
            'title', p.title,
            'status', 'published',
            'seo', p.seo
        ),
        'sections', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', s.id,
                    'code', s.code,
                    'label', s.label,
                    'isEnabled', s.is_enabled,
                    'sortOrder', s.sort_order,
                    'data', c.data
                )
                ORDER BY s.sort_order, s.code
            )
            FROM cms_sections s
            INNER JOIN cms_contents c ON c.section_id = s.id
            WHERE s.page_id = p.id
              AND s.deleted_at IS NULL
        ), '[]'::jsonb)
    ),
    NOW()
FROM cms_pages p
INNER JOIN (
    VALUES
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'::uuid, 10, 'dddddddd-dddd-dddd-dddd-dddddddddd11'::uuid),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'::uuid, 10, 'dddddddd-dddd-dddd-dddd-dddddddddd12'::uuid),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3'::uuid, 10, 'dddddddd-dddd-dddd-dddd-dddddddddd13'::uuid),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4'::uuid, 10, 'dddddddd-dddd-dddd-dddd-dddddddddd14'::uuid)
) AS nv(page_id, version_number, version_id) ON nv.page_id = p.id
WHERE NOT EXISTS (
    SELECT 1 FROM cms_versions existing
    WHERE existing.page_id = p.id AND existing.version_number = nv.version_number
);

UPDATE cms_pages p
SET published_version_id = nv.version_id,
    status = 'published',
    updated_at = NOW()
FROM (
    VALUES
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'::uuid, 'dddddddd-dddd-dddd-dddd-dddddddddd11'::uuid),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'::uuid, 'dddddddd-dddd-dddd-dddd-dddddddddd12'::uuid),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3'::uuid, 'dddddddd-dddd-dddd-dddd-dddddddddd13'::uuid),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4'::uuid, 'dddddddd-dddd-dddd-dddd-dddddddddd14'::uuid)
) AS nv(page_id, version_id)
WHERE p.id = nv.page_id;
