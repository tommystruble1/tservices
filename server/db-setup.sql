-- ============================================================================
--  T's Services — one-time database setup
--  Paste this whole file into the Neon SQL Editor and Run it, once.
--
--  It creates Better Auth's four core tables (user / session / account /
--  verification) followed by the `licenses` table. This matches better-auth
--  1.2.x — the version pinned in server/package.json. If you bump better-auth
--  and a sign-in later errors with "column ... does not exist", regenerate
--  with `npx @better-auth/cli generate` and apply the diff.
--
--  The email one-time codes are stored (hashed) in the `verification` table by
--  Better Auth's emailOTP plugin — no extra table is needed for login.
-- ============================================================================

-- ---------- Better Auth: user ----------
create table if not exists "user" (
  "id"            text not null primary key,
  "name"          text not null,
  "email"         text not null unique,
  "emailVerified" boolean not null default false,
  "image"         text,
  "createdAt"     timestamp not null default now(),
  "updatedAt"     timestamp not null default now()
);

-- ---------- Better Auth: session ----------
create table if not exists "session" (
  "id"        text not null primary key,
  "expiresAt" timestamp not null,
  "token"     text not null unique,
  "createdAt" timestamp not null default now(),
  "updatedAt" timestamp not null default now(),
  "ipAddress" text,
  "userAgent" text,
  "userId"    text not null references "user" ("id") on delete cascade
);

-- ---------- Better Auth: account ----------
create table if not exists "account" (
  "id"                    text not null primary key,
  "accountId"             text not null,
  "providerId"            text not null,
  "userId"                text not null references "user" ("id") on delete cascade,
  "accessToken"           text,
  "refreshToken"          text,
  "idToken"               text,
  "accessTokenExpiresAt"  timestamp,
  "refreshTokenExpiresAt" timestamp,
  "scope"                 text,
  "password"              text,
  "createdAt"             timestamp not null default now(),
  "updatedAt"             timestamp not null default now()
);

-- ---------- Better Auth: verification (also holds the OTP codes) ----------
create table if not exists "verification" (
  "id"         text not null primary key,
  "identifier" text not null,
  "value"      text not null,
  "expiresAt"  timestamp not null,
  "createdAt"  timestamp default now(),
  "updatedAt"  timestamp default now()
);

create index if not exists "verification_identifier_idx" on "verification" ("identifier");

-- ---------- T's Services: licence keys ----------
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
