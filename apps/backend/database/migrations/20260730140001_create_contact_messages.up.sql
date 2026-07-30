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
