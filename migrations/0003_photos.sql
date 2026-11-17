-- Ordered list of photo ids. The image bytes are in the PHOTOS KV namespace under "photo:<id>".
CREATE TABLE photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT
);
