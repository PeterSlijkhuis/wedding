-- Key/value store for site-wide settings (guest password hash, session secret, later: names, date, theme).
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
