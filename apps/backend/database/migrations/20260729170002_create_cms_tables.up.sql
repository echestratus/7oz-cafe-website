CREATE TABLE cms_pages (
    id UUID PRIMARY KEY,
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    seo JSONB NOT NULL DEFAULT '{}'::jsonb,
    published_version_id UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_cms_pages_slug UNIQUE (slug),
    CONSTRAINT ck_cms_pages_status CHECK (status IN ('draft', 'review', 'published', 'archived'))
);

CREATE INDEX idx_cms_pages_status ON cms_pages (status) WHERE deleted_at IS NULL;
CREATE INDEX idx_cms_pages_deleted_at ON cms_pages (deleted_at);

CREATE TABLE cms_sections (
    id UUID PRIMARY KEY,
    page_id UUID NOT NULL,
    code TEXT NOT NULL,
    label TEXT NOT NULL,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_cms_sections_page_code UNIQUE (page_id, code),
    CONSTRAINT fk_cms_sections_page FOREIGN KEY (page_id) REFERENCES cms_pages (id) ON DELETE CASCADE
);

CREATE INDEX idx_cms_sections_page_id ON cms_sections (page_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_cms_sections_sort_order ON cms_sections (page_id, sort_order);

CREATE TABLE cms_contents (
    id UUID PRIMARY KEY,
    section_id UUID NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_by UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_cms_contents_section UNIQUE (section_id),
    CONSTRAINT fk_cms_contents_section FOREIGN KEY (section_id) REFERENCES cms_sections (id) ON DELETE CASCADE,
    CONSTRAINT fk_cms_contents_updated_by FOREIGN KEY (updated_by) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX idx_cms_contents_updated_by ON cms_contents (updated_by);

CREATE TABLE cms_versions (
    id UUID PRIMARY KEY,
    page_id UUID NOT NULL,
    version_number INTEGER NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    snapshot JSONB NOT NULL,
    published_by UUID NULL,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_cms_versions_page_version UNIQUE (page_id, version_number),
    CONSTRAINT ck_cms_versions_version_number CHECK (version_number > 0),
    CONSTRAINT fk_cms_versions_page FOREIGN KEY (page_id) REFERENCES cms_pages (id) ON DELETE CASCADE,
    CONSTRAINT fk_cms_versions_published_by FOREIGN KEY (published_by) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX idx_cms_versions_page_id ON cms_versions (page_id);
CREATE INDEX idx_cms_versions_published_at ON cms_versions (page_id, published_at DESC);

ALTER TABLE cms_pages
    ADD CONSTRAINT fk_cms_pages_published_version
    FOREIGN KEY (published_version_id) REFERENCES cms_versions (id) ON DELETE SET NULL;
