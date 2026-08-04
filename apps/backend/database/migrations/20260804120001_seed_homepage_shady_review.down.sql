-- Revert Shady Al-Suleiman guest review seed.

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

UPDATE cms_pages
SET published_version_id = (
        SELECT v.id
        FROM cms_versions v
        WHERE v.page_id = cms_pages.id
          AND v.id <> 'dddddddd-dddd-dddd-dddd-dddddddddd21'::uuid
        ORDER BY v.version_number DESC
        LIMIT 1
    ),
    updated_at = NOW()
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'
  AND published_version_id = 'dddddddd-dddd-dddd-dddd-dddddddddd21'::uuid;

DELETE FROM cms_versions
WHERE id = 'dddddddd-dddd-dddd-dddd-dddddddddd21'::uuid;
