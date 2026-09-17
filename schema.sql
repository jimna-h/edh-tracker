-- Neon Postgres schema for EDH Tracker.
-- Run this once against a fresh Neon database before running
-- scripts/backfill_postgres.py.

CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    pfp_url TEXT NOT NULL DEFAULT '',
    sort_order INT NOT NULL
);

CREATE TABLE decks (
    id SERIAL PRIMARY KEY,
    owner_id INT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    deck_name TEXT NOT NULL,
    art_url TEXT NOT NULL DEFAULT '',
    art_url_partner TEXT NOT NULL DEFAULT '',
    color_id TEXT NOT NULL DEFAULT '',
    exclude BOOLEAN NOT NULL DEFAULT FALSE,
    archidekt TEXT NOT NULL DEFAULT '',
    row_order INT NOT NULL
);

CREATE INDEX idx_decks_owner_id ON decks(owner_id);

CREATE TABLE games (
    id TEXT PRIMARY KEY,
    mulligan_type TEXT NOT NULL DEFAULT '',
    winner_seat_position TEXT,
    winner_player TEXT,
    winner_deck TEXT,
    turn_count INT,
    played_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE game_performance (
    id SERIAL PRIMARY KEY,
    game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    -- NULL means "not a tracked deck" (an ad hoc "Other"/proxy deck typed in at
    -- game time, or a legacy row that couldn't be matched during backfill).
    -- ON DELETE RESTRICT: a deck that has ever been played can't be hard-deleted
    -- (see /players/delete_deck) - it must be excluded instead, so deck_id stays
    -- a stable reference and a deleted-then-recreated same-named deck can never
    -- merge with old history.
    deck_id INT REFERENCES decks(id) ON DELETE RESTRICT,
    player TEXT NOT NULL,
    deck TEXT NOT NULL,
    deck_owner TEXT NOT NULL,
    start_lands INT,
    lands INT,
    rocks INT,
    dorks INT,
    turn_died TEXT,
    seat_position TEXT,
    colors TEXT NOT NULL DEFAULT '',
    art_url TEXT NOT NULL DEFAULT ''
);

CREATE INDEX idx_game_performance_game_id ON game_performance(game_id);
CREATE INDEX idx_game_performance_deck_id ON game_performance(deck_id);
