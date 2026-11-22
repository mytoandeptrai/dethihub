-- Signup abuse guards: disposable-email blocklist, one account per canonical mailbox, per-IP signup limit.
CREATE TABLE "blocked_email_domains" (
    "domain" TEXT NOT NULL,

    CONSTRAINT "blocked_email_domains_pkey" PRIMARY KEY ("domain"),
    CONSTRAINT "blocked_email_domains_lower" CHECK ("domain" = lower("domain"))
);

CREATE TABLE "signup_guard" (
    "user_id" UUID NOT NULL,
    "canonical" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signup_guard_pkey" PRIMARY KEY ("user_id")
);

CREATE TABLE "signup_ip_log" (
    "id" BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL,
    "ip" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signup_ip_log_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "signup_guard_canonical_key" ON "signup_guard"("canonical");
CREATE INDEX "signup_ip_log_ip_created_at_idx" ON "signup_ip_log"("ip", "created_at" DESC);

ALTER TABLE "blocked_email_domains" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "signup_guard" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "signup_ip_log" ENABLE ROW LEVEL SECURITY;

-- Hand-written below. Domains live in a table so the list can change without a migration.
INSERT INTO "blocked_email_domains" ("domain") VALUES
  ('yopmail.com'), ('yopmail.fr'), ('yopmail.net'), ('cool.fr.nf'), ('jetable.fr.nf'), ('nospam.ze.tc'),
  ('nomail.xl.cz'), ('mega.zik.dj'), ('speed.1s.fr'), ('courriel.fr.nf'), ('moncourrier.fr.nf'),
  ('monemail.fr.nf'), ('monmail.fr.nf'),
  ('mailinator.com'), ('guerrillamail.com'), ('guerrillamail.net'), ('guerrillamail.org'), ('guerrillamail.biz'),
  ('guerrillamail.de'), ('grr.la'), ('sharklasers.com'), ('spam4.me'),
  ('10minutemail.com'), ('10minutemail.net'), ('20minutemail.com'), ('tempmail.com'), ('temp-mail.org'),
  ('temp-mail.io'), ('tempmailo.com'), ('tempail.com'), ('tempr.email'), ('trashmail.com'), ('trashmail.net'),
  ('trashmail.de'), ('getnada.com'), ('nada.email'), ('dispostable.com'), ('maildrop.cc'), ('throwawaymail.com'),
  ('mohmal.com'), ('fakeinbox.com'), ('emailondeck.com'), ('mintemail.com'), ('mailnesia.com'), ('mytemp.email'),
  ('burnermail.io'), ('moakt.com'), ('discard.email'), ('mailcatch.com'), ('inboxkitten.com'), ('1secmail.com'),
  ('1secmail.net'), ('1secmail.org'), ('emailfake.com'), ('fakemail.net'), ('tmpmail.org'), ('tmpmail.net'),
  ('mailtemp.info'), ('luxusmail.org'), ('mail.tm'), ('dropmail.me'), ('harakirimail.com')
ON CONFLICT DO NOTHING;

CREATE FUNCTION public.canonical_email(e text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN t.d IN ('gmail.com', 'googlemail.com') THEN replace(split_part(t.l, '+', 1), '.', '') || '@gmail.com'
    ELSE lower(e)
  END
  FROM (SELECT lower(split_part(e, '@', 1)) AS l, lower(split_part(e, '@', 2)) AS d) t
$$;

CREATE FUNCTION public.reject_disposable_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  d text;
BEGIN
  IF new.email IS NULL THEN
    RETURN new;
  END IF;
  d := lower(split_part(new.email, '@', 2));
  IF EXISTS (
    SELECT 1 FROM public.blocked_email_domains b
    WHERE d = b.domain OR d LIKE '%.' || b.domain
  ) THEN
    RAISE EXCEPTION 'Không dùng được email tạm thời. Hãy dùng email thật của bạn.' USING errcode = 'P0001';
  END IF;
  RETURN new;
END;
$$;

CREATE FUNCTION public.guard_signup_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  c text;
BEGIN
  IF new.email IS NULL THEN
    RETURN new;
  END IF;
  c := public.canonical_email(new.email);
  IF EXISTS (SELECT 1 FROM public.signup_guard g WHERE g.canonical = c AND g.user_id <> new.id) THEN
    RAISE EXCEPTION 'Hộp thư này đã có tài khoản (Gmail không phân biệt dấu chấm và phần sau dấu +). Hãy đăng nhập.' USING errcode = 'P0001';
  END IF;
  INSERT INTO public.signup_guard (user_id, canonical) VALUES (new.id, c)
  ON CONFLICT (user_id) DO UPDATE SET canonical = excluded.canonical;
  RETURN new;
END;
$$;

CREATE FUNCTION public.forget_signup_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.signup_guard WHERE user_id = old.id;
  RETURN old;
END;
$$;

-- 8 per hour and 20 per day per IP; an unknown IP cannot be limited, so it passes.
CREATE FUNCTION public.hook_before_user_created(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_ip text := nullif(event -> 'metadata' ->> 'ip_address', '');
  per_hour int;
  per_day int;
BEGIN
  IF v_ip IS NULL THEN
    RETURN '{}'::jsonb;
  END IF;
  DELETE FROM public.signup_ip_log WHERE created_at < now() - interval '2 days';
  SELECT count(*) FILTER (WHERE created_at > now() - interval '1 hour'), count(*)
    INTO per_hour, per_day
    FROM public.signup_ip_log
   WHERE ip = v_ip AND created_at > now() - interval '1 day';
  IF per_hour >= 8 OR per_day >= 20 THEN
    RETURN jsonb_build_object('error', jsonb_build_object(
      'http_code', 429,
      'message', 'Có quá nhiều tài khoản được tạo từ mạng này. Thử lại sau hoặc liên hệ hỗ trợ.'
    ));
  END IF;
  INSERT INTO public.signup_ip_log (ip) VALUES (v_ip);
  RETURN '{}'::jsonb;
END;
$$;

-- Supabase only: auth.users, the Auth hook role and the anon/authenticated roles are absent on local docker.
DO $$
BEGIN
  IF to_regclass('auth.users') IS NOT NULL THEN
    EXECUTE $q$
      INSERT INTO public.signup_guard (user_id, canonical)
      SELECT id, public.canonical_email(email) FROM auth.users WHERE email IS NOT NULL
      ON CONFLICT DO NOTHING
    $q$;

    EXECUTE 'DROP TRIGGER IF EXISTS reject_disposable_email_ins ON auth.users';
    EXECUTE 'CREATE TRIGGER reject_disposable_email_ins BEFORE INSERT ON auth.users
             FOR EACH ROW EXECUTE FUNCTION public.reject_disposable_email()';
    EXECUTE 'DROP TRIGGER IF EXISTS reject_disposable_email_upd ON auth.users';
    EXECUTE 'CREATE TRIGGER reject_disposable_email_upd BEFORE UPDATE OF email ON auth.users
             FOR EACH ROW WHEN (new.email IS DISTINCT FROM old.email)
             EXECUTE FUNCTION public.reject_disposable_email()';

    EXECUTE 'DROP TRIGGER IF EXISTS guard_signup_email_ins ON auth.users';
    EXECUTE 'CREATE TRIGGER guard_signup_email_ins BEFORE INSERT ON auth.users
             FOR EACH ROW EXECUTE FUNCTION public.guard_signup_email()';
    EXECUTE 'DROP TRIGGER IF EXISTS guard_signup_email_upd ON auth.users';
    EXECUTE 'CREATE TRIGGER guard_signup_email_upd BEFORE UPDATE OF email ON auth.users
             FOR EACH ROW WHEN (new.email IS DISTINCT FROM old.email)
             EXECUTE FUNCTION public.guard_signup_email()';
    EXECUTE 'DROP TRIGGER IF EXISTS forget_signup_email_del ON auth.users';
    EXECUTE 'CREATE TRIGGER forget_signup_email_del AFTER DELETE ON auth.users
             FOR EACH ROW EXECUTE FUNCTION public.forget_signup_email()';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
     AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE blocked_email_domains, signup_guard, signup_ip_log FROM anon, authenticated;
    REVOKE ALL ON FUNCTION public.canonical_email(text), public.reject_disposable_email(),
      public.guard_signup_email(), public.forget_signup_email(),
      public.hook_before_user_created(jsonb) FROM PUBLIC, anon, authenticated;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'supabase_auth_admin') THEN
    GRANT EXECUTE ON FUNCTION public.hook_before_user_created(jsonb) TO supabase_auth_admin;
  END IF;
END
$$;
