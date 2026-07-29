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
