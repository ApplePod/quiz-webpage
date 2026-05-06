// Team-based Quiz Application Types

export interface Team {
  id: string;
  name: string;
  coins: number;
  password: string;
}

export interface Question {
  id: number;
  questionText: string;
  answerType: 'text' | 'directionLock';
  correctAnswer: string | number[];
  hint: string;
  hintCost: number;
  coinRewardFirst: number;
  coinRewardSecond: number;
  coinRewardThird: number;
}

export interface QuestionStatus {
  questionId: number;
  solvedByTeams: string[]; // Array of team IDs that solved this question
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
