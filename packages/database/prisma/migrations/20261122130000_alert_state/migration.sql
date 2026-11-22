-- Last time each alert kind was sent (cooldown memory for the Telegram alert bot).
CREATE TABLE "alert_state" (
    "kind" TEXT NOT NULL,
    "last_sent_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_state_pkey" PRIMARY KEY ("kind")
);

ALTER TABLE "alert_state" ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
     AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE alert_state FROM anon, authenticated;
  END IF;
END
$$;
