-- All timestamps are Unix epoch milliseconds (UTC).

CREATE TABLE IF NOT EXISTS events (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  name             TEXT    NOT NULL,
  description      TEXT    NOT NULL DEFAULT '',
  starts_at        INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL,
  ends_at          INTEGER NOT NULL,
  capacity         INTEGER NOT NULL,
  created_at       INTEGER NOT NULL,
  updated_at       INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_ends_at ON events (ends_at);

CREATE TABLE IF NOT EXISTS reservations (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id   INTEGER NOT NULL REFERENCES events (id) ON DELETE CASCADE,
  name       TEXT    NOT NULL,
  email      TEXT    NOT NULL,
  phone      TEXT    NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE (event_id, email)
);
