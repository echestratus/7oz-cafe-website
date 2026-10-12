-- Tashkent City has closed. Hadith Hotel in Samarkand is the open flagship.

UPDATE cms_contents
SET data = jsonb_set(
        jsonb_set(
            data,
            '{heading}',
            '"From Jakarta to Samarkand"'
        ),
        '{description}',
        '"The Tashkent City room has closed. 7Oz is now open at Hadith Hotel in Samarkand — the same Indonesian coffee, in a new room."'
    ),
    updated_at = NOW()
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccc03';

UPDATE cms_contents
SET data = jsonb_set(
        data,
        '{description}',
        '"The Hadith Hotel room in Samarkand — and a door into every 7Oz cafe."'
    ),
    updated_at = NOW()
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccc04';

UPDATE cms_contents
SET data = jsonb_set(
        data,
        '{body}',
        to_jsonb($body$7oz Espresso was born from a passionate mission to bring the rich heritage of Indonesian coffee to the global stage. Originating from our roots in Jakarta, we opened in Tashkent City. That room has now closed. We are pouring at Hadith Hotel in Samarkand, Uzbekistan. The name "7oz" represents the ideal volume for a perfect cup — a symbol of our uncompromising commitment to excellence.

We believe that extraordinary coffee starts at the source. That is why we exclusively select the finest Indonesian coffee beans, then elevate these authentic flavors with modern equipment and premium presentation.

Crafted by experienced baristas, every drop we pour delivers a refined tasting experience. More than just a cafe, 7oz Espresso is where craftsmanship and connection meet.$body$::text)
    ),
    updated_at = NOW()
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccc11';

UPDATE cms_contents
SET data = jsonb_set(
        data,
        '{address}',
        '"Hadith Hotel, Imam Bukhari Complex, Xoʻja Ismoil, Samarkand, Uzbekistan"'
    ),
    updated_at = NOW()
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccc31';

INSERT INTO gallery_items (
    id, image_url, media_id, location_slug, category, alt_text, caption, sort_order, is_visible
) VALUES
    (
        'a3000000-0000-4000-8000-000000000001',
        '/assets/gallery/hadith-hotel/1-exterior.webp',
        NULL,
        'hadith-hotel',
        'exterior',
        'Exterior of 7Oz Espresso Cafe at Hadith Hotel, Samarkand',
        'Exterior',
        10,
        TRUE
    ),
    (
        'a3000000-0000-4000-8000-000000000002',
        '/assets/gallery/hadith-hotel/2-dining-room.webp',
        NULL,
        'hadith-hotel',
        'interior',
        'Dining room at 7Oz Espresso Cafe, Hadith Hotel, Samarkand',
        'Dining room',
        20,
        TRUE
    ),
    (
        'a3000000-0000-4000-8000-000000000003',
        '/assets/gallery/hadith-hotel/3-counter.webp',
        NULL,
        'hadith-hotel',
        'interior',
        'Counter at 7Oz Espresso Cafe, Hadith Hotel, Samarkand',
        'Counter',
        30,
        TRUE
    )
ON CONFLICT (id) DO NOTHING;

WITH pages AS (
    SELECT
        p.id AS page_id,
        CASE p.id
            WHEN 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'::uuid THEN 'dddddddd-dddd-dddd-dddd-dddddddddd25'::uuid
            WHEN 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'::uuid THEN 'dddddddd-dddd-dddd-dddd-dddddddddd26'::uuid
            ELSE 'dddddddd-dddd-dddd-dddd-dddddddddd27'::uuid
        END AS version_id,
        'Flagship cafe moved to Hadith Hotel, Samarkand' AS summary
    FROM cms_pages p
    WHERE p.id IN (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'::uuid,
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'::uuid,
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4'::uuid
    )
),
numbered AS (
    SELECT
        pages.page_id,
        pages.version_id,
        pages.summary,
        COALESCE((
            SELECT MAX(v.version_number)
            FROM cms_versions v
            WHERE v.page_id = pages.page_id
        ), 0) + 1 AS version_number
    FROM pages
),
inserted AS (
    INSERT INTO cms_versions (id, page_id, version_number, summary, snapshot, published_at)
    SELECT
        n.version_id,
        p.id,
        n.version_number,
        n.summary,
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
    FROM numbered n
    INNER JOIN cms_pages p ON p.id = n.page_id
    WHERE NOT EXISTS (
        SELECT 1
        FROM cms_versions existing
        WHERE existing.id = n.version_id
    )
    RETURNING id, page_id
)
UPDATE cms_pages p
SET published_version_id = i.id,
    status = 'published',
    updated_at = NOW()
FROM inserted i
WHERE p.id = i.page_id;
