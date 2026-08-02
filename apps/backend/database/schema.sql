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

CREATE TABLE reservation_settings (
    id UUID PRIMARY KEY,
    min_guests INTEGER NOT NULL DEFAULT 1,
    max_guests INTEGER NOT NULL DEFAULT 12,
    min_advance_minutes INTEGER NOT NULL DEFAULT 30,
    max_advance_days INTEGER NOT NULL DEFAULT 30,
    slot_interval_minutes INTEGER NOT NULL DEFAULT 30,
    duration_minutes INTEGER NOT NULL DEFAULT 90,
    buffer_minutes INTEGER NOT NULL DEFAULT 15,
    cancel_cutoff_minutes INTEGER NOT NULL DEFAULT 120,
    timezone TEXT NOT NULL DEFAULT 'Asia/Jakarta',
    weekly_hours JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_reservation_settings_min_guests CHECK (min_guests >= 1),
    CONSTRAINT ck_reservation_settings_max_guests CHECK (max_guests >= min_guests),
    CONSTRAINT ck_reservation_settings_advance CHECK (min_advance_minutes >= 0 AND max_advance_days >= 1),
    CONSTRAINT ck_reservation_settings_slot CHECK (slot_interval_minutes > 0),
    CONSTRAINT ck_reservation_settings_duration CHECK (duration_minutes > 0),
    CONSTRAINT ck_reservation_settings_buffer CHECK (buffer_minutes >= 0),
    CONSTRAINT ck_reservation_settings_cancel CHECK (cancel_cutoff_minutes >= 0)
);

CREATE TABLE cafe_tables (
    id UUID PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_cafe_tables_code UNIQUE (code),
    CONSTRAINT ck_cafe_tables_capacity CHECK (capacity >= 1)
);

CREATE INDEX idx_cafe_tables_active ON cafe_tables (is_active, sort_order) WHERE deleted_at IS NULL;

CREATE TABLE reservations (
    id UUID PRIMARY KEY,
    reservation_number TEXT NOT NULL,
    customer_user_id UUID NULL,
    guest_full_name TEXT NOT NULL,
    guest_email CITEXT NOT NULL,
    guest_phone TEXT NOT NULL,
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    guest_count INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    notes TEXT NOT NULL DEFAULT '',
    table_id UUID NULL,
    cancelled_at TIMESTAMPTZ NULL,
    cancel_reason TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_reservations_reservation_number UNIQUE (reservation_number),
    CONSTRAINT ck_reservations_guest_count CHECK (guest_count >= 1),
    CONSTRAINT ck_reservations_status CHECK (
        status IN ('pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show')
    ),
    CONSTRAINT fk_reservations_customer FOREIGN KEY (customer_user_id) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT fk_reservations_table FOREIGN KEY (table_id) REFERENCES cafe_tables (id) ON DELETE SET NULL
);

CREATE INDEX idx_reservations_date_time ON reservations (reservation_date, reservation_time)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_reservations_status ON reservations (status) WHERE deleted_at IS NULL;
CREATE INDEX idx_reservations_customer_user_id ON reservations (customer_user_id)
    WHERE deleted_at IS NULL AND customer_user_id IS NOT NULL;
CREATE INDEX idx_reservations_guest_email ON reservations (guest_email) WHERE deleted_at IS NULL;
CREATE INDEX idx_reservations_created_at ON reservations (created_at DESC);

