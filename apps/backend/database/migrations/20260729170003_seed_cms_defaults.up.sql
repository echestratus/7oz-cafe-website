-- Seed default CMS pages, sections, draft content, and initial published versions.
-- Fixed UUIDs keep local/dev environments deterministic.

INSERT INTO cms_pages (id, slug, title, status, seo) VALUES
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'homepage',
    'Homepage',
    'published',
    '{"metaTitle":"7Oz Espresso Cafe","metaDescription":"Premium espresso and cafe experience.","canonicalPath":"/"}'::jsonb
),
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    'about',
    'About',
    'published',
    '{"metaTitle":"About 7Oz","metaDescription":"Our story, craft, and cafe philosophy.","canonicalPath":"/about"}'::jsonb
),
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    'footer',
    'Footer',
    'published',
    '{}'::jsonb
),
(
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
    'contact',
    'Contact',
    'published',
    '{"metaTitle":"Contact 7Oz","metaDescription":"Visit, call, or message 7Oz Espresso Cafe.","canonicalPath":"/contact"}'::jsonb
);

INSERT INTO cms_sections (id, page_id, code, label, is_enabled, sort_order) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'hero', 'Hero', TRUE, 10),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'featured_menu', 'Featured Menu', TRUE, 20),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'about_preview', 'About Preview', TRUE, 30),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb04', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'gallery_preview', 'Gallery Preview', TRUE, 40),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb05', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'membership_promo', 'Membership Promotion', TRUE, 50),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb06', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'reservation_cta', 'Reservation CTA', TRUE, 60),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb07', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'testimonials', 'Testimonials', TRUE, 70),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb11', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'story', 'Story', TRUE, 10),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb12', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'values', 'Values', TRUE, 20),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb21', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'footer_main', 'Footer Main', TRUE, 10),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb22', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'social_links', 'Social Links', TRUE, 20),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb31', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 'contact_info', 'Contact Information', TRUE, 10),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb32', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4', 'business_hours', 'Business Hours', TRUE, 20);

INSERT INTO cms_contents (id, section_id, data) VALUES
('cccccccc-cccc-cccc-cccc-cccccccccc01', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', '{"title":"7Oz Espresso Cafe","subtitle":"Crafted espresso. Calm spaces. Timeless ritual.","ctaPrimary":{"label":"Reserve a Table","href":"/reservations"},"ctaSecondary":{"label":"Explore Menu","href":"/menu"},"overlayOpacity":0.35}'::jsonb),
('cccccccc-cccc-cccc-cccc-cccccccccc02', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02', '{"heading":"Signature Selections","description":"A curated taste of our espresso and pastry craft.","itemSlugs":[]}'::jsonb),
('cccccccc-cccc-cccc-cccc-cccccccccc03', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03', '{"heading":"Our Craft","description":"We roast and pull with intention—seven ounces of focus in every cup.","cta":{"label":"Our Story","href":"/about"}}'::jsonb),
('cccccccc-cccc-cccc-cccc-cccccccccc04', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb04', '{"heading":"Gallery","description":"Moments from the cafe floor.","limit":6}'::jsonb),
('cccccccc-cccc-cccc-cccc-cccccccccc05', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb05', '{"heading":"Membership","description":"Join for priority reservations and member rewards.","cta":{"label":"Become a Member","href":"/membership"}}'::jsonb),
('cccccccc-cccc-cccc-cccc-cccccccccc06', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb06', '{"heading":"Reserve Your Spot","description":"Book a table for coffee, conversation, and quiet hours.","cta":{"label":"Book Now","href":"/reservations"}}'::jsonb),
('cccccccc-cccc-cccc-cccc-cccccccccc07', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb07', '{"heading":"Guest Voices","items":[]}'::jsonb),
('cccccccc-cccc-cccc-cccc-cccccccccc11', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb11', '{"heading":"Our Story","body":"7Oz began with a simple idea: every espresso deserves calm attention.","imageMediaId":null}'::jsonb),
('cccccccc-cccc-cccc-cccc-cccccccccc12', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb12', '{"heading":"Values","items":[{"title":"Craft","body":"Precision in every extraction."},{"title":"Warmth","body":"A welcoming room for every guest."},{"title":"Clarity","body":"Honest ingredients, honest service."}]}'::jsonb),
('cccccccc-cccc-cccc-cccc-cccccccccc21', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb21', '{"tagline":"Seven ounces of care.","links":[{"label":"Menu","href":"/menu"},{"label":"About","href":"/about"},{"label":"Contact","href":"/contact"}],"copyright":"© 7Oz Espresso Cafe"}'::jsonb),
('cccccccc-cccc-cccc-cccc-cccccccccc22', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb22', '{"instagram":"","facebook":"","tiktok":""}'::jsonb),
('cccccccc-cccc-cccc-cccc-cccccccccc31', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb31', '{"address":"","phone":"","whatsapp":"","email":"hello@7oz.local","mapsUrl":"","reservationContact":""}'::jsonb),
('cccccccc-cccc-cccc-cccc-cccccccccc32', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb32', '{"timezone":"Asia/Jakarta","weekly":[{"day":"monday","open":"08:00","close":"21:00"},{"day":"tuesday","open":"08:00","close":"21:00"},{"day":"wednesday","open":"08:00","close":"21:00"},{"day":"thursday","open":"08:00","close":"21:00"},{"day":"friday","open":"08:00","close":"22:00"},{"day":"saturday","open":"09:00","close":"22:00"},{"day":"sunday","open":"09:00","close":"20:00"}],"holidays":[]}'::jsonb);

INSERT INTO cms_versions (id, page_id, version_number, summary, snapshot, published_at)
SELECT
    v.id,
    p.id,
    1,
    'Initial seed publish',
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
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'::uuid, 'dddddddd-dddd-dddd-dddd-ddddddddddd1'::uuid),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'::uuid, 'dddddddd-dddd-dddd-dddd-ddddddddddd2'::uuid),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3'::uuid, 'dddddddd-dddd-dddd-dddd-ddddddddddd3'::uuid),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4'::uuid, 'dddddddd-dddd-dddd-dddd-ddddddddddd4'::uuid)
) AS v(page_id, id) ON v.page_id = p.id;

UPDATE cms_pages p
SET published_version_id = v.id,
    status = 'published',
    updated_at = NOW()
FROM cms_versions v
WHERE v.page_id = p.id
  AND v.version_number = 1;
