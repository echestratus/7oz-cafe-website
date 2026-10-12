-- Restore Tashkent City as the published flagship copy.

UPDATE cms_contents
SET data = jsonb_set(
        jsonb_set(
            data,
            '{heading}',
            '"From Jakarta to Tashkent"'
        ),
        '{description}',
        '"Jakarta''s finest has arrived in the heart of Tashkent — bringing Indonesian coffee heritage to an international stage."'
    ),
    updated_at = NOW()
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccc03';

UPDATE cms_contents
SET data = jsonb_set(
        data,
        '{description}',
        '"Moments from the cafe floor."'
    ),
    updated_at = NOW()
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccc04';

UPDATE cms_contents
SET data = jsonb_set(
        data,
        '{body}',
        to_jsonb($body$7oz Espresso was born from a passionate mission to bring the rich heritage of Indonesian coffee to the global stage. Originating from our roots in Jakarta, we are now proudly brewing exceptional coffee in the heart of Tashkent, Uzbekistan. The name "7oz" represents the ideal volume for a perfect cup — a symbol of our uncompromising commitment to excellence.

We believe that extraordinary coffee starts at the source. That is why we exclusively select the finest Indonesian coffee beans, then elevate these authentic flavors with modern equipment and premium presentation.

Crafted by experienced baristas, every drop we pour delivers a refined tasting experience. More than just a cafe, 7oz Espresso is where craftsmanship and connection meet.$body$::text)
    ),
    updated_at = NOW()
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccc11';

UPDATE cms_contents
SET data = jsonb_set(
        data,
        '{address}',
        '"City Park, Ukchi ko''chasi 3A, 100011, Tashkent, Uzbekistan"'
    ),
    updated_at = NOW()
WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccc31';

DELETE FROM gallery_items
WHERE id IN (
    'a3000000-0000-4000-8000-000000000001'::uuid,
    'a3000000-0000-4000-8000-000000000002'::uuid,
    'a3000000-0000-4000-8000-000000000003'::uuid
);

UPDATE cms_pages
SET published_version_id = (
        SELECT v.id
        FROM cms_versions v
        WHERE v.page_id = cms_pages.id
          AND v.id NOT IN (
              'dddddddd-dddd-dddd-dddd-dddddddddd25'::uuid,
              'dddddddd-dddd-dddd-dddd-dddddddddd26'::uuid,
              'dddddddd-dddd-dddd-dddd-dddddddddd27'::uuid
          )
        ORDER BY v.version_number DESC
        LIMIT 1
    ),
    updated_at = NOW()
WHERE published_version_id IN (
    'dddddddd-dddd-dddd-dddd-dddddddddd25'::uuid,
    'dddddddd-dddd-dddd-dddd-dddddddddd26'::uuid,
    'dddddddd-dddd-dddd-dddd-dddddddddd27'::uuid
);

DELETE FROM cms_versions
WHERE id IN (
    'dddddddd-dddd-dddd-dddd-dddddddddd25'::uuid,
    'dddddddd-dddd-dddd-dddd-dddddddddd26'::uuid,
    'dddddddd-dddd-dddd-dddd-dddddddddd27'::uuid
);
