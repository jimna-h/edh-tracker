-- Preserve deck records and game history when a deck or its owner is retired.
-- Run against the UNPOOLED connection string (DATABASE_URL_UNPOOLED) before
-- deploying the backend that reads/writes `archived`.
BEGIN;

ALTER TABLE decks
    ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE decks
    DROP CONSTRAINT IF EXISTS decks_owner_id_fkey;

ALTER TABLE decks
    ADD CONSTRAINT decks_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES players(id) ON DELETE RESTRICT;

COMMIT;
