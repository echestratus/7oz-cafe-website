CREATE TABLE gallery_items (
    id UUID PRIMARY KEY,
    image_url TEXT NOT NULL,
    media_id UUID NULL,
    location_slug TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'atmosphere',
    alt_text TEXT NOT NULL DEFAULT '',
    caption TEXT NOT NULL DEFAULT '',
    sort_order INT NOT NULL DEFAULT 0,
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_gallery_items_media FOREIGN KEY (media_id) REFERENCES media_assets (id) ON DELETE SET NULL,
    CONSTRAINT ck_gallery_items_category CHECK (
        category IN ('atmosphere', 'interior', 'exterior', 'coffee', 'food', 'events')
    ),
    CONSTRAINT ck_gallery_items_image_url CHECK (char_length(trim(image_url)) > 0),
    CONSTRAINT ck_gallery_items_location_slug CHECK (char_length(trim(location_slug)) > 0)
);

CREATE INDEX idx_gallery_items_location_visible
    ON gallery_items (location_slug, sort_order, created_at)
    WHERE deleted_at IS NULL AND is_visible = TRUE;

CREATE INDEX idx_gallery_items_admin_location
    ON gallery_items (location_slug, sort_order, created_at DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_gallery_items_media_id ON gallery_items (media_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_gallery_items_deleted_at ON gallery_items (deleted_at);