CREATE TABLE reservation_histories (
    id UUID PRIMARY KEY,
    reservation_id UUID NOT NULL,
    from_status TEXT NULL,
    to_status TEXT NOT NULL,
    actor_user_id UUID NULL,
    note TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_reservation_histories_reservation FOREIGN KEY (reservation_id) REFERENCES reservations (id) ON DELETE CASCADE,
    CONSTRAINT fk_reservation_histories_actor FOREIGN KEY (actor_user_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX idx_reservation_histories_reservation_id ON reservation_histories (reservation_id, created_at DESC);

CREATE TABLE membership_levels (
    id UUID PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    rank INTEGER NOT NULL,
    qualification_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_membership_levels_code UNIQUE (code),
    CONSTRAINT uq_membership_levels_rank UNIQUE (rank),
    CONSTRAINT ck_membership_levels_rank CHECK (rank >= 0)
);

CREATE INDEX idx_membership_levels_active ON membership_levels (is_active, sort_order)
    WHERE deleted_at IS NULL;

CREATE TABLE membership_benefits (
    id UUID PRIMARY KEY,
    level_id UUID NULL,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_membership_benefits_code UNIQUE (code),
    CONSTRAINT fk_membership_benefits_level FOREIGN KEY (level_id) REFERENCES membership_levels (id) ON DELETE CASCADE
);

CREATE INDEX idx_membership_benefits_level ON membership_benefits (level_id, sort_order)
    WHERE deleted_at IS NULL;

CREATE TABLE memberships (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    membership_number TEXT NOT NULL,
    level_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    qr_token TEXT NOT NULL,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_memberships_user_id UNIQUE (user_id),
    CONSTRAINT uq_memberships_membership_number UNIQUE (membership_number),
    CONSTRAINT uq_memberships_qr_token UNIQUE (qr_token),
    CONSTRAINT ck_memberships_status CHECK (status IN ('active', 'inactive', 'suspended', 'expired')),
    CONSTRAINT fk_memberships_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_memberships_level FOREIGN KEY (level_id) REFERENCES membership_levels (id)
);

CREATE INDEX idx_memberships_status ON memberships (status) WHERE deleted_at IS NULL;
CREATE INDEX idx_memberships_level_id ON memberships (level_id) WHERE deleted_at IS NULL;

CREATE TABLE membership_histories (
    id UUID PRIMARY KEY,
    membership_id UUID NOT NULL,
    from_level_id UUID NULL,
    to_level_id UUID NOT NULL,
    from_status TEXT NULL,
    to_status TEXT NULL,
    reason TEXT NOT NULL DEFAULT '',
    trigger_source TEXT NOT NULL DEFAULT 'system',
    actor_user_id UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_membership_histories_membership FOREIGN KEY (membership_id) REFERENCES memberships (id) ON DELETE CASCADE,
    CONSTRAINT fk_membership_histories_from_level FOREIGN KEY (from_level_id) REFERENCES membership_levels (id),
    CONSTRAINT fk_membership_histories_to_level FOREIGN KEY (to_level_id) REFERENCES membership_levels (id),
    CONSTRAINT fk_membership_histories_actor FOREIGN KEY (actor_user_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX idx_membership_histories_membership_id ON membership_histories (membership_id, created_at DESC);
CREATE TABLE loyalty_settings (
    id UUID PRIMARY KEY,
    points_per_completed_reservation INTEGER NOT NULL DEFAULT 50,
    expiration_strategy TEXT NOT NULL DEFAULT 'never',
    expiration_months INTEGER NOT NULL DEFAULT 12,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_loyalty_settings_points CHECK (points_per_completed_reservation >= 0),
    CONSTRAINT ck_loyalty_settings_expiration_strategy CHECK (
        expiration_strategy IN ('never', 'rolling_months')
    ),
    CONSTRAINT ck_loyalty_settings_expiration_months CHECK (expiration_months >= 1)
);

CREATE TABLE loyalty_accounts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    balance INTEGER NOT NULL DEFAULT 0,
    lifetime_earned INTEGER NOT NULL DEFAULT 0,
    lifetime_redeemed INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_loyalty_accounts_user_id UNIQUE (user_id),
    CONSTRAINT ck_loyalty_accounts_balance CHECK (balance >= 0),
    CONSTRAINT ck_loyalty_accounts_lifetime_earned CHECK (lifetime_earned >= 0),
    CONSTRAINT ck_loyalty_accounts_lifetime_redeemed CHECK (lifetime_redeemed >= 0),
    CONSTRAINT fk_loyalty_accounts_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_loyalty_accounts_balance ON loyalty_accounts (balance DESC) WHERE deleted_at IS NULL;

CREATE TABLE loyalty_campaigns (
    id UUID PRIMARY KEY,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    point_multiplier NUMERIC(6,2) NOT NULL DEFAULT 1.00,
    bonus_points INTEGER NOT NULL DEFAULT 0,
    eligible_level_codes JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_loyalty_campaigns_code UNIQUE (code),
    CONSTRAINT ck_loyalty_campaigns_window CHECK (ends_at > starts_at),
    CONSTRAINT ck_loyalty_campaigns_multiplier CHECK (point_multiplier > 0),
    CONSTRAINT ck_loyalty_campaigns_bonus CHECK (bonus_points >= 0)
);

CREATE INDEX idx_loyalty_campaigns_active_window ON loyalty_campaigns (is_active, starts_at, ends_at)
    WHERE deleted_at IS NULL;

CREATE TABLE loyalty_transactions (
    id UUID PRIMARY KEY,
    account_id UUID NOT NULL,
    user_id UUID NOT NULL,
    type TEXT NOT NULL,
    points INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    source TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    related_entity_type TEXT NULL,
    related_entity_id UUID NULL,
    campaign_id UUID NULL,
    actor_user_id UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_loyalty_transactions_type CHECK (
        type IN ('earn', 'redeem', 'bonus', 'adjustment', 'expired')
    ),
    CONSTRAINT ck_loyalty_transactions_points CHECK (points <> 0),
    CONSTRAINT ck_loyalty_transactions_balance_after CHECK (balance_after >= 0),
    CONSTRAINT fk_loyalty_transactions_account FOREIGN KEY (account_id) REFERENCES loyalty_accounts (id),
    CONSTRAINT fk_loyalty_transactions_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_loyalty_transactions_campaign FOREIGN KEY (campaign_id) REFERENCES loyalty_campaigns (id),
    CONSTRAINT fk_loyalty_transactions_actor FOREIGN KEY (actor_user_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX uq_loyalty_transactions_source_entity
    ON loyalty_transactions (source, related_entity_type, related_entity_id)
    WHERE related_entity_id IS NOT NULL;

CREATE INDEX idx_loyalty_transactions_user_created
    ON loyalty_transactions (user_id, created_at DESC);
CREATE INDEX idx_loyalty_transactions_account_created
    ON loyalty_transactions (account_id, created_at DESC);

CREATE TABLE loyalty_rewards (
    id UUID PRIMARY KEY,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    points_cost INTEGER NOT NULL,
    stock INTEGER NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_loyalty_rewards_code UNIQUE (code),
    CONSTRAINT ck_loyalty_rewards_points_cost CHECK (points_cost > 0),
    CONSTRAINT ck_loyalty_rewards_stock CHECK (stock IS NULL OR stock >= 0)
);

CREATE INDEX idx_loyalty_rewards_active ON loyalty_rewards (is_active, sort_order)
    WHERE deleted_at IS NULL;

CREATE TABLE loyalty_redemptions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    account_id UUID NOT NULL,
    reward_id UUID NOT NULL,
    transaction_id UUID NOT NULL,
    points_spent INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_loyalty_redemptions_points CHECK (points_spent > 0),
    CONSTRAINT ck_loyalty_redemptions_status CHECK (status IN ('completed', 'cancelled')),
    CONSTRAINT fk_loyalty_redemptions_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_loyalty_redemptions_account FOREIGN KEY (account_id) REFERENCES loyalty_accounts (id),
    CONSTRAINT fk_loyalty_redemptions_reward FOREIGN KEY (reward_id) REFERENCES loyalty_rewards (id),
    CONSTRAINT fk_loyalty_redemptions_transaction FOREIGN KEY (transaction_id) REFERENCES loyalty_transactions (id)
);

CREATE INDEX idx_loyalty_redemptions_user_created ON loyalty_redemptions (user_id, created_at DESC);

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

CREATE TABLE contact_messages (
    id UUID PRIMARY KEY,
    full_name TEXT NOT NULL,
    email CITEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new',
    ip_address TEXT NOT NULL DEFAULT '',
    user_agent TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_contact_messages_status CHECK (status IN ('new', 'read', 'archived')),
    CONSTRAINT ck_contact_messages_message_len CHECK (char_length(message) BETWEEN 1 AND 5000)
);

CREATE INDEX idx_contact_messages_created_at ON contact_messages (created_at DESC);
CREATE INDEX idx_contact_messages_status ON contact_messages (status);
CREATE INDEX idx_contact_messages_email ON contact_messages (email);

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
