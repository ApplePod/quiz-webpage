import type { Question } from '../types'

type DirectionLockPayload = {
  type: 'directionLock'
  answer: number[]
}

type TextPayload = {
  type: 'text'
  answer: string
}

type Payload = DirectionLockPayload | TextPayload

export function arrowKeyToDirectionDigit(key: string): number | null {
  switch (key) {
    case 'ArrowUp':
      return 1
    case 'ArrowDown':
      return 2
    case 'ArrowRight':
      return 3
    case 'ArrowLeft':
      return 4
    default:
      return null
  }
}

export function parseDirectionDigits(input: string): number[] {
  const trimmed = input.trim()
  if (!trimmed) return []

  // Support compact input like "121212" => [1,2,1,2,1,2]
  if (/^[1-4]+$/.test(trimmed)) {
    return trimmed.split('').map((char) => Number(char))
  }

  const digits = trimmed
    .split(/[,\s]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .flatMap((entry) => {
      // If token itself is a compact digit string, expand it.
      if (/^[1-4]+$/.test(entry)) {
        return entry.split('').map((char) => Number(char))
      }
      const numeric = Number(entry)
      if (!Number.isFinite(numeric)) return []
      const value = Math.trunc(numeric)
      return value >= 1 && value <= 4 ? [value] : []
    })

  return digits
}

export function formatDirectionDigits(answer: number[]): string {
  return answer.join(', ')
}

export function directionDigitsToArrows(answer: number[]): string {
  return answer
    .map((digit) => {
      switch (digit) {
        case 1:
          return '↑'
        case 2:
          return '↓'
        case 3:
          return '→'
        case 4:
          return '←'
        default:
          return '?'
      }
    })
    .join(' ')
}

export function encodeCorrectAnswer(answerType: Question['answerType'], correctAnswer: Question['correctAnswer']): string {
  if (answerType === 'text') {
    return typeof correctAnswer === 'string' ? correctAnswer : ''
  }

  const payload: DirectionLockPayload = {
    type: 'directionLock',
    answer: Array.isArray(correctAnswer) ? correctAnswer : [],
  }
  return JSON.stringify(payload)
}

export function decodeCorrectAnswer(rawCorrectAnswer: unknown): Pick<Question, 'answerType' | 'correctAnswer'> {
  if (typeof rawCorrectAnswer !== 'string') {
    return { answerType: 'text', correctAnswer: '' }
  }

  const trimmed = rawCorrectAnswer.trim()
  if (!trimmed.startsWith('{')) {
    return { answerType: 'text', correctAnswer: rawCorrectAnswer }
  }

  try {
    const parsed = JSON.parse(trimmed) as Partial<Payload>
    if (parsed?.type === 'directionLock' && Array.isArray((parsed as any).answer)) {
      const answer = (parsed as any).answer
        .map((value: any) => Number(value))
        .filter((value: any) => Number.isFinite(value))
        .map((value: number) => Math.trunc(value))
        .filter((value: number) => value >= 1 && value <= 4)
      return { answerType: 'directionLock', correctAnswer: answer }
    }
    if (parsed?.type === 'text' && typeof (parsed as any).answer === 'string') {
      return { answerType: 'text', correctAnswer: (parsed as any).answer }
    }
  } catch {
    // fallthrough to text
  }

  return { answerType: 'text', correctAnswer: rawCorrectAnswer }
}

export function isCorrectForQuestion(question: Question, submittedAnswer: string): boolean {
  if (question.answerType === 'text') {
    const expected = typeof question.correctAnswer === 'string' ? question.correctAnswer : ''
    return submittedAnswer.trim().toLowerCase() === expected.trim().toLowerCase()
  }

  const expected = Array.isArray(question.correctAnswer) ? question.correctAnswer : []
  const decoded = decodeCorrectAnswer(submittedAnswer)
  const actual =
    decoded.answerType === 'directionLock' && Array.isArray(decoded.correctAnswer)
      ? decoded.correctAnswer
      : []

  if (actual.length !== expected.length) return false
  for (let i = 0; i < expected.length; i += 1) {
    if (actual[i] !== expected[i]) return false
  }
  return true
}

