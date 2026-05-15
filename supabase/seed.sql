-- Demo seed for realtime quiz room
insert into public.games (code, name, timer_seconds, timer_running)
values ('demo-room', 'Modern Quiz Room', 7200, false)
on conflict (code) do update set
  name = excluded.name,
  timer_seconds = excluded.timer_seconds,
  timer_running = excluded.timer_running;

with game_ref as (
  select id from public.games where code = 'demo-room'
)
insert into public.teams (game_id, team_code, name, participant_name, gender, participants, coins, password)
select
  game_ref.id,
  v.team_code,
  v.name,
  v.participant_name,
  nullif(trim(v.gender), ''),
  v.participants,
  v.coins,
  v.password
from game_ref,
(
  values
    (
      'A',
      '팀 A',
      '준우',
      'F',
      jsonb_build_array(
        jsonb_build_object('name', '준우', 'gender', 'F'),
        jsonb_build_object('name', '비누', 'gender', 'F'),
        jsonb_build_object('name', 'with', 'gender', 'M')
      ),
      0,
      '1'
    ),
    (
      'B',
      '팀 B',
      '알려줘21',
      'F',
      jsonb_build_array(
        jsonb_build_object('name', '알려줘21', 'gender', 'F'),
        jsonb_build_object('name', '겨란후라이', 'gender', 'F'),
        jsonb_build_object('name', '프위메', 'gender', 'M')
      ),
      0,
      '1'
    ),
    (
      'C',
      '팀 C',
      '에르나',
      'F',
      jsonb_build_array(
        jsonb_build_object('name', '에르나', 'gender', 'F'),
        jsonb_build_object('name', '이부리', 'gender', 'F'),
        jsonb_build_object('name', '깡지', 'gender', 'M')
      ),
      0,
      '1'
    ),
    (
      'D',
      '팀 D',
      '포틀',
      'F',
      jsonb_build_array(
        jsonb_build_object('name', '포틀', 'gender', 'F'),
        jsonb_build_object('name', '체리2', 'gender', 'F'),
        jsonb_build_object('name', '인계동카카시', 'gender', 'M')
      ),
      0,
      '1'
    ),
    (
      'E',
      '팀 E',
      '몬지(논알콜)',
      'M',
      jsonb_build_array(
        jsonb_build_object('name', '몬지(논알콜)', 'gender', 'M'),
        jsonb_build_object('name', '냥녕늉', 'gender', 'M'),
        jsonb_build_object('name', '변산', 'gender', 'M')
      ),
      0,
      '1'
    )
) as v(team_code, name, participant_name, gender, participants, coins, password)
on conflict (game_id, team_code) do update set
  name = excluded.name,
  participant_name = excluded.participant_name,
  gender = excluded.gender,
  participants = excluded.participants,
  coins = excluded.coins,
  password = excluded.password;

-- Remove legacy 6th team when re-seeding
with game_ref as (
  select id from public.games where code = 'demo-room'
)
delete from public.teams t
using game_ref g
where t.game_id = g.id and t.team_code = 'F';

with game_ref as (
  select id from public.games where code = 'demo-room'
)
insert into public.questions (
  game_id,
  question_no,
  question_text,
  correct_answer,
  hint,
  hint_type,
  hint_image_url,
  hint_cost,
  coin_reward_first,
  coin_reward_second,
  coin_reward_third
)
select
  game_ref.id,
  valueset.question_no,
  valueset.question_text,
  valueset.correct_answer,
  valueset.hint,
  'text',
  null,
  valueset.hint_cost,
  valueset.coin_reward_first,
  valueset.coin_reward_second,
  valueset.coin_reward_third
from game_ref,
(
  values
    (1, '소개팅 메뉴 고민', '하와이안피자', '', 10, 20, 15, 10),
    (2, '소개팅 장소로 가는 길', '176', '', 10, 20, 15, 10),
    (3, '바오피자의 이번주 메뉴', 'PASTA', '', 10, 20, 15, 10),
    (4, '그녀에게 장미를', '미정', '정답 숫자 미정 — 어드민에서 수정하세요.', 10, 20, 15, 10),
    (5, '미남이 타고 온 것', '아이스티', '', 10, 20, 15, 10),
    (6, 'MBTI 궁합', 'ENTP', '', 10, 20, 15, 10),
    (7, '삐삐 <미완성>', '사랑해', '', 10, 20, 15, 10),
    (8, '바오거리에 뿌려진 명함들', '꿈의포문', '', 10, 20, 15, 10),
    (9, '낮의 거리', '{"type":"directionLock","answer":[3,1,3,1]}', '', 10, 20, 15, 10),
    (10, '유명한 타로집', '아이유', '', 10, 20, 15, 10),
    (11, '타로로 보는 우리의 궁합', '운명', '', 10, 20, 15, 10),
    (12, '바오 북카페의 추천 메뉴', 'CAFE', '', 10, 20, 15, 10),
    (13, '바오 북카페 와이파이', 'CONNECTED', '', 10, 20, 15, 10),
    (14, '무너진 책들', '다시무너뜨리자', '', 10, 20, 15, 10),
    (15, '컬러링북', '비커', '', 10, 20, 15, 10),
    (16, '안녕, 북카페', '주차장', '', 10, 20, 15, 10),
    (17, '노래방에서', '29177', '', 10, 20, 15, 10),
    (18, '노래방 리모컨 <미완성>', '{"type":"directionLock","answer":[1,2,3,4]}', '방향 미정 — 어드민에서 수정하세요.', 10, 20, 15, 10),
    (19, '밤의 거리', 'SPARK', '', 10, 20, 15, 10),
    (20, '바오네컷', 'POSE', '', 10, 20, 15, 10),
    (21, '미녀씨는 마치 ...', 'CUTE', '', 10, 20, 15, 10),
    (22, '바오 숨겨진 메뉴 <미완성>', '바보들', '', 10, 20, 15, 10),
    (23, '이름 궁합 이벤트', '한뼘사이', '', 10, 20, 15, 10),
    (24, '애프터 신청', '603', '', 10, 20, 15, 10),
    (25, '탈출구는 어디에?', '{"type":"directionLock","answer":[3,1,3,2,4,1,4,2,3,2,4,1,4,2,4,1,3,1,4,1,3]}', '', 10, 20, 15, 10)
) as valueset(question_no, question_text, correct_answer, hint, hint_cost, coin_reward_first, coin_reward_second, coin_reward_third)
on conflict (game_id, question_no) do update set
  question_text = excluded.question_text,
  correct_answer = excluded.correct_answer,
  hint = excluded.hint,
  hint_type = excluded.hint_type,
  hint_image_url = excluded.hint_image_url,
  hint_cost = excluded.hint_cost,
  coin_reward_first = excluded.coin_reward_first,
  coin_reward_second = excluded.coin_reward_second,
  coin_reward_third = excluded.coin_reward_third;
