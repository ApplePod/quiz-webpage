import React from 'react';
import { QuestionCard } from './QuestionCard';
import { Scoreboard } from './Scoreboard';
import { TimerHeader } from './TimerHeader';
import { AdminButton } from './AdminButton';
import { Team, QuestionStatus, Question } from '../types';
import { BookOpen } from 'lucide-react';

interface MainScreenProps {
  teams: Team[];
  questions: Question[];
  questionStatuses: QuestionStatus[];
  timeRemaining: number;
  timerRunning: boolean;
  onQuestionSelect: (questionId: number) => void;
  onAdminClick: () => void;
}

export function MainScreen({
  teams,
  questions,
  questionStatuses,
  timeRemaining,
  timerRunning,
  onQuestionSelect,
  onAdminClick,
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
                Quiz Competition
              </h1>
              <p className="text-gray-300 mt-1">Select a question to begin</p>
            </div>
          </div>

          {/* Right: Timer */}
          <TimerHeader
            timeRemaining={timeRemaining}
            timerRunning={timerRunning}
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Section: Question Grid */}
        <div className="lg:col-span-2">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/20 p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-6">Questions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {questions.map((question) => {
                const status = questionStatuses.find((s) => s.questionId === question.id);
                return (
                  <QuestionCard
                    key={question.id}
                    questionNumber={question.id}
                    coinReward={question.coinRewardFirst}
                    solveCount={status?.solveCount || 0}
                    onClick={() => onQuestionSelect(question.id)}
                  />
                );
              })}
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
