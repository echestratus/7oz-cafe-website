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
