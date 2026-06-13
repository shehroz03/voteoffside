-- =====================================================================
--  VoteOffside — Supabase schema
--  Paste this whole file into: Supabase dashboard → SQL Editor → Run
--  Safe to run more than once (IF NOT EXISTS / CREATE OR REPLACE throughout).
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


-- =====================================================================
--  Beat the Crowd scoring — additive extensions (safe to re-run)
-- =====================================================================

-- 6) Add scoring columns to the votes table
--    correct: was this pick right? (null = match not settled yet)
--    points:  Beat-the-Crowd score for this prediction (0 until settled)
alter table public.votes
  add column if not exists correct boolean,
  add column if not exists points  integer not null default 0;

-- Index for fast leaderboard aggregation
create index if not exists idx_votes_username on public.votes(username);

-- 7) Match results — one row per settled match
create table if not exists public.match_results (
  match_id         text        not null primary key,
  winner_team_code text        not null,
  settled_at       timestamptz not null default now()
);

alter table public.match_results enable row level security;

drop policy if exists "match_results_read" on public.match_results;
create policy "match_results_read" on public.match_results
  for select using (true);

-- 8) settle_match: call this (as a service-role admin) once a match has a result.
--
--    Formula: points = 10 + (100 − winner_vote_pct)
--      • Backing a 70%-favourite  → 10 + 30 = 40 pts
--      • Backing a 50/50 pick     → 10 + 50 = 60 pts
--      • Backing a 30%-underdog   → 10 + 70 = 80 pts
--      • Backing a 10%-underdog   → 10 + 90 = 100 pts
--    Wrong pick always scores 0.
--    Re-running settle_match for the same match_id is safe (idempotent).
--
create or replace function public.settle_match(
  p_match_id text,
  p_winner   text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_winner_count numeric;
  v_total_count  numeric;
  v_winner_pct   integer;
  v_points       integer;
begin
  -- Record the result (upsert so re-running is safe)
  insert into public.match_results (match_id, winner_team_code, settled_at)
       values (p_match_id, p_winner, now())
  on conflict (match_id)
  do update set winner_team_code = excluded.winner_team_code,
                settled_at       = now();

  -- Read final vote counts for this match from the aggregate table
  select
    coalesce(sum(case when team_code = p_winner then count else 0 end), 0),
    coalesce(sum(count), 0)
    into v_winner_count, v_total_count
    from public.vote_counts
   where match_id = p_match_id;

  -- Winner vote percentage (default 50 when no votes were cast)
  v_winner_pct := case
    when v_total_count > 0
    then round(v_winner_count / v_total_count * 100)::integer
    else 50
  end;

  -- Beat-the-Crowd points for a correct pick
  v_points := 10 + (100 - v_winner_pct);

  -- Settle every prediction for this match
  update public.votes
     set correct = (team_code = p_winner),
         points  = case when team_code = p_winner then v_points else 0 end
   where match_id = p_match_id;

  return jsonb_build_object(
    'match_id',       p_match_id,
    'winner',         p_winner,
    'winner_pct',     v_winner_pct,
    'points_awarded', v_points,
    'rows_settled',   (select count(*) from public.votes where match_id = p_match_id)
  );
end;
$$;

-- Only authenticated/service roles can settle matches (never anonymous users)
grant execute on function public.settle_match(text, text) to authenticated;

-- 9) get_leaderboard: returns users ranked by total Beat-the-Crowd points.
--    Falls back gracefully when no matches are settled (everyone at 0 pts).
--
drop function if exists public.get_leaderboard(int);

create or replace function public.get_leaderboard(p_limit int default 50)
returns table(
  username     text,
  total_points bigint,
  correct_ct   bigint,
  played_ct    bigint,
  accuracy     integer
)
language sql
security definer
set search_path = public
stable
as $$
  select
    coalesce(v.username, 'Anonymous')                                         as username,
    coalesce(sum(v.points), 0)::bigint                                        as total_points,
    count(*) filter (where v.correct = true)::bigint                          as correct_ct,
    count(*) filter (where v.correct is not null)::bigint                     as played_ct,
    case
      when count(*) filter (where v.correct is not null) > 0
      then round(
             count(*) filter (where v.correct = true)::numeric
             / count(*) filter (where v.correct is not null) * 100
           )::integer
      else 0
    end                                                                        as accuracy
  from public.votes v
  where v.username is not null
  group by v.username
  order by total_points desc, correct_ct desc
  limit p_limit;
