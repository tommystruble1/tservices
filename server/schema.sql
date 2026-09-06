-- Run this once, after Better Auth's own migration has already created its
-- "user", "session", "account" and "verification" tables — this table has a
-- foreign key into "user" and will fail to create if that doesn't exist yet.
--
--   1. npx @better-auth/cli migrate      (creates Better Auth's own tables)
--   2. psql "$DATABASE_URL" -f schema.sql   (creates this one)

create table if not exists licenses (
  id                 text primary key,
  user_id            text not null references "user"(id) on delete cascade,
  product            text not null,
  variant            text not null,
  price_cents        integer not null,
  currency           text not null default 'usd',
  license_key        text not null unique,
  stripe_session_id  text,
  created_at         timestamptz not null default now()
);

create index if not exists licenses_user_id_idx on licenses (user_id);

-- One row per Stripe Checkout Session is expected for most purchases, but
-- this is NOT a uniqueness constraint — buying two different durations in one
-- cart legitimately creates multiple rows sharing a stripe_session_id. The
-- idempotency check in api/webhook.js checks for ANY existing row with that
-- session id before inserting, which is what actually prevents double-issuing
-- keys on a retried webhook delivery.
