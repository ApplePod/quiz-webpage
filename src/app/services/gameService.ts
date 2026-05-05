import { RealtimeChannel } from '@supabase/supabase-js'
import { initialQuestions, initialTeams } from '../data/initialData'
import { GameMeta, Question, QuestionStatus, Team } from '../types'
import { isSupabaseConfigured, requireSupabase } from '../../lib/supabase'

export interface GameSnapshot {
  game: GameMeta
  teams: Team[]
  questions: Question[]
  questionStatuses: QuestionStatus[]
}

const GAME_CODE = import.meta.env.VITE_GAME_CODE ?? 'demo-room'

function buildLocalSnapshot(): GameSnapshot {
  return {
    game: {
      code: GAME_CODE,
      name: 'Local Quiz Room',
      timerSeconds: 7200,
      timerRunning: false,
    },
    teams: initialTeams,
    questions: initialQuestions,
    questionStatuses: [],
  }
}

function ensureConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
    )
  }
}

function mapSnapshot(payload: any): GameSnapshot {
  const game = payload?.game
  if (!game) {
    throw new Error('Game snapshot is missing game metadata.')
  }

  const teams: Team[] = (payload.teams ?? []).map((team: any) => ({
    id: team.team_code,
    name: team.name,
    coins: team.coins,
    password: team.password,
  }))

  const questions: Question[] = (payload.questions ?? []).map((question: any) => ({
    id: question.question_no,
    questionText: question.question_text,
    correctAnswer: question.correct_answer,
    hint: question.hint,
    hintCost: question.hint_cost,
    coinReward: question.coin_reward,
  }))

  const questionStatuses: QuestionStatus[] = (payload.question_status ?? []).map(
    (status: any) => ({
      questionId: status.question_no,
      solvedByTeams: status.solved_by_teams ?? [],
      solveCount: status.solve_count ?? 0,
      locked: status.locked ?? false,
    }),
  )

  return {
    game: {
      code: game.code,
      name: game.name,
      timerSeconds: game.timer_seconds,
      timerRunning: game.timer_running,
    },
    teams,
    questions,
    questionStatuses,
  }
}

export async function fetchGameSnapshot(): Promise<GameSnapshot> {
  if (!isSupabaseConfigured) {
    return buildLocalSnapshot()
  }

  const supabase = requireSupabase()
  const { data, error } = await supabase.rpc('get_game_snapshot', {
    p_game_code: GAME_CODE,
  })

  if (error) {
    throw error
  }

  return mapSnapshot(data)
}

export async function verifyTeamPassword(teamId: string, password: string): Promise<boolean> {
  if (!isSupabaseConfigured) {
    const team = initialTeams.find((entry) => entry.id === teamId)
    return team?.password === password
  }

  const supabase = requireSupabase()
  const { data, error } = await supabase
    .from('teams')
    .select('password')
    .eq('team_code', teamId)
    .limit(1)
    .single()

  if (error) {
    throw error
  }

  return data.password === password
}

export async function submitAnswer(teamId: string, questionId: number, answer: string) {
  ensureConfigured()
  const supabase = requireSupabase()

  const { error } = await supabase.rpc('submit_answer', {
    p_game_code: GAME_CODE,
    p_team_code: teamId,
    p_question_no: questionId,
    p_answer: answer,
  })

  if (error) {
    throw error
  }
}

export async function requestHint(teamId: string, questionId: number) {
  ensureConfigured()
  const supabase = requireSupabase()
  const { error } = await supabase.rpc('request_hint', {
    p_game_code: GAME_CODE,
    p_team_code: teamId,
    p_question_no: questionId,
  })

  if (error) {
    throw error
  }
}

export async function updateTeam(teamId: string, updates: Partial<Team>) {
  ensureConfigured()
  const supabase = requireSupabase()
  const { error } = await supabase
    .from('teams')
    .update({
      name: updates.name,
      coins: updates.coins,
      password: updates.password,
    })
    .eq('team_code', teamId)

  if (error) {
    throw error
  }
}

export async function updateQuestion(questionId: number, updates: Partial<Question>) {
  ensureConfigured()
  const supabase = requireSupabase()
  const { error } = await supabase
    .from('questions')
    .update({
      question_text: updates.questionText,
      correct_answer: updates.correctAnswer,
      hint: updates.hint,
      hint_cost: updates.hintCost,
      coin_reward: updates.coinReward,
    })
    .eq('question_no', questionId)

  if (error) {
    throw error
  }
}

export async function resetQuestion(questionId: number) {
  ensureConfigured()
  const supabase = requireSupabase()
  const { data: question, error: questionError } = await supabase
    .from('questions')
    .select('id')
    .eq('question_no', questionId)
    .single()

  if (questionError) {
    throw questionError
  }

  const { error: solveError } = await supabase
    .from('question_solves')
    .delete()
    .eq('question_id', question.id)
  if (solveError) {
    throw solveError
  }

  const { error: statusError } = await supabase
    .from('question_status')
    .delete()
    .eq('question_id', question.id)
  if (statusError) {
    throw statusError
  }
}

export async function resetAllQuestions() {
  ensureConfigured()
  const supabase = requireSupabase()
  const { error: solveError } = await supabase.from('question_solves').delete().neq('id', '')
  if (solveError) {
    throw solveError
  }

  const { error: statusError } = await supabase.from('question_status').delete().neq('id', '')
  if (statusError) {
    throw statusError
  }
}

export async function resetAllTeams() {
  ensureConfigured()
  const supabase = requireSupabase()
  const updates = initialTeams.map((team) =>
    supabase
      .from('teams')
      .update({ coins: team.coins, name: team.name, password: team.password })
      .eq('team_code', team.id),
  )
  const results = await Promise.all(updates)

  const failed = results.find((result) => result.error)
  if (failed?.error) {
    throw failed.error
  }
}

export async function updateTimer(timerSeconds: number, timerRunning: boolean) {
  ensureConfigured()
  const supabase = requireSupabase()
  const { error } = await supabase
    .from('games')
    .update({ timer_seconds: timerSeconds, timer_running: timerRunning })
    .eq('code', GAME_CODE)

  if (error) {
    throw error
  }
}

export async function setQuestionLock(questionId: number, locked: boolean) {
  ensureConfigured()
  const supabase = requireSupabase()
  const { data: question, error: questionError } = await supabase
    .from('questions')
    .select('id, game_id')
    .eq('question_no', questionId)
    .single()

  if (questionError) {
    throw questionError
  }

  const solveCount = locked ? 3 : 0
  const { error } = await supabase.from('question_status').upsert({
    game_id: question.game_id,
    question_id: question.id,
    solve_count: solveCount,
    locked,
  })

  if (error) {
    throw error
  }
}

export async function subscribeToGameChanges(onChange: () => Promise<void> | void) {
  if (!isSupabaseConfigured) {
    return () => {}
  }

  const supabase = requireSupabase()
  const channel = supabase.channel(`room:${GAME_CODE}`)

  channel
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'games' },
      () => void onChange(),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'teams' },
      () => void onChange(),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'questions' },
      () => void onChange(),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'question_status' },
      () => void onChange(),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'question_solves' },
      () => void onChange(),
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel as RealtimeChannel)
  }
}