$$;

grant execute on function public.get_leaderboard(int) to anon, authenticated;

-- 10) Realtime for match_results so clients can react when a match is settled
do $$
begin
  alter publication supabase_realtime add table public.match_results;
exception
  when duplicate_object then null;
end $$;

-- =====================================================================
--  11) Live Reactions — lightweight per-match emoji reactions
--      (safe to re-run)
-- =====================================================================

create table if not exists public.reactions (
  id         bigserial   not null primary key,
  match_id   text        not null,
  emoji      text        not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_reactions_match_id   on public.reactions(match_id);
create index if not exists idx_reactions_created_at on public.reactions(created_at desc);

-- RLS: anon users can insert reactions and select them.
-- The select policy is required for Supabase Realtime postgres_changes to
-- deliver INSERT events to subscribers.
alter table public.reactions enable row level security;

drop policy if exists "reactions_insert" on public.reactions;
create policy "reactions_insert" on public.reactions
  for insert with check (true);

drop policy if exists "reactions_read" on public.reactions;
create policy "reactions_read" on public.reactions
  for select using (true);

grant insert, select on public.reactions to anon, authenticated;
grant usage, select on sequence public.reactions_id_seq to anon, authenticated;

-- Add to realtime publication so INSERT events broadcast to all clients
do $$
begin
  alter publication supabase_realtime add table public.reactions;
exception
  when duplicate_object then null;
end $$;

-- =====================================================================
--  12) Streaks & Predictor of the Day
--      (safe to re-run)
-- =====================================================================

-- 12a) Rebuild get_leaderboard to include current_streak.
--      PostgreSQL disallows changing a function's return type via
--      CREATE OR REPLACE, so we drop first.
drop function if exists public.get_leaderboard(int);

create function public.get_leaderboard(p_limit int default 50)
returns table(
  username        text,
  total_points    bigint,
  correct_ct      bigint,
  played_ct       bigint,
  accuracy        integer,
  current_streak  integer
)
language sql
security definer
set search_path = public
stable
as $$
  with settled as (
    -- All settled picks, ranked newest-first per user
    select v.username,
           v.correct,
           v.points,
           row_number() over (
             partition by v.username
             order by mr.settled_at desc
           ) as rn
    from public.votes v
    join public.match_results mr on mr.match_id = v.match_id
    where v.username is not null
      and v.correct is not null
  ),
  -- Position of the first wrong pick per user (most-recent-first ordering)
  first_wrong as (
    select username, min(rn) as wrong_rn
    from settled
    where correct = false
    group by username
  ),
  streaks as (
    -- Count correct picks that sit before the first wrong one
    select s.username,
           count(*) filter (
             where s.correct = true
               and (fw.wrong_rn is null or s.rn < fw.wrong_rn)
           )::integer as current_streak
    from settled s
    left join first_wrong fw on fw.username = s.username
    group by s.username
  ),
  totals as (
    select
      v.username,
      coalesce(sum(v.points), 0)::bigint                    as total_points,
      count(*) filter (where v.correct = true)::bigint      as correct_ct,
      count(*) filter (where v.correct is not null)::bigint as played_ct,
      case
        when count(*) filter (where v.correct is not null) > 0
        then round(
               count(*) filter (where v.correct = true)::numeric
               / count(*) filter (where v.correct is not null) * 100
             )::integer
        else 0
      end as accuracy
    from public.votes v
    where v.username is not null
    group by v.username
  )
  select
    t.username,
    t.total_points,
    t.correct_ct,
    t.played_ct,
    t.accuracy,
    coalesce(s.current_streak, 0) as current_streak
  from totals t
  left join streaks s on s.username = t.username
  order by t.total_points desc, t.correct_ct desc
  limit p_limit;
$$;

grant execute on function public.get_leaderboard(int) to anon, authenticated;

