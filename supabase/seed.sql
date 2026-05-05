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
insert into public.teams (game_id, team_code, name, coins, password)
select game_ref.id, valueset.team_code, valueset.name, valueset.coins, valueset.password
from game_ref,
(
  values
    ('A', 'Group A', 100, 'teamA123'),
    ('B', 'Group B', 100, 'teamB123'),
    ('C', 'Group C', 100, 'teamC123'),
    ('D', 'Group D', 100, 'teamD123'),
    ('E', 'Group E', 100, 'teamE123'),
    ('F', 'Group F', 100, 'teamF123')
) as valueset(team_code, name, coins, password)
on conflict (game_id, team_code) do update set
  name = excluded.name,
  coins = excluded.coins,
  password = excluded.password;

with game_ref as (
  select id from public.games where code = 'demo-room'
)
insert into public.questions (
  game_id,
  question_no,
  question_text,
  correct_answer,
  hint,
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
  valueset.hint_cost,
  valueset.coin_reward_first,
  valueset.coin_reward_second,
  valueset.coin_reward_third
from game_ref,
(
  values
    (1, 'What is the capital of France?', 'Paris', 'Known as the City of Light', 10, 20, 15, 10),
    (2, 'What is 15 x 8?', '120', 'The result is between 100 and 150', 10, 20, 15, 10),
    (3, 'Who wrote Romeo and Juliet?', 'William Shakespeare', 'Famous English playwright', 10, 30, 20, 10),
    (4, 'What is the largest ocean on Earth?', 'Pacific Ocean', 'It borders Asia and the Americas', 10, 20, 15, 10),
    (5, 'What is the chemical symbol for gold?', 'Au', 'From the Latin word Aurum', 10, 25, 15, 10),
    (6, 'How many continents are there?', '7', 'Asia, Africa, North America, South America, Antarctica, Europe, Australia', 10, 20, 15, 10),
    (7, 'Who painted the Mona Lisa?', 'Leonardo da Vinci', 'Italian Renaissance artist', 10, 25, 15, 10),
    (8, 'What is the square root of 144?', '12', 'It is a perfect square between 10 and 15', 10, 20, 15, 10),
    (9, 'What year did World War II end?', '1945', 'Between 1940 and 1950', 10, 25, 15, 10),
    (10, 'Who was the first person to walk on the moon?', 'Neil Armstrong', 'Apollo 11 mission in 1969', 10, 30, 20, 10),
    (11, 'What is the speed of light in vacuum (in m/s)?', '299792458', 'Approximately 3 x 10^8 m/s', 10, 50, 30, 15),
    (12, 'What is the smallest prime number?', '2', 'It is the only even prime number', 10, 30, 20, 10),
    (13, 'What is the longest river in the world?', 'Nile', 'Located in Africa', 10, 30, 20, 10),
    (14, 'How many planets are in our solar system?', '8', 'Pluto is no longer classified as a planet', 10, 20, 15, 10),
    (15, 'What is the capital of Japan?', 'Tokyo', 'One of the most populous cities in the world', 10, 20, 15, 10),
    (16, 'Who discovered penicillin?', 'Alexander Fleming', 'Scottish bacteriologist', 10, 35, 20, 10),
    (17, 'What is the freezing point of water in Celsius?', '0', 'At standard atmospheric pressure', 10, 20, 15, 10),
    (18, 'What is the largest mammal?', 'Blue Whale', 'Lives in the ocean', 10, 25, 15, 10),
    (19, 'How many sides does a hexagon have?', '6', 'Think of a honeycomb cell', 10, 20, 15, 10),
    (20, 'What is the currency of the United Kingdom?', 'Pound Sterling', 'Symbol is GBP pound sign', 10, 20, 15, 10),
    (21, 'What is the smallest country in the world?', 'Vatican City', 'Located in Rome, Italy', 10, 30, 20, 10),
    (22, 'What is the hardest natural substance on Earth?', 'Diamond', 'Used in jewelry and cutting tools', 10, 25, 15, 10),
    (23, 'How many bones are in the adult human body?', '206', 'Between 200 and 210', 10, 35, 20, 10),
    (24, 'What is the largest desert in the world?', 'Antarctica', 'It is a cold desert', 10, 40, 25, 10),
    (25, 'What is the value of Pi to 2 decimal places?', '3.14', 'Used to calculate circumference of a circle', 10, 25, 15, 10)
) as valueset(question_no, question_text, correct_answer, hint, hint_cost, coin_reward_first, coin_reward_second, coin_reward_third)
on conflict (game_id, question_no) do update set
  question_text = excluded.question_text,
  correct_answer = excluded.correct_answer,
  hint = excluded.hint,
  hint_cost = excluded.hint_cost,
  coin_reward_first = excluded.coin_reward_first,
  coin_reward_second = excluded.coin_reward_second,
  coin_reward_third = excluded.coin_reward_third;
