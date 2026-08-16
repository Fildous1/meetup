-- Cloudflare D1 (SQLite) — schéma aplikace MeetUp.
--
-- Aplikace lokálně:  npm run db:setup
-- Produkce:          npm run db:setup:remote

CREATE TABLE IF NOT EXISTS events (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    code          TEXT NOT NULL UNIQUE,
    name          TEXT NOT NULL,
    description   TEXT,
    creator_name  TEXT,
    creator_email TEXT,
    date_from     TEXT NOT NULL,
    date_to       TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS responses (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id         INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    participant_name TEXT NOT NULL,
    availability     TEXT NOT NULL,
    comment          TEXT,
    updated_at       TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (event_id, participant_name)
);

CREATE INDEX IF NOT EXISTS idx_responses_event ON responses(event_id);
