UPDATE cms_pages
SET published_version_id = NULL
WHERE slug IN ('homepage', 'about', 'footer', 'contact');

DELETE FROM cms_versions
WHERE page_id IN (
    SELECT id FROM cms_pages WHERE slug IN ('homepage', 'about', 'footer', 'contact')
);

DELETE FROM cms_contents
WHERE section_id IN (
    SELECT s.id
    FROM cms_sections s
    INNER JOIN cms_pages p ON p.id = s.page_id
    WHERE p.slug IN ('homepage', 'about', 'footer', 'contact')
);

DELETE FROM cms_sections
WHERE page_id IN (
    SELECT id FROM cms_pages WHERE slug IN ('homepage', 'about', 'footer', 'contact')
);

DELETE FROM cms_pages
WHERE slug IN ('homepage', 'about', 'footer', 'contact');
