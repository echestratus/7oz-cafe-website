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
