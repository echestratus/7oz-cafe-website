CREATE TABLE blog_posts (
    id UUID PRIMARY KEY,
    slug TEXT NOT NULL,
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    kind TEXT NOT NULL DEFAULT 'news',
    cover_url TEXT NULL,
    cover_media_id UUID NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    published_at TIMESTAMPTZ NULL,
    seo JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_blog_posts_slug UNIQUE (slug),
    CONSTRAINT ck_blog_posts_kind CHECK (kind IN ('news', 'event')),
    CONSTRAINT ck_blog_posts_status CHECK (status IN ('draft', 'published', 'archived')),
    CONSTRAINT fk_blog_posts_cover_media FOREIGN KEY (cover_media_id) REFERENCES media_assets (id) ON DELETE SET NULL
);

CREATE INDEX idx_blog_posts_status ON blog_posts (status) WHERE deleted_at IS NULL;
CREATE INDEX idx_blog_posts_published_at ON blog_posts (published_at DESC) WHERE deleted_at IS NULL AND status = 'published';
CREATE INDEX idx_blog_posts_kind ON blog_posts (kind) WHERE deleted_at IS NULL;
CREATE INDEX idx_blog_posts_deleted_at ON blog_posts (deleted_at);
