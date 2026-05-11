-- Supabase schema for realtime quiz MVP
create extension if not exists "pgcrypto";

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null default 'Realtime Quiz Room',
  timer_seconds integer not null default 7200 check (timer_seconds >= 0),
  timer_running boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  team_code text not null,
  name text not null,
  coins integer not null default 100 check (coins >= 0),
  password text not null,
  created_at timestamptz not null default now(),
  unique (game_id, team_code)
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  question_no integer not null check (question_no > 0),
  question_text text not null,
  correct_answer text not null,
  hint text not null,
  hint_type text not null default 'text' check (hint_type in ('text', 'image')),
  hint_image_url text,
  hint_cost integer not null default 10 check (hint_cost >= 0),
  coin_reward_first integer not null default 20 check (coin_reward_first >= 0),
  coin_reward_second integer not null default 15 check (coin_reward_second >= 0),
  coin_reward_third integer not null default 10 check (coin_reward_third >= 0),
  created_at timestamptz not null default now(),
  unique (game_id, question_no)
);

-- Migration helper: if `questions` already existed (older schema), add missing tiered columns.
alter table public.questions
  add column if not exists coin_reward_first integer;
alter table public.questions
  add column if not exists coin_reward_second integer;
alter table public.questions
  add column if not exists coin_reward_third integer;
alter table public.questions
  add column if not exists hint_type text;
alter table public.questions
  add column if not exists hint_image_url text;

do $$
begin
  update public.questions
  set hint_type = coalesce(hint_type, 'text');

  begin
    alter table public.questions alter column hint_type set not null;
  exception when others then null; end;

  begin
    alter table public.questions alter column hint_type set default 'text';
  exception when others then null; end;

  begin
    alter table public.questions
      add constraint questions_hint_type_check
      check (hint_type in ('text', 'image'));
  exception when others then null; end;
end $$;

do $$
begin
  -- Backfill defaults from legacy `coin_reward` if it exists; otherwise use safe defaults.
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'questions'
      and column_name = 'coin_reward'
  ) then
    execute $sql$
      update public.questions
      set
        coin_reward_first = coalesce(coin_reward_first, coin_reward, 20),
        coin_reward_second = coalesce(coin_reward_second, greatest(0, floor(coin_reward * 0.6)::int), 15),
        coin_reward_third = coalesce(coin_reward_third, greatest(0, floor(coin_reward * 0.3)::int), 10)
    $sql$;
  else
    update public.questions
    set
      coin_reward_first = coalesce(coin_reward_first, 20),
      coin_reward_second = coalesce(coin_reward_second, 15),
      coin_reward_third = coalesce(coin_reward_third, 10);
  end if;

  -- Ensure constraints/defaults exist even when columns were added via ALTER.
  begin
    alter table public.questions alter column coin_reward_first set not null;
  exception when others then null; end;
  begin
    alter table public.questions alter column coin_reward_second set not null;
  exception when others then null; end;
  begin
    alter table public.questions alter column coin_reward_third set not null;
  exception when others then null; end;

  begin
    alter table public.questions alter column coin_reward_first set default 20;
  exception when others then null; end;
  begin
    alter table public.questions alter column coin_reward_second set default 15;
  exception when others then null; end;
  begin
    alter table public.questions alter column coin_reward_third set default 10;
  exception when others then null; end;
end $$;

create table if not exists public.question_status (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  solve_count integer not null default 0 check (solve_count >= 0 and solve_count <= 3),
  locked boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (game_id, question_id)
);

create table if not exists public.question_solves (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (game_id, question_id, team_id)
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  answer text not null,
  is_correct boolean not null,
  used_hint boolean not null default false,
  created_at timestamptz not null default now()
);

-- Hint purchases (per team, per question)
create table if not exists public.hint_purchases (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (game_id, question_id, team_id)
);

alter table public.hint_purchases enable row level security;