-- 12b) Predictor of the Day: the user who scored the most points
--      on the most recently settled calendar day.
create or replace function public.get_predictor_of_day()
returns table(
  username    text,
  day_points  bigint,
  day_correct bigint,
  matchday    date
)
language sql
security definer
set search_path = public
stable
as $$
  with latest_day as (
    select date(settled_at at time zone 'UTC') as d
    from public.match_results
    order by settled_at desc
    limit 1
  ),
  day_scores as (
    select
      v.username,
      sum(v.points)::bigint                               as day_points,
      count(*) filter (where v.correct = true)::bigint   as day_correct
    from public.votes v
    join public.match_results mr on mr.match_id = v.match_id
    cross join latest_day ld
    where v.username is not null
      and v.correct is not null
      and date(mr.settled_at at time zone 'UTC') = ld.d
    group by v.username
  )
  select
    ds.username,
    ds.day_points,
    ds.day_correct,
    ld.d as matchday
  from day_scores ds
  cross join latest_day ld
  order by ds.day_points desc, ds.day_correct desc
  limit 1;
$$;

grant execute on function public.get_predictor_of_day() to anon, authenticated;

-- 12c) Fast streak lookup for a single user (used on the Predictions page).
create or replace function public.get_user_streak(p_username text)
returns integer
language sql
security definer
set search_path = public
stable
as $$
  with settled as (
    select v.correct,
           row_number() over (order by mr.settled_at desc) as rn
    from public.votes v
    join public.match_results mr on mr.match_id = v.match_id
    where v.username = p_username
      and v.correct is not null
  )
  select coalesce(
    count(*) filter (
      where correct = true
        and (
          (select min(rn) from settled s2 where s2.correct = false) is null
          or rn < (select min(rn) from settled s2 where s2.correct = false)
        )
    )::integer,
    0
  )
  from settled;
$$;

grant execute on function public.get_user_streak(text) to anon, authenticated;

-- =====================================================================
--  13) Crowd Accuracy — how often did the crowd-favourite actually win?
--      (safe to re-run)
-- =====================================================================

create or replace function public.get_crowd_accuracy()
returns table(
  correct_ct   integer,
  total_ct     integer,
  accuracy_pct integer
)
language sql
security definer
set search_path = public
stable
as $$
  with vote_summary as (
    -- Total votes and winning-side vote count per match
    select match_id,
           sum(count)::integer as total_votes,
           max(count)::integer as max_votes
    from public.vote_counts
    group by match_id
  ),
  crowd_picks as (
    -- For every settled match that had a clear crowd majority (not 50/50),
    -- capture which team the crowd backed and which team actually won.
    select
      mr.match_id,
      mr.winner_team_code,
      (
        -- Scalar subquery: the team with the most votes
        select vc.team_code
        from public.vote_counts vc
        where vc.match_id = mr.match_id
          and vc.count    = vs.max_votes
        order by vc.team_code   -- deterministic tiebreak (shouldn't happen)
        limit 1
      ) as crowd_pick
    from public.match_results mr
    join vote_summary vs on vs.match_id = mr.match_id
    -- Exclude matches with zero votes or a perfect 50/50 split
    where vs.total_votes > 0
      and vs.max_votes * 2 > vs.total_votes
  )
  select
    count(*) filter (where crowd_pick = winner_team_code)::integer as correct_ct,
    count(*)::integer                                               as total_ct,
    case
      when count(*) > 0
      then round(
             count(*) filter (where crowd_pick = winner_team_code)::numeric
             / count(*) * 100
           )::integer
      else 0
    end                                                             as accuracy_pct
  from crowd_picks;
$$;

grant execute on function public.get_crowd_accuracy() to anon, authenticated;

-- =====================================================================
--  14) Virtual Coins prediction game
--      Safe to re-run (IF NOT EXISTS / CREATE OR REPLACE throughout).
-- =====================================================================

-- 14a) Tables

