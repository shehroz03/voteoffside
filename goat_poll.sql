-- =====================================================================
--  VoteOffside — GOAT Poll (real shared voting)
--  HOW TO RUN:
--    1. Supabase dashboard → SQL Editor → New query
--    2. Paste THIS WHOLE FILE
--    3. Click  RUN  (bottom-right). Wait for "Success. No rows returned".
--  Safe to run more than once.
-- =====================================================================

-- 1) Tables: one current pick per signed-in user + public aggregate counts
create table if not exists public.goat_votes (
  user_id    uuid        primary key references auth.users(id) on delete cascade,
  player_id  text        not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.goat_vote_counts (
  player_id text    not null primary key,
  count     integer not null default 0
);

-- 2) Row Level Security
alter table public.goat_votes       enable row level security;
alter table public.goat_vote_counts enable row level security;

-- Everyone (even logged-out visitors) can READ the aggregate counts
drop policy if exists "goat_counts_read" on public.goat_vote_counts;
create policy "goat_counts_read" on public.goat_vote_counts
  for select using (true);

-- 3) get_goat_state: public counts (always) + this caller's pick (null if anon)
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

-- 4) cast_goat_vote: records/moves the caller's vote (sign-in required)
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

-- 5) Realtime: push GOAT count changes to all connected clients
do $$
begin
  alter publication supabase_realtime add table public.goat_vote_counts;
exception
  when duplicate_object then null;
end $$;

-- 6) Force PostgREST to refresh its schema cache immediately
notify pgrst, 'reload schema';