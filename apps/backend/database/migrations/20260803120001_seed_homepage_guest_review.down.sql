-- Revert homepage guest review seed.

UPDATE cms_sections
SET sort_order = 70,
    updated_at = NOW()
WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb07';

UPDATE cms_contents
SET data = '{"heading":"Guest Voices","items":[]}'::jsonb,
    updated_at = NOW()
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccc07';

UPDATE cms_pages
SET published_version_id = (
        SELECT v.id
        FROM cms_versions v
        WHERE v.page_id = cms_pages.id
          AND v.id <> 'dddddddd-dddd-dddd-dddd-dddddddddd20'::uuid
        ORDER BY v.version_number DESC
        LIMIT 1
    ),
    updated_at = NOW()
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'
  AND published_version_id = 'dddddddd-dddd-dddd-dddd-dddddddddd20'::uuid;

DELETE FROM cms_versions
WHERE id = 'dddddddd-dddd-dddd-dddd-dddddddddd20'::uuid;
