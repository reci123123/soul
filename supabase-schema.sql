-- ============================================================
-- SoulStone — Supabase şeması
-- Bunu Supabase Dashboard → SQL Editor içine yapıştırıp çalıştır.
-- ============================================================

-- 1) Her kullanıcının oyun durumu: profil, harita, taşlar, companion, görevler, para birimleri
create table if not exists public.player_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Gezgin',
  sun text, moon text, rising text, element text,          -- sembolik harita özeti
  companion jsonb not null default '{"species":"Tilki","glyph":"🦊","name":"Ember","loyalty":50,"level":1,"mood":"Sakin"}',
  stones jsonb not null default '{
    "root":{"xp":0,"max":500,"stage":"Kırık"},
    "sacral":{"xp":0,"max":400,"stage":"Kırık"},
    "solar":{"xp":0,"max":450,"stage":"Kırık"},
    "heart":{"xp":0,"max":600,"stage":"Kırık"},
    "throat":{"xp":0,"max":350,"stage":"Kırık"},
    "thirdeye":{"xp":0,"max":350,"stage":"Kırık"},
    "crown":{"xp":0,"max":300,"stage":"Kırık"}
  }',
  quests jsonb not null default '[]',
  currencies jsonb not null default '{"soulDust":0,"moonCrystals":0,"streak":0}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Günlük kayıtları — zamanla büyüyen bir liste olduğu için ayrı tablo
create table if not exists public.journal_entries (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  mood int, energy int, stress int,
  entry_text text,
  created_at timestamptz not null default now()
);

-- 3) Mentor sohbet geçmişi (opsiyonel ama context/hafıza için faydalı)
create table if not exists public.mentor_messages (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','mentor')),
  content text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security — her kullanıcı SADECE kendi verisini görür/yazar
-- ============================================================
alter table public.player_state enable row level security;
alter table public.journal_entries enable row level security;
alter table public.mentor_messages enable row level security;

create policy "player_state: kendi verisi" on public.player_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "journal_entries: kendi verisi" on public.journal_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "mentor_messages: kendi verisi" on public.mentor_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- updated_at otomatik güncellensin
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_touch_player_state on public.player_state;
create trigger trg_touch_player_state
  before update on public.player_state
  for each row execute function public.touch_updated_at();
