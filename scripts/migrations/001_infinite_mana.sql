-- Adds "went infinite" flags for lands/rocks/dorks (see schema.sql).
-- Additive only: existing rows get FALSE, existing columns are untouched.
-- Run against the UNPOOLED connection string (DATABASE_URL_UNPOOLED), and
-- BEFORE deploying the main.py that reads/writes these columns.
ALTER TABLE game_performance
    ADD COLUMN IF NOT EXISTS lands_infinite BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS rocks_infinite BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS dorks_infinite BOOLEAN NOT NULL DEFAULT FALSE;
