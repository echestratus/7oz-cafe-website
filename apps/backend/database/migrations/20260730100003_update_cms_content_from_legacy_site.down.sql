DELETE FROM cms_versions
WHERE summary = 'Legacy site content sync';

-- Restore published_version_id to version 1 for seeded pages when present.
UPDATE cms_pages p
SET published_version_id = v.id,
    updated_at = NOW()
FROM cms_versions v
WHERE v.page_id = p.id
  AND v.version_number = 1
  AND p.slug IN ('homepage', 'about', 'footer', 'contact');

DELETE FROM cms_contents WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccc08';
DELETE FROM cms_sections WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb08';

UPDATE cms_contents
SET data = '{"heading":"Our Craft","description":"We roast and pull with intention—seven ounces of focus in every cup.","cta":{"label":"Our Story","href":"/about"}}'::jsonb,
    updated_at = NOW()
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccc03';

UPDATE cms_contents
SET data = '{"heading":"Our Story","body":"7Oz began with a simple idea: every espresso deserves calm attention.","imageMediaId":null}'::jsonb,
    updated_at = NOW()
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccc11';

UPDATE cms_contents
SET data = '{"heading":"Values","items":[{"title":"Craft","body":"Precision in every extraction."},{"title":"Warmth","body":"A welcoming room for every guest."},{"title":"Clarity","body":"Honest ingredients, honest service."}]}'::jsonb,
    updated_at = NOW()
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccc12';

UPDATE cms_contents
SET data = '{"tagline":"Seven ounces of care.","links":[{"label":"Menu","href":"/menu"},{"label":"About","href":"/about"},{"label":"Contact","href":"/contact"}],"copyright":"© 7Oz Espresso Cafe"}'::jsonb,
    updated_at = NOW()
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccc21';

UPDATE cms_contents
SET data = '{"address":"","phone":"","whatsapp":"","email":"hello@7oz.local","mapsUrl":"","reservationContact":""}'::jsonb,
    updated_at = NOW()
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccc31';

UPDATE cms_contents
SET data = '{"timezone":"Asia/Jakarta","weekly":[{"day":"monday","open":"08:00","close":"21:00"},{"day":"tuesday","open":"08:00","close":"21:00"},{"day":"wednesday","open":"08:00","close":"21:00"},{"day":"thursday","open":"08:00","close":"21:00"},{"day":"friday","open":"08:00","close":"22:00"},{"day":"saturday","open":"09:00","close":"22:00"},{"day":"sunday","open":"09:00","close":"20:00"}],"holidays":[]}'::jsonb,
    updated_at = NOW()
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccc32';