create table if not exists public.user_coins (
  user_id    uuid        primary key references auth.users(id) on delete cascade,
  balance    integer     not null default 1000 check (balance >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.coin_bets (
  id         uuid         primary key default gen_random_uuid(),
  user_id    uuid         not null references auth.users(id) on delete cascade,
  match_id   text         not null,
  team_code  text         not null,
  amount     integer      not null check (amount >= 50 and amount <= 500),
  odds       numeric(5,2) not null,
  status     text         not null default 'pending'
                          check (status in ('pending','won','lost')),
  payout     integer,
  created_at timestamptz  not null default now()
);

-- One bet per user per match (enforced at DB level)
create unique index if not exists coin_bets_user_match
  on public.coin_bets(user_id, match_id);

-- 14b) RLS

alter table public.user_coins enable row level security;
alter table public.coin_bets  enable row level security;

drop policy if exists "user_coins_self" on public.user_coins;
create policy "user_coins_self" on public.user_coins
  for all using (auth.uid() = user_id);

drop policy if exists "coin_bets_self" on public.coin_bets;
create policy "coin_bets_self" on public.coin_bets
  for all using (auth.uid() = user_id);

-- 14c) get_user_balance — ensures wallet row exists on first call

create or replace function public.get_user_balance(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bal integer;
begin
  insert into public.user_coins(user_id, balance)
  values (p_user_id, 1000)
  on conflict (user_id) do nothing;

  select balance into v_bal
  from public.user_coins
  where user_id = p_user_id;

  return coalesce(v_bal, 1000);
end;
$$;

grant execute on function public.get_user_balance(uuid) to authenticated;

-- 14d) place_bet — atomic deduct + insert in one transaction

create or replace function public.place_bet(
  p_user_id   uuid,
  p_match_id  text,
  p_team_code text,
  p_amount    integer,
  p_odds      numeric
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance integer;
  v_bet_id  uuid;
begin
  if p_amount < 50 or p_amount > 500 then
    raise exception 'Amount must be between 50 and 500 coins';
  end if;

  -- Ensure wallet exists (1000 starting coins)
  insert into public.user_coins(user_id, balance)
  values (p_user_id, 1000)
  on conflict (user_id) do nothing;

  -- Lock row and read balance atomically
  select balance into v_balance
  from public.user_coins
  where user_id = p_user_id
  for update;

  if v_balance < p_amount then
    raise exception 'Not enough coins (balance: %, bet: %)', v_balance, p_amount;
  end if;

  -- Deduct coins
  update public.user_coins
  set balance    = balance - p_amount,
      updated_at = now()
  where user_id = p_user_id;

  -- Insert bet (unique index prevents double-betting on same match)
  insert into public.coin_bets(user_id, match_id, team_code, amount, odds)
  values (p_user_id, p_match_id, p_team_code, p_amount, p_odds)
  returning id into v_bet_id;

  return json_build_object(
    'bet_id',      v_bet_id,
    'new_balance', v_balance - p_amount
  );
end;
$$;

grant execute on function public.place_bet(uuid, text, text, integer, numeric) to authenticated;

-- 14e) Extend settle_match to also settle coin bets for the same match.
--      DROP first because return type doesn't change but body does.
--      This replaces the function defined in section 8 above.

drop function if exists public.settle_match(text, text);

create function public.settle_match(
  p_match_id text,
  p_winner   text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_winner_count numeric;
  v_total_count  numeric;
  v_winner_pct   integer;
  v_points       integer;
  v_bet          record;
  v_payout       integer;
  v_coin_winners integer := 0;
  v_coin_losers  integer := 0;
begin
  -- Record result (upsert — idempotent)
  insert into public.match_results (match_id, winner_team_code, settled_at)
       values (p_match_id, p_winner, now())
  on conflict (match_id)
  do update set winner_team_code = excluded.winner_team_code,
                settled_at       = now();

  -- Aggregate vote counts
  select
    coalesce(sum(case when team_code = p_winner then count else 0 end), 0),
    coalesce(sum(count), 0)
    into v_winner_count, v_total_count
    from public.vote_counts
   where match_id = p_match_id;

  v_winner_pct := case
    when v_total_count > 0
    then round(v_winner_count / v_total_count * 100)::integer
    else 50
  end;

  v_points := 10 + (100 - v_winner_pct);

  -- Settle Beat-the-Crowd picks
  update public.votes
     set correct = (team_code = p_winner),
         points  = case when team_code = p_winner then v_points else 0 end
   where match_id = p_match_id;

  -- Settle coin bets
  for v_bet in
    select * from public.coin_bets
     where match_id = p_match_id
       and status   = 'pending'
     for update
  loop
    if v_bet.team_code = p_winner then
      v_payout := floor(v_bet.amount * v_bet.odds);
      update public.coin_bets
         set status = 'won', payout = v_payout
       where id = v_bet.id;
      update public.user_coins
         set balance = balance + v_payout, updated_at = now()
       where user_id = v_bet.user_id;
      v_coin_winners := v_coin_winners + 1;
    else
      update public.coin_bets
         set status = 'lost', payout = 0
       where id = v_bet.id;
      v_coin_losers := v_coin_losers + 1;
    end if;
  end loop;

  return jsonb_build_object(
    'match_id',       p_match_id,
    'winner',         p_winner,
    'winner_pct',     v_winner_pct,
    'points_awarded', v_points,
    'rows_settled',   (select count(*) from public.votes where match_id = p_match_id),
    'coin_winners',   v_coin_winners,
    'coin_losers',    v_coin_losers
  );
end;
$$;

grant execute on function public.settle_match(text, text) to authenticated;

-- 14f) Realtime for user_coins so balance updates push instantly to clients
do $$
begin
  alter publication supabase_realtime add table public.user_coins;
