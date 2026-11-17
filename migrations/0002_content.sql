-- Editable text pages, one row per page and language.
CREATE TABLE pages (
  slug TEXT NOT NULL,
  lang TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  PRIMARY KEY (slug, lang)
);

-- A party is one invitation (a household or couple). RSVP is answered per party.
CREATE TABLE parties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  note TEXT NOT NULL DEFAULT '',
  responded_at TEXT
);

CREATE TABLE guests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  party_id INTEGER NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_key TEXT NOT NULL,          -- lowercase, accent-free, used for search
  attending INTEGER,               -- NULL = not answered, 1 = yes, 0 = no
  meal TEXT NOT NULL DEFAULT '',
  dietary TEXT NOT NULL DEFAULT ''
);
CREATE INDEX guests_party ON guests(party_id);