drop policy if exists "Public read hint_purchases" on public.hint_purchases;
create policy "Public read hint_purchases" on public.hint_purchases
for select using (true);

drop policy if exists "Public write hint_purchases_insert" on public.hint_purchases;
create policy "Public write hint_purchases_insert" on public.hint_purchases
for insert with check (true);

drop policy if exists "Public write hint_purchases_delete" on public.hint_purchases;
create policy "Public write hint_purchases_delete" on public.hint_purchases
for delete using (true);

-- Answer reveals (only for locked questions; per team, per question)
create table if not exists public.answer_reveals (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (game_id, question_id, team_id)
);

alter table public.answer_reveals enable row level security;

drop policy if exists "Public read answer_reveals" on public.answer_reveals;
create policy "Public read answer_reveals" on public.answer_reveals
for select using (true);

drop policy if exists "Public write answer_reveals_insert" on public.answer_reveals;
create policy "Public write answer_reveals_insert" on public.answer_reveals
for insert with check (true);

drop policy if exists "Public write answer_reveals_delete" on public.answer_reveals;
create policy "Public write answer_reveals_delete" on public.answer_reveals
for delete using (true);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists games_touch_updated_at on public.games;
create trigger games_touch_updated_at
before update on public.games
for each row execute function public.touch_updated_at();

drop trigger if exists question_status_touch_updated_at on public.question_status;
create trigger question_status_touch_updated_at
before update on public.question_status
for each row execute function public.touch_updated_at();

alter table public.games enable row level security;
alter table public.teams enable row level security;
alter table public.questions enable row level security;
alter table public.question_status enable row level security;
alter table public.question_solves enable row level security;
alter table public.submissions enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;

drop policy if exists "Public read games" on public.games;
create policy "Public read games" on public.games
for select using (true);

drop policy if exists "Public read teams" on public.teams;
create policy "Public read teams" on public.teams
for select using (true);

drop policy if exists "Public read questions" on public.questions;
create policy "Public read questions" on public.questions
for select using (true);

drop policy if exists "Public read question_status" on public.question_status;
create policy "Public read question_status" on public.question_status
for select using (true);

drop policy if exists "Public read question_solves" on public.question_solves;
create policy "Public read question_solves" on public.question_solves
for select using (true);

drop policy if exists "Public read submissions" on public.submissions;
create policy "Public read submissions" on public.submissions
for select using (true);

-- MVP write policies (temporary): allow client-side admin actions to persist.
-- For production, replace these with admin-authenticated RPC-only policies.
drop policy if exists "Public write games" on public.games;
create policy "Public write games" on public.games
for update using (true) with check (true);

drop policy if exists "Public write teams" on public.teams;
create policy "Public write teams" on public.teams
for update using (true) with check (true);

drop policy if exists "Public write questions" on public.questions;
create policy "Public write questions" on public.questions
for update using (true) with check (true);

drop policy if exists "Public write question_status_insert" on public.question_status;
create policy "Public write question_status_insert" on public.question_status
for insert with check (true);

drop policy if exists "Public write question_status_update" on public.question_status;
create policy "Public write question_status_update" on public.question_status
for update using (true) with check (true);

drop policy if exists "Public write question_status_delete" on public.question_status;
create policy "Public write question_status_delete" on public.question_status
for delete using (true);

drop policy if exists "Public write question_solves_insert" on public.question_solves;
create policy "Public write question_solves_insert" on public.question_solves
for insert with check (true);

drop policy if exists "Public write question_solves_delete" on public.question_solves;
create policy "Public write question_solves_delete" on public.question_solves
for delete using (true);

drop policy if exists "Public write submissions_insert" on public.submissions;
create policy "Public write submissions_insert" on public.submissions
for insert with check (true);

