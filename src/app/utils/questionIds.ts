/** Avoid strict-equality misses when API/JSON mixes number vs string (often shows up as Q1 only). */
export function sameQuestionId(a: unknown, b: unknown): boolean {
  return Number(a) === Number(b)
}
