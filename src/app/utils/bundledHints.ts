import type { Question } from '../types'

/** Public assets: `public/hints/{question_no}.png` → served as `/hints/{question_no}.png` */
export function bundledHintImageUrl(questionNo: number): string {
  const base = import.meta.env.BASE_URL || '/'
  const prefix = base.endsWith('/') ? base : `${base}/`
  return `${prefix}hints/${questionNo}.png`
}

/** 모든 문제 힌트를 번들 이미지(`문제번호.png`)로 고정합니다. */
export function withBundledHintImages(questions: Question[]): Question[] {
  return questions.map((q) => ({
    ...q,
    hintType: 'image',
    hintImageUrl: bundledHintImageUrl(q.id),
    hint: '',
  }))
}
