create table if not exists lab_prefs (
  user_id text primary key,
  target_id text not null default 'spotify',
  stem_model text not null default 'htdemucs_6s',
  quality text not null default 'hq',
  stem_mode integer not null default 6,
  updated_at timestamptz not null default now()
);
