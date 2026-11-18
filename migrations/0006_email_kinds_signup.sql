-- Step 3c: save the date, invitation and thank-you emails tracked separately; guests can sign themselves up.
CREATE TABLE emails (
  guest_id INTEGER NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,                 -- savedate, invitation, thanks
  resend_id TEXT NOT NULL DEFAULT '', -- Resend's id, matches webhook events
  status TEXT NOT NULL DEFAULT '',    -- sent, delivered, opened, clicked, bounced, complained
  at TEXT,                            -- when the status last changed (UTC)
  PRIMARY KEY (guest_id, kind)
);
CREATE INDEX emails_resend ON emails(resend_id);
INSERT INTO emails (guest_id, kind, resend_id, status, at)
  SELECT id, 'invitation', email_id, email_status, email_at FROM guests WHERE email_id != '';
DROP INDEX guests_email_id;
ALTER TABLE guests DROP COLUMN email_id;
ALTER TABLE guests DROP COLUMN email_status;
ALTER TABLE guests DROP COLUMN email_at;
ALTER TABLE parties ADD COLUMN source TEXT NOT NULL DEFAULT '';  -- 'signup' when the guests added themselves
ALTER TABLE parties ADD COLUMN created_at TEXT;
