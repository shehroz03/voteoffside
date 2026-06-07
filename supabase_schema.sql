-- =====================================================================
--  VoteOffside — Supabase schema
--  Paste this whole file into: Supabase dashboard → SQL Editor → Run
--  Safe to run more than once.
-- =====================================================================

-- 1) One row per anonymous user per match (their current pick)
create table if not exists public.votes (
  fingerprint text not null,
  username    text,
  match_id    text not null,
  team_code   text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (fingerprint, match_id)
);

-- 2) Aggregate counts per match/team (this is what everyone reads — small & fast)
create table if not exists public.vote_counts (
  match_id  text not null,
  team_code text not null,
  count     integer not null default 0,
  primary key (match_id, team_code)
);
create index if not exists idx_vote_counts_match on public.vote_counts(match_id);

-- 3) Atomic vote: records the pick AND updates counts in one transaction.
--    Handles changing your vote (moves the count from old team to new).
create or replace function public.cast_vote(
  p_fingerprint text,
  p_match_id    text,
  p_team_code   text,
  p_username    text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prev   text;
  v_result jsonb;
begin
  if p_fingerprint is null or p_match_id is null or p_team_code is null then
    raise exception 'missing required argument';
  end if;

  select team_code into v_prev
    from public.votes
   where fingerprint = p_fingerprint and match_id = p_match_id;

  -- only do work if the pick actually changed
  if v_prev is distinct from p_team_code then
    insert into public.votes (fingerprint, username, match_id, team_code, updated_at)
         values (p_fingerprint, p_username, p_match_id, p_team_code, now())
    on conflict (fingerprint, match_id)
    do update set team_code  = excluded.team_code,
                  username   = coalesce(excluded.username, public.votes.username),
                  updated_at = now();

    if v_prev is not null then
      update public.vote_counts
         set count = greatest(count - 1, 0)
       where match_id = p_match_id and team_code = v_prev;
    end if;

    insert into public.vote_counts (match_id, team_code, count)
         values (p_match_id, p_team_code, 1)
    on conflict (match_id, team_code)
    do update set count = public.vote_counts.count + 1;
  end if;

  select coalesce(jsonb_object_agg(team_code, count), '{}'::jsonb)
    into v_result
    from public.vote_counts
   where match_id = p_match_id;

  return v_result;
end;
$$;

-- 4) Security (Row Level Security)
alter table public.votes       enable row level security;
alter table public.vote_counts enable row level security;

-- Anyone can READ the aggregate percentages...
drop policy if exists "vote_counts_read" on public.vote_counts;
create policy "vote_counts_read" on public.vote_counts
  for select using (true);

-- ...but nobody can touch the raw votes table directly.
-- All writes go through cast_vote() (which runs with elevated rights).

-- Allow anonymous visitors to call the voting function (no login needed)
grant execute on function public.cast_vote(text, text, text, text) to anon, authenticated;

-- 5) Realtime: push vote_counts changes to all connected clients
do $$
begin
  alter publication supabase_realtime add table public.vote_counts;
exception
  when duplicate_object then null;  -- already added, ignore
end $$;
