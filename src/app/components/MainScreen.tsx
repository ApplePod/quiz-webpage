import React from 'react';
import { QuestionCard } from './QuestionCard';
import { Scoreboard } from './Scoreboard';
import { TimerHeader } from './TimerHeader';
import { AdminButton } from './AdminButton';
import { Team, QuestionStatus, Question } from '../types';
import { BookOpen, Heart, KeyRound } from 'lucide-react';

interface MainScreenProps {
  teams: Team[];
  questions: Question[];
  questionStatuses: QuestionStatus[];
  timeRemaining: number;
  timerRunning: boolean;
  onQuestionSelect: (questionId: number) => void;
  onAdminClick: () => void;
  activeTeam?: Team | null;
  onChangeTeam?: () => void;
}

export function MainScreen({
  teams,
  questions,
  questionStatuses,
  timeRemaining,
  timerRunning,
  onQuestionSelect,
  onAdminClick,
  activeTeam,
  onChangeTeam,
}: MainScreenProps) {

  return (
    <div className="min-h-screen">
      {/* Header with Title and Timer */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-6">
          {/* Left: Title Section */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 bg-clip-text text-transparent">
                소개팅 방탈출
              </h1>
              <p className="text-gray-300 mt-1 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-200/90" />
                단서를 모아
                <Heart className="w-4 h-4 text-rose-300/90" />
                마음을 열어라
              </p>
            </div>
          </div>

          {/* Right: Timer */}
          <div className="flex items-center gap-4">
            {activeTeam && (
              <div className="hidden sm:flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">{activeTeam.id}</span>
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold text-white">{activeTeam.name}</div>
                  <button
                    onClick={onChangeTeam}
                    className="text-xs text-gray-300 hover:text-white underline underline-offset-2"
                    type="button"
                  >
                    팀 변경
                  </button>
                </div>
              </div>
            )}
            <TimerHeader timeRemaining={timeRemaining} timerRunning={timerRunning} />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Section: Question Grid */}
        <div className="lg:col-span-2">
          <div className="escape-card">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Questions</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {questions.map((question) => {
                const status = questionStatuses.find((s) => s.questionId === question.id);
                const solveCount = status?.solveCount || 0;
                const nextReward =
                  solveCount === 0
                    ? question.coinRewardFirst
                    : solveCount === 1
                      ? question.coinRewardSecond
                      : question.coinRewardThird;
                return (
                  <QuestionCard
                    key={question.id}
                    questionNumber={question.id}
                    coinReward={nextReward}
                    solveCount={solveCount}
                    onClick={() => onQuestionSelect(question.id)}
                  />
                );
              })}
            </div>
            </div>
          </div>
        </div>

        {/* Right Section: Scoreboard */}
        <div className="lg:col-span-1">
          <Scoreboard teams={teams} />
          <AdminButton onClick={onAdminClick} />
        </div>
      </div>
    </div>
  );
}
