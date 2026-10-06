CREATE TABLE auth_user (
  id text PRIMARY KEY,
  name varchar(80) NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 80),
  email varchar(254) NOT NULL UNIQUE CHECK (email = lower(trim(email))),
  email_verified boolean NOT NULL DEFAULT false,
  image text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE auth_session (
  id text PRIMARY KEY,
  expires_at timestamptz NOT NULL,
  token text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  user_id text NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX auth_session_user_idx ON auth_session(user_id);
--> statement-breakpoint
CREATE TABLE auth_account (
  id text PRIMARY KEY,
  account_id text NOT NULL,
  provider_id text NOT NULL,
  user_id text NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
  access_token text,
  refresh_token text,
  id_token text,
  access_token_expires_at timestamptz,
  refresh_token_expires_at timestamptz,
  scope text,
  password text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT credential_password_required CHECK (provider_id <> 'credential' OR password IS NOT NULL),
  CONSTRAINT password_argon2id CHECK (password IS NULL OR password ~ '^\$argon2id\$v=19\$m=65536,t=3,p=1\$[^$]+\$[^$]+$')
);
--> statement-breakpoint
CREATE INDEX auth_account_user_idx ON auth_account(user_id);
--> statement-breakpoint
CREATE UNIQUE INDEX auth_account_provider_idx ON auth_account(provider_id, account_id);
--> statement-breakpoint
CREATE TABLE auth_verification (
  id text PRIMARY KEY,
  identifier text NOT NULL,
  value text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX auth_verification_identifier_idx ON auth_verification(identifier);
--> statement-breakpoint
CREATE TABLE profile (
  user_id text PRIMARY KEY REFERENCES auth_user(id) ON DELETE CASCADE,
  city varchar(100) NOT NULL DEFAULT '',
  bio varchar(500) NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
