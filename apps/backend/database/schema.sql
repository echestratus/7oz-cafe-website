CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE roles (
    id UUID PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_roles_code UNIQUE (code)
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_permissions_code UNIQUE (code)
);

CREATE TABLE role_permissions (
    role_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_role_permissions PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_role_permissions_roles FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_permissions FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE
);

CREATE INDEX idx_role_permissions_permission_id ON role_permissions (permission_id);

CREATE TABLE users (
    id UUID PRIMARY KEY,
    email CITEXT NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    status TEXT NOT NULL,
    email_verified_at TIMESTAMPTZ NULL,
    last_login_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT ck_users_status CHECK (status IN ('pending_verification', 'active', 'inactive', 'suspended'))
);

CREATE INDEX idx_users_status ON users (status) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_deleted_at ON users (deleted_at);

CREATE TABLE user_roles (
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_user_roles PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_roles FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE
);

CREATE INDEX idx_user_roles_role_id ON user_roles (role_id);

CREATE TABLE sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    refresh_token_hash TEXT NOT NULL,
    user_agent TEXT NOT NULL DEFAULT '',
    ip_address TEXT NOT NULL DEFAULT '',
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ NULL,
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_sessions_refresh_token_hash UNIQUE (refresh_token_hash),
    CONSTRAINT fk_sessions_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_user_id ON sessions (user_id);
CREATE INDEX idx_sessions_expires_at ON sessions (expires_at);
CREATE INDEX idx_sessions_user_id_active ON sessions (user_id) WHERE revoked_at IS NULL;

CREATE TABLE auth_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    token_hash TEXT NOT NULL,
    purpose TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_auth_tokens_token_hash UNIQUE (token_hash),
    CONSTRAINT ck_auth_tokens_purpose CHECK (purpose IN ('email_verification', 'password_reset')),
    CONSTRAINT fk_auth_tokens_users FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_auth_tokens_user_id ON auth_tokens (user_id);
CREATE INDEX idx_auth_tokens_purpose_expires_at ON auth_tokens (purpose, expires_at);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    actor_user_id UUID NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT NULL,
    ip_address TEXT NOT NULL DEFAULT '',
    user_agent TEXT NOT NULL DEFAULT '',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_audit_logs_users FOREIGN KEY (actor_user_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX idx_audit_logs_actor_user_id ON audit_logs (actor_user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs (action);
CREATE INDEX idx_audit_logs_resource ON audit_logs (resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs (created_at DESC);

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
