-- Step 3b: invitation emails sent through Resend and what happened to them.
ALTER TABLE guests ADD COLUMN email_id TEXT NOT NULL DEFAULT '';      -- Resend's id, matches webhook events to the guest
ALTER TABLE guests ADD COLUMN email_status TEXT NOT NULL DEFAULT '';  -- sent, delivered, opened, clicked, bounced, complained
ALTER TABLE guests ADD COLUMN email_at TEXT;                           -- when the status last changed (UTC)
CREATE INDEX guests_email_id ON guests(email_id);
