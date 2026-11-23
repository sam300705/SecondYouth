CREATE TABLE IF NOT EXISTS care_grants (
  id uuid PRIMARY KEY,
  owner_id text NOT NULL,
  token_hash text UNIQUE NOT NULL,
  caregiver_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '7 days',
  revoked_at timestamptz
);

CREATE INDEX IF NOT EXISTS care_grants_owner ON care_grants (owner_id, created_at DESC);

CREATE TABLE IF NOT EXISTS care_checkins (
  sequence bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner_id text NOT NULL,
  event_id uuid NOT NULL,
  medicine_id text NOT NULL,
  medicine_name text NOT NULL,
  scheduled_date text NOT NULL,
  scheduled_time text NOT NULL,
  taken boolean NOT NULL,
  recorded_at timestamptz NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, event_id)
);

CREATE INDEX IF NOT EXISTS care_checkins_owner ON care_checkins (owner_id, sequence DESC);
