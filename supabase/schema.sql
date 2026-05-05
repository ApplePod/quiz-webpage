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
  hint_cost integer not null default 10 check (hint_cost >= 0),
  coin_reward integer not null default 20 check (coin_reward >= 0),
  created_at timestamptz not null default now(),
  unique (game_id, question_no)
);

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
        select id, question_no, question_text, correct_answer, hint, hint_cost, coin_reward
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
              select jsonb_agg(t.team_code order by t.team_code)
              from question_solves qsv
              join teams t on t.id = qsv.team_id
              where qsv.question_id = q.id and qsv.game_id = q.game_id
            ),
            '[]'::jsonb
          ) as solved_by_teams
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

  select exists (
    select 1 from question_solves
    where game_id = v_game_id and question_id = v_question.id and team_id = v_team.id
  ) into v_existing_solve;

  if v_existing_solve then
    return jsonb_build_object('isCorrect', true, 'alreadySolved', true);
  end if;

  insert into question_solves (game_id, question_id, team_id)
  values (v_game_id, v_question.id, v_team.id);

  update teams
  set coins = coins + v_question.coin_reward
  where id = v_team.id;

  insert into question_status (game_id, question_id, solve_count, locked)
  values (v_game_id, v_question.id, 1, false)
  on conflict (game_id, question_id)
  do update set
    solve_count = least(3, question_status.solve_count + 1),
    locked = (least(3, question_status.solve_count + 1) >= 3),
    updated_at = now()
  returning id into v_status_id;

  return jsonb_build_object('isCorrect', true, 'alreadySolved', false);
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

  update teams
  set coins = greatest(0, coins - v_question.hint_cost)
  where id = v_team.id;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.request_hint(text, text, integer) to anon, authenticated;

drop publication if exists supabase_realtime_quiz;

create publication supabase_realtime_quiz for table
  public.games,
  public.teams,
  public.questions,
  public.question_status,
  public.question_solves,
  public.submissions;
