CREATE TABLE media_folders (
    id UUID PRIMARY KEY,
    parent_id UUID NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_media_folders_parent FOREIGN KEY (parent_id) REFERENCES media_folders (id) ON DELETE SET NULL
);

CREATE INDEX idx_media_folders_parent_id ON media_folders (parent_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_media_folders_deleted_at ON media_folders (deleted_at);

CREATE TABLE media_assets (
    id UUID PRIMARY KEY,
    folder_id UUID NULL,
    file_name TEXT NOT NULL,
    storage_key TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes BIGINT NOT NULL DEFAULT 0,
    alt_text TEXT NOT NULL DEFAULT '',
    uploaded_by UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_media_assets_storage_key UNIQUE (storage_key),
    CONSTRAINT fk_media_assets_folder FOREIGN KEY (folder_id) REFERENCES media_folders (id) ON DELETE SET NULL,
    CONSTRAINT fk_media_assets_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT ck_media_assets_size_bytes CHECK (size_bytes >= 0)
);

CREATE INDEX idx_media_assets_folder_id ON media_assets (folder_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_media_assets_uploaded_by ON media_assets (uploaded_by);
CREATE INDEX idx_media_assets_deleted_at ON media_assets (deleted_at);
CREATE INDEX idx_media_assets_created_at ON media_assets (created_at DESC);
