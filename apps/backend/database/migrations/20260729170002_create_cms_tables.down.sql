ALTER TABLE cms_pages DROP CONSTRAINT IF EXISTS fk_cms_pages_published_version;
DROP TABLE IF EXISTS cms_versions;
DROP TABLE IF EXISTS cms_contents;
DROP TABLE IF EXISTS cms_sections;
DROP TABLE IF EXISTS cms_pages;