exception
  when duplicate_object then null;
end $$;

-- =====================================================================
--  15) GOAT Poll — global "who is the greatest?" popularity vote
--      Login required to vote; aggregate counts are public so every
--      visitor sees the real running totals. Safe to re-run.
-- =====================================================================

-- 15a) Tables: one current pick per signed-in user + public aggregate
create table if not exists public.goat_votes (
  user_id    uuid        primary key references auth.users(id) on delete cascade,
  player_id  text        not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.goat_vote_counts (
  player_id text    not null primary key,
  count     integer not null default 0
);

-- 15b) RLS
alter table public.goat_votes       enable row level security;
alter table public.goat_vote_counts enable row level security;

-- Everyone (even logged-out visitors) can READ the aggregate counts
drop policy if exists "goat_counts_read" on public.goat_vote_counts;
create policy "goat_counts_read" on public.goat_vote_counts
  for select using (true);

-- Raw per-user votes are never exposed directly — all writes go through the RPC.

-- 15c) get_goat_state: public counts (always) + this caller's pick (null if anon)
create or replace function public.get_goat_state()
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_counts jsonb;
  v_pick   text;
begin
  select coalesce(jsonb_object_agg(player_id, count), '{}'::jsonb)
    into v_counts from public.goat_vote_counts;

  if auth.uid() is not null then
    select player_id into v_pick
      from public.goat_votes where user_id = auth.uid();
  end if;

  return jsonb_build_object('counts', v_counts, 'pick', v_pick);
end;
$$;

grant execute on function public.get_goat_state() to anon, authenticated;

-- 15d) cast_goat_vote: records/moves the caller's vote (sign-in required)
create or replace function public.cast_goat_vote(p_player_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_prev   text;
  v_counts jsonb;
begin
  if v_uid is null then
    raise exception 'You must be signed in to vote';
  end if;
  if p_player_id is null then
    raise exception 'missing player';
  end if;

  select player_id into v_prev
    from public.goat_votes where user_id = v_uid;

  -- only do work if the pick actually changed
  if v_prev is distinct from p_player_id then
    insert into public.goat_votes (user_id, player_id, updated_at)
         values (v_uid, p_player_id, now())
    on conflict (user_id)
    do update set player_id = excluded.player_id, updated_at = now();

    if v_prev is not null then
      update public.goat_vote_counts
         set count = greatest(count - 1, 0)
       where player_id = v_prev;
    end if;

    insert into public.goat_vote_counts (player_id, count)
         values (p_player_id, 1)
    on conflict (player_id)
    do update set count = public.goat_vote_counts.count + 1;
  end if;

  select coalesce(jsonb_object_agg(player_id, count), '{}'::jsonb)
    into v_counts from public.goat_vote_counts;

  return jsonb_build_object('counts', v_counts, 'pick', p_player_id);
end;
$$;

grant execute on function public.cast_goat_vote(text) to authenticated;

-- 15e) Realtime: push GOAT count changes to all connected clients
do $$
begin
  alter publication supabase_realtime add table public.goat_vote_counts;
exception
  when duplicate_object then null;
end $$;
