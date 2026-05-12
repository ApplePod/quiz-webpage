import type { Team, TeamParticipant } from '../types'

/** 스냅샷 한 줄(participants JSON + 레거시 컬럼) → 통일된 참가자 배열 */
export function mergeParticipantsFromSnapshot(
  participantsRaw: unknown,
  participantName: string,
  genderVal: unknown,
): TeamParticipant[] {
  const fromJson: TeamParticipant[] = []
  if (Array.isArray(participantsRaw)) {
    for (const p of participantsRaw) {
      const name = String((p as { name?: unknown })?.name ?? '').trim()
      if (!name) continue
      const g = (p as { gender?: unknown }).gender
      fromJson.push({
        name,
        gender: g === 'F' || g === 'M' ? g : null,
      })
    }
  }
  if (fromJson.length > 0) return fromJson
  const legacy = participantName.trim()
  if (legacy) {
    const g = genderVal === 'F' || genderVal === 'M' ? genderVal : null
    return [{ name: legacy, gender: g }]
  }
  return []
}

/** DB/어드민용: 팀 한 줄에서 인트로에 나올 참가자 목록 (이름 있는 행만). */
export function participantsListForTeam(team: Team): TeamParticipant[] {
  const fromRows = (team.participants ?? [])
    .map((p) => ({
      name: (p?.name ?? '').trim(),
      gender: p?.gender === 'F' || p?.gender === 'M' ? p.gender : null,
    }))
    .filter((p) => p.name.length > 0)
  if (fromRows.length > 0) return fromRows
  const legacy = (team.participantName ?? '').trim()
  if (!legacy) return []
  const g = team.gender === 'F' || team.gender === 'M' ? team.gender : null
  return [{ name: legacy, gender: g }]
}

export type IntroCard = {
  key: string
  name: string
  gender: 'F' | 'M' | null
}

/** 인트로 캐러셀: 참가자 1명 = 카드 1장 (팀 순서 유지). */
export function flattenIntroCardsFromTeams(teams: Team[]): IntroCard[] {
  const cards: IntroCard[] = []
  for (const team of teams) {
    const parts = participantsListForTeam(team)
    parts.forEach((p, i) => {
      cards.push({
        key: `${team.id}:${i}:${p.name}`,
        name: p.name,
        gender: p.gender === 'F' || p.gender === 'M' ? p.gender : null,
      })
    })
  }
  return cards
}

/** 어드민 편집용 초기 행(최소 1줄). */
export function draftParticipantsForEdit(team: Team): TeamParticipant[] {
  const list = participantsListForTeam(team)
  if (list.length > 0) return list.map((p) => ({ ...p }))
  return [{ name: '', gender: null }]
}
