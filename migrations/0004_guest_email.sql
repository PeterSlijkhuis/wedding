-- Step 3: guest email addresses, for the guest list now and invitations later.
ALTER TABLE guests ADD COLUMN email TEXT NOT NULL DEFAULT '';
