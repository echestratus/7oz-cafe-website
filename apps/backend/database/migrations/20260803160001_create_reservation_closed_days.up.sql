CREATE TABLE reservation_closed_days (
    id UUID PRIMARY KEY,
    closed_date DATE NOT NULL,
    label TEXT NOT NULL DEFAULT '',
    note TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_reservation_closed_days_date UNIQUE (closed_date)
);

CREATE INDEX idx_reservation_closed_days_date ON reservation_closed_days (closed_date);