create or replace function public.get_game_snapshot(p_game_code text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'game', (
      select row_to_json(g)
      from (
        select id, code, name, timer_seconds, timer_running, created_at, updated_at
        from games
        where code = p_game_code
        limit 1
      ) g
    ),
    'teams', (
      select coalesce(jsonb_agg(t order by t.team_code), '[]'::jsonb)
      from (
        select id, team_code, name, coins, password
        from teams
        where game_id = (select id from games where code = p_game_code limit 1)
      ) t
    ),
    'questions', (
      select coalesce(jsonb_agg(q order by q.question_no), '[]'::jsonb)
      from (
        select id, question_no, question_text, correct_answer, hint, hint_type, hint_image_url, hint_cost, coin_reward_first, coin_reward_second, coin_reward_third
        from questions
        where game_id = (select id from games where code = p_game_code limit 1)
      ) q
    ),
    'question_status', (
      select coalesce(jsonb_agg(s), '[]'::jsonb)
      from (
        select
          q.question_no,
          qs.solve_count,
          qs.locked,
          coalesce(
            (
              select jsonb_agg(t.team_code order by qsv.created_at asc)
              from question_solves qsv
              join teams t on t.id = qsv.team_id
              where qsv.question_id = q.id and qsv.game_id = q.game_id
            ),
            '[]'::jsonb
          ) as solved_by_teams
          ,
          coalesce(
            (
              select jsonb_agg(
                jsonb_build_object(
                  'team_code', t.team_code,
                  'created_at', qsv.created_at
                )
                order by qsv.created_at asc
              )
              from question_solves qsv
              join teams t on t.id = qsv.team_id
              where qsv.question_id = q.id and qsv.game_id = q.game_id
            ),
            '[]'::jsonb
          ) as solved_by
          ,
          coalesce(
            (
              select jsonb_agg(t.team_code order by t.team_code)
              from hint_purchases hp
              join teams t on t.id = hp.team_id
              where hp.question_id = q.id and hp.game_id = q.game_id
            ),
            '[]'::jsonb
          ) as hinted_by_teams
          ,
          coalesce(
            (
              select jsonb_agg(t.team_code order by t.team_code)
              from answer_reveals ar
              join teams t on t.id = ar.team_id
              where ar.question_id = q.id and ar.game_id = q.game_id
            ),
            '[]'::jsonb
          ) as revealed_by_teams
        from questions q
        left join question_status qs
          on qs.question_id = q.id and qs.game_id = q.game_id
        where q.game_id = (select id from games where code = p_game_code limit 1)
      ) s
    )
  );
$$;

grant execute on function public.get_game_snapshot(text) to anon, authenticated;

