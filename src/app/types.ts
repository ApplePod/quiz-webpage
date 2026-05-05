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
  correctAnswer: string;
  hint: string;
  hintCost: number;
  coinReward: number;
}

export interface QuestionStatus {
  questionId: number;
  solvedByTeams: string[]; // Array of team IDs that solved this question
  solveCount: number; // Number of teams that have solved (0-3)
}

export type ViewType = 'main' | 'team-selection' | 'password' | 'answer';

export interface QuizState {
  currentView: ViewType;
  selectedQuestionId: number | null;
  selectedTeam: Team | null;
  timeRemaining: number; // in seconds
  questionStatuses: QuestionStatus[];
}
