-- One welcome gift per normalized mailbox; the claim outlives the account (no FK to auth.users).
CREATE TABLE "ai_welcome_claims" (
    "mailbox" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "claimed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_welcome_claims_pkey" PRIMARY KEY ("mailbox")
);

ALTER TABLE "ai_welcome_claims" ENABLE ROW LEVEL SECURITY;

-- Hand-written: backfill from accounts that already took the gift (the oldest keeps the claim).
-- The mailbox rule mirrors mailboxKey() in the API. auth.users only exists on Supabase.
DO $$
BEGIN
  IF to_regclass('auth.users') IS NOT NULL THEN
    EXECUTE $q$
      INSERT INTO ai_welcome_claims (mailbox, user_id, claimed_at)
      SELECT DISTINCT ON (mailbox) mailbox, user_id, claimed_at
      FROM (
        SELECT
          CASE WHEN d IN ('gmail.com', 'googlemail.com')
               THEN replace(split_part(l, '+', 1), '.', '') || '@gmail.com'
               ELSE split_part(l, '+', 1) || '@' || d END AS mailbox,
          user_id, claimed_at
        FROM (
          SELECT c.user_id, c.updated_at AS claimed_at,
                 split_part(lower(btrim(u.email)), '@', 1) AS l,
                 split_part(lower(btrim(u.email)), '@', 2) AS d
          FROM ai_credits c
          JOIN auth.users u ON u.id = c.user_id
          WHERE u.email IS NOT NULL AND position('@' IN u.email) >= 2
        ) parts
      ) keyed
      ORDER BY mailbox, claimed_at, user_id
      ON CONFLICT (mailbox) DO NOTHING
    $q$;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
     AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE ai_welcome_claims FROM anon, authenticated;
  END IF;
END
$$;
