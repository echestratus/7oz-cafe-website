-- Seed homepage guest review (Dr. Zulkifli Hasan) and move section before CTAs.

UPDATE cms_sections
SET sort_order = 48,
    updated_at = NOW()
WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb07';

UPDATE cms_contents
SET data = '{
  "heading": "Guest Voices",
  "items": [
    {
      "name": "Dr. Zulkifli Hasan",
      "role": "Minister in the Prime Minister''s Department (Religious Affairs), Malaysia",
      "review": "I''m a coffee enthusiast, and I rarely return to the same café two days in a row. After trying the coffee yesterday, I came back again today—it really is that good.",
      "avatarSrc": "/assets/reviews/dr-zulkifli-hasan.webp",
      "videoSrc": "/assets/reviews/dr-zulkifli-hasan.mp4"
    }
  ]
}'::jsonb,
    updated_at = NOW()
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccc07';

-- Republish homepage snapshot so the public CMS API serves the new review.
WITH homepage AS (
    SELECT id
    FROM cms_pages
    WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'
),
next_version AS (
    SELECT COALESCE(MAX(v.version_number), 0) + 1 AS version_number
    FROM cms_versions v
    INNER JOIN homepage h ON h.id = v.page_id
),
inserted AS (
    INSERT INTO cms_versions (id, page_id, version_number, summary, snapshot, published_at)
    SELECT
        'dddddddd-dddd-dddd-dddd-dddddddddd20'::uuid,
        h.id,
        nv.version_number,
        'Homepage guest review: Dr. Zulkifli Hasan',
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
    FROM homepage h
    INNER JOIN cms_pages p ON p.id = h.id
    CROSS JOIN next_version nv
    WHERE NOT EXISTS (
        SELECT 1
        FROM cms_versions existing
        WHERE existing.id = 'dddddddd-dddd-dddd-dddd-dddddddddd20'::uuid
    )
    RETURNING id, page_id
)
UPDATE cms_pages p
SET published_version_id = i.id,
    status = 'published',
    updated_at = NOW()
FROM inserted i
WHERE p.id = i.page_id;