create or replace function public.submit_answer(
  p_game_code text,
  p_team_code text,
  p_question_no integer,
  p_answer text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game_id uuid;
  v_team record;
  v_question record;
  v_status_id uuid;
  v_is_correct boolean;
  v_existing_solve boolean;
  v_current_solve_count integer;
  v_new_solve_count integer;
  v_reward integer;
begin
  select id into v_game_id from games where code = p_game_code limit 1;
  if v_game_id is null then
    raise exception 'Game not found';
  end if;

  select * into v_team from teams where game_id = v_game_id and team_code = p_team_code limit 1;
  if v_team.id is null then
    raise exception 'Team not found';
  end if;

  select * into v_question from questions where game_id = v_game_id and question_no = p_question_no limit 1;
  if v_question.id is null then
    raise exception 'Question not found';
  end if;

  v_is_correct := lower(trim(p_answer)) = lower(trim(v_question.correct_answer));

  insert into submissions (game_id, question_id, team_id, answer, is_correct)
  values (v_game_id, v_question.id, v_team.id, p_answer, v_is_correct);

  if not v_is_correct then
    return jsonb_build_object('isCorrect', false, 'alreadySolved', false);
  end if;

  -- Serialize solve awarding per (game, question) to prevent race conditions.
  -- This ensures 1st/2nd/3rd rewards are assigned deterministically even under simultaneous submissions.
  perform pg_advisory_xact_lock(
    hashtext(v_game_id::text || ':' || v_question.id::text)
  );

  select exists (
    select 1 from question_solves
    where game_id = v_game_id and question_id = v_question.id and team_id = v_team.id
  ) into v_existing_solve;

  if v_existing_solve then
    return jsonb_build_object('isCorrect', true, 'alreadySolved', true);
  end if;

  -- Determine solve order from the source of truth (unique solves table),
  -- not from the denormalized question_status which can get out of sync.
  select count(*)
  into v_current_solve_count
  from question_solves
  where game_id = v_game_id and question_id = v_question.id;

  if v_current_solve_count >= 3 then
    return jsonb_build_object('isCorrect', true, 'alreadySolved', false, 'locked', true, 'reward', 0);
  end if;

  v_reward := case
    when v_current_solve_count = 0 then v_question.coin_reward_first
    when v_current_solve_count = 1 then v_question.coin_reward_second
    else v_question.coin_reward_third
  end;

  insert into question_solves (game_id, question_id, team_id)
  values (v_game_id, v_question.id, v_team.id);

  select count(*)
  into v_new_solve_count
  from question_solves
  where game_id = v_game_id and question_id = v_question.id;

  update teams
  set coins = coins + v_reward
  where id = v_team.id;

  insert into question_status (game_id, question_id, solve_count, locked)
  values (v_game_id, v_question.id, least(3, v_new_solve_count), (least(3, v_new_solve_count) >= 3))
  on conflict (game_id, question_id)
  do update set
    solve_count = least(3, v_new_solve_count),
    locked = (least(3, v_new_solve_count) >= 3),
    updated_at = now()
  returning id into v_status_id;

  return jsonb_build_object('isCorrect', true, 'alreadySolved', false, 'reward', v_reward);
end;
$$;

grant execute on function public.submit_answer(text, text, integer, text) to anon, authenticated;

create or replace function public.request_hint(
  p_game_code text,
  p_team_code text,
  p_question_no integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game_id uuid;
  v_team record;
  v_question record;
  v_already_purchased boolean;
begin
  select id into v_game_id from games where code = p_game_code limit 1;
  if v_game_id is null then
    raise exception 'Game not found';
  end if;

  select * into v_team from teams where game_id = v_game_id and team_code = p_team_code limit 1;
  if v_team.id is null then
    raise exception 'Team not found';
  end if;

  select * into v_question from questions where game_id = v_game_id and question_no = p_question_no limit 1;
  if v_question.id is null then
    raise exception 'Question not found';
  end if;

  select exists(
    select 1 from hint_purchases
    where game_id = v_game_id and question_id = v_question.id and team_id = v_team.id
  ) into v_already_purchased;

  if v_already_purchased then
    return jsonb_build_object('ok', true, 'alreadyPurchased', true);
  end if;

  update teams
  set coins = greatest(0, coins - v_question.hint_cost)
  where id = v_team.id;

  insert into hint_purchases (game_id, question_id, team_id)
  values (v_game_id, v_question.id, v_team.id)
  on conflict (game_id, question_id, team_id) do nothing;

  return jsonb_build_object('ok', true, 'alreadyPurchased', false);
end;
$$;

grant execute on function public.request_hint(text, text, integer) to anon, authenticated;

create or replace function public.purchase_answer_reveal(
  p_game_code text,
  p_team_code text,
  p_question_no integer,
  p_cost integer default 10
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game_id uuid;
  v_team record;
  v_question record;
  v_locked boolean;
  v_already boolean;
begin
  select id into v_game_id from games where code = p_game_code limit 1;
  if v_game_id is null then
    raise exception 'Game not found';
  end if;

  select * into v_team from teams where game_id = v_game_id and team_code = p_team_code limit 1;
  if v_team.id is null then
    raise exception 'Team not found';
  end if;

  select * into v_question from questions where game_id = v_game_id and question_no = p_question_no limit 1;
  if v_question.id is null then
    raise exception 'Question not found';
  end if;

  select coalesce(qs.locked, false)
  into v_locked
  from question_status qs
  where qs.game_id = v_game_id and qs.question_id = v_question.id
  limit 1;

  if not v_locked then
    return jsonb_build_object('ok', false, 'reason', 'not_locked');
  end if;

  select exists(
    select 1 from answer_reveals
    where game_id = v_game_id and question_id = v_question.id and team_id = v_team.id
  ) into v_already;

  if v_already then
    return jsonb_build_object('ok', true, 'alreadyPurchased', true, 'charged', false);
  end if;

  if v_team.coins < p_cost then
    return jsonb_build_object('ok', false, 'reason', 'insufficient_coins');
  end if;

  update teams
  set coins = coins - p_cost
  where id = v_team.id;

  insert into answer_reveals (game_id, question_id, team_id)
  values (v_game_id, v_question.id, v_team.id)
  on conflict (game_id, question_id, team_id) do nothing;

  return jsonb_build_object('ok', true, 'alreadyPurchased', false, 'charged', true);
end;
$$;

grant execute on function public.purchase_answer_reveal(text, text, integer, integer) to anon, authenticated;

-- Admin/test utilities (MVP)
-- Note: these are intentionally permissive for quick testing.
-- For production, restrict execute permissions / add auth checks.

create or replace function public.admin_reset_game(p_game_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game_id uuid;
begin
  select id into v_game_id from games where code = p_game_code limit 1;
  if v_game_id is null then
    raise exception 'Game not found';
  end if;

  delete from submissions where game_id = v_game_id;
  delete from question_solves where game_id = v_game_id;
  delete from question_status where game_id = v_game_id;

  update teams set coins = 0 where game_id = v_game_id;
  update games set timer_seconds = 7200, timer_running = false where id = v_game_id;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.admin_reset_game(text) to anon, authenticated;

create or replace function public.admin_set_test_mode(p_game_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game_id uuid;
begin
  select id into v_game_id from games where code = p_game_code limit 1;
  if v_game_id is null then
    raise exception 'Game not found';
  end if;

  -- Testing convenience: unify passwords and question content/answers.
  update teams set password = '1' where game_id = v_game_id;
  update questions set question_text = '1', correct_answer = '1' where game_id = v_game_id;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.admin_set_test_mode(text) to anon, authenticated;

create or replace function public.admin_mark_all_solved(p_game_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game_id uuid;
begin
  select id into v_game_id from games where code = p_game_code limit 1;
  if v_game_id is null then
    raise exception 'Game not found';
  end if;

  -- Insert up to 3 solve rows per question using first three teams (by team_code).
  with ordered_teams as (
    select id as team_id
    from teams
    where game_id = v_game_id
    order by team_code
    limit 3
  ),
  target_questions as (
    select id as question_id
    from questions
    where game_id = v_game_id
  )
  insert into question_solves (game_id, question_id, team_id)
  select v_game_id, q.question_id, t.team_id
  from target_questions q
  cross join ordered_teams t
  on conflict (game_id, question_id, team_id) do nothing;

  -- Reflect locked state on status table (3/3).
  insert into question_status (game_id, question_id, solve_count, locked)
  select v_game_id, q.id, 3, true
  from questions q
  where q.game_id = v_game_id
  on conflict (game_id, question_id)
  do update set
    solve_count = 3,
    locked = true,
    updated_at = now();

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.admin_mark_all_solved(text) to anon, authenticated;

-- Supabase Realtime listens on the built-in `supabase_realtime` publication.
-- Ensure our tables are included (idempotent).
do $$
begin
  begin
    alter publication supabase_realtime add table public.games;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.teams;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.questions;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.question_status;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.question_solves;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.submissions;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
end $$;
