// Team-based Quiz Application Types

export interface TeamParticipant {
  name: string;
  gender?: 'F' | 'M' | null;
}

export interface Team {
  id: string;
  /** 팀명 (스코어보드·관리자 등; 인트로 카드에는 비표시) */
  name: string;
  /** 인트로 등에 표시할 참가자 이름 (레거시·첫 참가자와 동기화 권장) */
  participantName?: string;
  /** 성별 표시 (레거시·첫 참가자와 동기화 권장). 비우면 인트로에서 카드 순서로 F/M 추정 */
  gender?: 'F' | 'M' | null;
  /** 인트로: 참가자 1명당 카드 1장. 비어 있으면 participantName+gender로 1장 */
  participants?: TeamParticipant[];
  coins: number;
  password: string;
}

/** 어드민 팀 저장 시 선택 필드: 팀 코드(team_code) 변경 */
export type TeamAdminUpdate = Partial<Team> & {
  newTeamCode?: string;
};

export interface Question {
  id: number;
  questionText: string;
  answerType: 'text' | 'directionLock';
  correctAnswer: string | number[];
  hintType?: 'text' | 'image';
  hint: string;
  hintImageUrl?: string;
  hintCost: number;
  coinRewardFirst: number;
  coinRewardSecond: number;
  coinRewardThird: number;
}

export interface QuestionStatus {
  questionId: number;
  solvedByTeams: string[]; // Array of team IDs that solved this question
  solvedBy?: { teamId: string; solvedAt: string }[]; // Ordered solve events (server/local time)
  hintedByTeams?: string[]; // Array of team IDs that purchased hint
  revealedByTeams?: string[]; // Array of team IDs that purchased answer reveal
  solveCount: number; // Number of teams that have solved (0-3)
  locked?: boolean;
}

export type ViewType = 'intro' | 'team-auth' | 'main' | 'answer';

export interface QuizState {
  currentView: ViewType;
  selectedQuestionId: number | null;
  selectedTeam: Team | null;
  timeRemaining: number; // in seconds
  questionStatuses: QuestionStatus[];
}

export interface GameMeta {
  code: string;
  name: string;
  timerSeconds: number;
  timerRunning: boolean;
}
