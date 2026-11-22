-- Label each AI call and record the tokens it charged, to follow cost per user and per kind of work.
ALTER TABLE "ai_calls" ADD COLUMN "kind" TEXT,
ADD COLUMN "billed" INTEGER;

CREATE INDEX "ai_calls_user_id_kind_created_at_idx" ON "ai_calls"("user_id", "kind", "created_at" DESC);
