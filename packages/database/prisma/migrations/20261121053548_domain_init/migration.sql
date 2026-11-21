-- DropIndex
DROP INDEX "articles_search_vector_idx";

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "security_flags" (
    "user_id" UUID NOT NULL,
    "strikes" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ(6),
    "first_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_action" TEXT,
    "last_ip" TEXT,

    CONSTRAINT "security_flags_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "app_settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL DEFAULT '{}',
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "presence" (
    "user_id" UUID NOT NULL,
    "last_seen" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "presence_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "feedback" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID,
    "email" TEXT,
    "message" TEXT NOT NULL,
    "page" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_audit" (
    "id" BIGSERIAL NOT NULL,
    "admin_id" UUID,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "detail" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_usage" (
    "user_id" UUID NOT NULL,
    "month" TEXT NOT NULL,
    "tokens" BIGINT NOT NULL DEFAULT 0,
    "requests" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reserved" BIGINT NOT NULL DEFAULT 0,
    "reserved_at" TIMESTAMPTZ(6),

    CONSTRAINT "ai_usage_pkey" PRIMARY KEY ("user_id","month")
);

-- CreateTable
CREATE TABLE "ai_credits" (
    "user_id" UUID NOT NULL,
    "balance" BIGINT NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_credits_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "ai_credit_events" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "tokens" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_credit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_quota_overrides" (
    "user_id" UUID NOT NULL,
    "monthly_tokens" BIGINT,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_quota_overrides_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "ai_refunds" (
    "receipt" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "tokens" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_refunds_pkey" PRIMARY KEY ("receipt")
);

-- CreateTable
CREATE TABLE "ai_calls" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID,
    "model" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "ok" BOOLEAN NOT NULL,
    "error" TEXT,
    "prompt_tokens" INTEGER NOT NULL DEFAULT 0,
    "completion_tokens" INTEGER NOT NULL DEFAULT 0,
    "cost" DECIMAL(65,30),
    "ms" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_feedback" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID,
    "kind" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'exam',
    "request" TEXT NOT NULL DEFAULT '',
    "reply" TEXT NOT NULL DEFAULT '',
    "context" TEXT NOT NULL DEFAULT '',
    "note" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_provider_settings" (
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "base_url" TEXT,
    "api_key_enc" TEXT,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_provider_settings_pkey" PRIMARY KEY ("provider")
);

-- CreateTable
CREATE TABLE "community_exams" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "owner_id" UUID,
    "title" TEXT NOT NULL DEFAULT '',
    "subject" TEXT NOT NULL DEFAULT '',
    "grade" TEXT NOT NULL DEFAULT '',
    "school" TEXT NOT NULL DEFAULT '',
    "doc" JSONB NOT NULL DEFAULT '{}',
    "question_count" INTEGER NOT NULL DEFAULT 0,
    "duration_minutes" INTEGER NOT NULL DEFAULT 45,
    "total_points" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "preview" TEXT NOT NULL DEFAULT '',
    "listed" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'published',
    "removed_reason" TEXT,
    "moderated_by" UUID,
    "moderated_at" TIMESTAMPTZ(6),
    "missing_keys" INTEGER,

    CONSTRAINT "community_exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_attempts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "exam_id" UUID NOT NULL,
    "user_id" UUID,
    "student_name" TEXT NOT NULL DEFAULT '',
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "max_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "duration_seconds" INTEGER NOT NULL DEFAULT 0,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "device_id" TEXT,
    "class_name" TEXT,
    "seat_no" INTEGER,

    CONSTRAINT "exam_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_attempt_locks" (
    "exam_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_attempt_locks_pkey" PRIMARY KEY ("exam_id","user_id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" BIGSERIAL NOT NULL,
    "exam_id" UUID NOT NULL,
    "reporter_id" UUID,
    "reason" TEXT NOT NULL,
    "detail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_by" UUID,
    "resolved_at" TIMESTAMPTZ(6),

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_items" (
    "owner_id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "bytes" bigint GENERATED ALWAYS AS (octet_length("data"::text)) STORED,

    CONSTRAINT "user_items_pkey" PRIMARY KEY ("owner_id","kind","id")
);

-- CreateTable
CREATE TABLE "user_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "owner_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "url" TEXT NOT NULL,
    "subject" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_images" (
    "owner_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_images_pkey" PRIMARY KEY ("owner_id","key")
);

-- CreateTable
CREATE TABLE "user_quota" (
    "user_id" UUID NOT NULL,
    "max_bytes" BIGINT NOT NULL,
    "note" TEXT,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_quota_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "payment_orders" (
    "order_code" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "vnd" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "pack_vnd" INTEGER,
    "bonus_points" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payment_link_id" TEXT,
    "checkout_url" TEXT,
    "reference" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMPTZ(6),

    CONSTRAINT "payment_orders_pkey" PRIMARY KEY ("order_code")
);

-- CreateTable
CREATE TABLE "bank_questions" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'published',
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_by" UUID,

    CONSTRAINT "bank_questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "presence_last_seen_idx" ON "presence"("last_seen" DESC);

-- CreateIndex
CREATE INDEX "feedback_created_at_idx" ON "feedback"("created_at" DESC);

-- CreateIndex
CREATE INDEX "admin_audit_created_idx" ON "admin_audit"("created_at" DESC);

-- CreateIndex
CREATE INDEX "admin_audit_action_idx" ON "admin_audit"("action");

-- CreateIndex
CREATE INDEX "ai_credit_events_user_idx" ON "ai_credit_events"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "ai_refunds_user_day_idx" ON "ai_refunds"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "ai_calls_created_at_idx" ON "ai_calls"("created_at" DESC);

-- CreateIndex
CREATE INDEX "ai_feedback_created_at_idx" ON "ai_feedback"("created_at" DESC);

-- CreateIndex
CREATE INDEX "community_exams_listed_status_created_idx" ON "community_exams"("listed", "status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "community_exams_owner_idx" ON "community_exams"("owner_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "community_exams_status_idx" ON "community_exams"("status");

-- CreateIndex
CREATE INDEX "exam_attempts_exam_created_idx" ON "exam_attempts"("exam_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "exam_attempts_exam_device" ON "exam_attempts"("exam_id", "device_id");

-- CreateIndex
CREATE INDEX "reports_exam_id_idx" ON "reports"("exam_id");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "user_items_owner_kind_idx" ON "user_items"("owner_id", "kind");

-- CreateIndex
CREATE INDEX "user_items_created_at_idx" ON "user_items"("created_at" DESC);

-- CreateIndex
CREATE INDEX "user_documents_owner_created_idx" ON "user_documents"("owner_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "payment_orders_user_idx" ON "payment_orders"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "bank_questions_updated_at_idx" ON "bank_questions"("updated_at" DESC);

-- AddForeignKey
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "community_exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_attempt_locks" ADD CONSTRAINT "exam_attempt_locks_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "community_exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "community_exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =============================================================================
-- Hand-written: CHECK constraints (Prisma does not generate them)
-- =============================================================================

ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_check" CHECK ("role" IN ('admin', 'moderator'));

ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_reserved_check" CHECK ("reserved" >= 0);
ALTER TABLE "ai_credits" ADD CONSTRAINT "ai_credits_balance_check" CHECK ("balance" >= 0);
ALTER TABLE "ai_credit_events" ADD CONSTRAINT "ai_credit_events_kind_check" CHECK ("kind" ~ '^[a-z_]{1,32}$');
ALTER TABLE "ai_credit_events" ADD CONSTRAINT "ai_credit_events_tokens_check" CHECK ("tokens" > 0);
ALTER TABLE "ai_refunds" ADD CONSTRAINT "ai_refunds_tokens_check" CHECK ("tokens" >= 0);
ALTER TABLE "ai_feedback" ADD CONSTRAINT "ai_feedback_kind_check" CHECK ("kind" IN ('up', 'down', 'undo', 'resend', 'complaint'));
ALTER TABLE "ai_feedback" ADD CONSTRAINT "ai_feedback_mode_check" CHECK ("mode" IN ('exam', 'slide', 'board'));

ALTER TABLE "community_exams" ADD CONSTRAINT "community_exams_status_check" CHECK ("status" IN ('published', 'hidden', 'removed'));
ALTER TABLE "community_exams" ADD CONSTRAINT "community_exams_missing_keys_check" CHECK ("missing_keys" IS NULL OR "missing_keys" >= 0);
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_device_id_check" CHECK ("device_id" IS NULL OR char_length("device_id") BETWEEN 8 AND 64);
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_class_name_check" CHECK ("class_name" IS NULL OR char_length("class_name") <= 30);
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_seat_no_check" CHECK ("seat_no" IS NULL OR "seat_no" BETWEEN 1 AND 999);
ALTER TABLE "reports" ADD CONSTRAINT "reports_reason_check" CHECK (char_length("reason") <= 100);
ALTER TABLE "reports" ADD CONSTRAINT "reports_detail_check" CHECK ("detail" IS NULL OR char_length("detail") <= 1000);
ALTER TABLE "reports" ADD CONSTRAINT "reports_status_check" CHECK ("status" IN ('open', 'resolved', 'dismissed'));

ALTER TABLE "feedback" ADD CONSTRAINT "feedback_email_check" CHECK ("email" IS NULL OR char_length("email") <= 255);
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_message_check" CHECK (char_length("message") <= 2000);
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_page_check" CHECK ("page" IS NULL OR char_length("page") <= 500);

ALTER TABLE "user_items" ADD CONSTRAINT "user_items_kind_check" CHECK ("kind" IN ('doc', 'deck', 'board', 'online', 'upload'));
ALTER TABLE "user_documents" ADD CONSTRAINT "user_documents_size_check" CHECK ("size" > 0 AND "size" <= 20 * 1024 * 1024);
ALTER TABLE "user_images" ADD CONSTRAINT "user_images_size_check" CHECK ("size" > 0);
ALTER TABLE "user_quota" ADD CONSTRAINT "user_quota_max_bytes_check" CHECK ("max_bytes" > 0);

ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_vnd_check" CHECK ("vnd" > 0);
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_points_check" CHECK ("points" > 0);
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_bonus_points_check" CHECK ("bonus_points" >= 0);
ALTER TABLE "payment_orders" ADD CONSTRAINT "payment_orders_status_check" CHECK ("status" IN ('pending', 'paid', 'cancelled', 'expired', 'failed'));

ALTER TABLE "bank_questions" ADD CONSTRAINT "bank_questions_status_check" CHECK ("status" IN ('published', 'hidden'));

-- Order codes start at 100001
ALTER SEQUENCE "payment_orders_order_code_seq" RESTART WITH 100001;

-- =============================================================================
-- Hand-written: lock the database away from PostgREST / Data API.
-- Supabase grants anon/authenticated access to new public tables by default and the
-- publishable key ships in the browser bundle. RLS with no policy denies those roles;
-- REVOKE removes the grants. Prisma connects as `postgres` (table owner), so it bypasses RLS.
-- The anon/authenticated roles only exist on Supabase, hence the guard (local docker has none).
-- Every later migration that adds a table must also ENABLE ROW LEVEL SECURITY.
-- =============================================================================

DO $$
DECLARE
  t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
     AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon, authenticated;
    REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
    REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES    FROM anon, authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated;
  END IF;
END
$$;
