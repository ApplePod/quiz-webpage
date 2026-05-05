import React, { useState } from 'react';
import { MainScreen } from './components/MainScreen';
import { TeamSelection } from './components/TeamSelection';
import { PasswordAuth } from './components/PasswordAuth';
import { AnswerScreen } from './components/AnswerScreen';
import { AdminAuth } from './components/AdminAuth';
import { AdminPanel } from './components/AdminPanel';
import { Team, Question, QuestionStatus, ViewType } from './types';
import { initialTeams, initialQuestions } from './data/initialData';

export default function App() {
  // State management
  const [currentView, setCurrentView] = useState<ViewType>('main');
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(7200); // 2 hours in seconds
  const [timerRunning, setTimerRunning] = useState<boolean>(true);
  const [questionStatuses, setQuestionStatuses] = useState<QuestionStatus[]>([]);
  const [showAdminAuth, setShowAdminAuth] = useState<boolean>(false);
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);

  // Handlers
  const handleQuestionSelect = (questionId: number) => {
    // Check if question is locked (3 teams have solved it)
    const status = questionStatuses.find((s) => s.questionId === questionId);
    if (status && status.solveCount >= 3) {
      return; // Question is locked
    }

    setSelectedQuestionId(questionId);
    setCurrentView('team-selection');
  };

  const handleTeamSelect = (team: Team) => {
    setSelectedTeam(team);
    setCurrentView('password');
  };

  const handlePasswordSuccess = () => {
    setCurrentView('answer');
  };

  const handleAnswerSubmit = (answer: string, teamId: string) => {
    if (!selectedQuestionId) return;

    const question = questions.find((q) => q.id === selectedQuestionId);
    if (!question) return;

    const isCorrect = answer.trim().toLowerCase() === question.correctAnswer.toLowerCase();

    // Only update status if answer is correct
    if (isCorrect) {
      setQuestionStatuses((prev) => {
        const existing = prev.find((s) => s.questionId === selectedQuestionId);

        if (existing) {
          // Check if team has already solved this question
          if (existing.solvedByTeams.includes(teamId)) {
            return prev; // Team already solved, no update
          }

          // Add team to solved list
          const newSolvedByTeams = [...existing.solvedByTeams, teamId];
          const newSolveCount = newSolvedByTeams.length;

          return prev.map((s) =>
            s.questionId === selectedQuestionId
              ? { ...s, solvedByTeams: newSolvedByTeams, solveCount: newSolveCount }
              : s
          );
        }

        // Create new status
        return [
          ...prev,
          {
            questionId: selectedQuestionId,
            solvedByTeams: [teamId],
            solveCount: 1,
          },
        ];
      });

      // Update team coins with question's coin reward
      setTeams((prev) =>
        prev.map((t) => (t.id === teamId ? { ...t, coins: t.coins + question.coinReward } : t))
      );
    }

    // Return to main screen
    setTimeout(() => {
      setCurrentView('main');
      setSelectedQuestionId(null);
      setSelectedTeam(null);
    }, 2000);
  };

  const handleHintRequest = (teamId: string, questionId: number) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question) return;

    // Deduct coins
    setTeams((prev) =>
      prev.map((t) =>
        t.id === teamId ? { ...t, coins: Math.max(0, t.coins - question.hintCost) } : t
      )
    );

    // Update selected team to reflect new coin balance
    setSelectedTeam((prev) => {
      if (!prev || prev.id !== teamId) return prev;
      return { ...prev, coins: Math.max(0, prev.coins - question.hintCost) };
    });
  };

  const handleBackToMain = () => {
    setCurrentView('main');
    setSelectedQuestionId(null);
    setSelectedTeam(null);
  };

  const handleBackToTeamSelection = () => {
    setCurrentView('team-selection');
    setSelectedTeam(null);
  };

  const handleTimeUpdate = (newTime: number) => {
    setTimeRemaining(newTime);
  };

  // Admin handlers
  const handleAdminClick = () => {
    setShowAdminAuth(true);
  };

  const handleAdminAuthSuccess = () => {
    setShowAdminAuth(false);
    setShowAdminPanel(true);
  };

  const handleAdminAuthCancel = () => {
    setShowAdminAuth(false);
  };

  const handleAdminPanelClose = () => {
    setShowAdminPanel(false);
  };

  const handleUpdateTeam = (teamId: string, updates: Partial<Team>) => {
    setTeams((prev) =>
      prev.map((t) => (t.id === teamId ? { ...t, ...updates } : t))
    );
  };

  const handleUpdateQuestion = (questionId: number, updates: Partial<Question>) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, ...updates } : q))
    );
  };

  const handleResetQuestion = (questionId: number) => {
    setQuestionStatuses((prev) => prev.filter((s) => s.questionId !== questionId));
  };

  const handleResetAllQuestions = () => {
    setQuestionStatuses([]);
  };

  const handleResetAllTeams = () => {
    setTeams(initialTeams);
  };

  const handleResetTimer = () => {
    setTimeRemaining(7200);
    setTimerRunning(false);
  };

  const handleToggleTimer = () => {
    setTimerRunning((prev) => !prev);
  };

  const handleManualLockQuestion = (questionId: number, locked: boolean) => {
    if (locked) {
      setQuestionStatuses((prev) => {
        const existing = prev.find((s) => s.questionId === questionId);
        if (existing) {
          return prev.map((s) =>
            s.questionId === questionId ? { ...s, solveCount: 3 } : s
          );
        }
        return [...prev, { questionId, solvedByTeams: [], solveCount: 3 }];
      });
    } else {
      setQuestionStatuses((prev) =>
        prev.map((s) =>
          s.questionId === questionId ? { ...s, solveCount: Math.min(s.solveCount, 2) } : s
        )
      );
    }
  };

  // Get current question
  const currentQuestion = selectedQuestionId
    ? questions.find((q) => q.id === selectedQuestionId)
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-3/4 left-3/4 w-64 h-64 bg-pink-500/20 rounded-full blur-2xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* View Rendering */}
        {currentView === 'main' && (
          <MainScreen
            teams={teams}
            questions={questions}
            questionStatuses={questionStatuses}
            timeRemaining={timeRemaining}
            timerRunning={timerRunning}
            onQuestionSelect={handleQuestionSelect}
            onTimeUpdate={handleTimeUpdate}
            onAdminClick={handleAdminClick}
          />
        )}

        {currentView === 'team-selection' && selectedQuestionId && (
          <TeamSelection
            teams={teams}
            selectedQuestionId={selectedQuestionId}
            questionStatuses={questionStatuses}
            onTeamSelect={handleTeamSelect}
            onBack={handleBackToMain}
          />
        )}

        {currentView === 'password' && selectedTeam && selectedQuestionId && (
          <PasswordAuth
            team={selectedTeam}
            selectedQuestionId={selectedQuestionId}
            onSuccess={handlePasswordSuccess}
            onBack={handleBackToTeamSelection}
          />
        )}

        {currentView === 'answer' && selectedTeam && currentQuestion && (
          <AnswerScreen
            team={selectedTeam}
            question={currentQuestion}
            onSubmit={handleAnswerSubmit}
            onHintRequest={handleHintRequest}
            onBack={handleBackToMain}
          />
        )}
      </div>

      {/* Admin Components */}
      {showAdminAuth && (
        <AdminAuth
          onSuccess={handleAdminAuthSuccess}
          onCancel={handleAdminAuthCancel}
        />
      )}

      {showAdminPanel && (
        <AdminPanel
          teams={teams}
          questions={questions}
          questionStatuses={questionStatuses}
          timeRemaining={timeRemaining}
          timerRunning={timerRunning}
          onClose={handleAdminPanelClose}
          onUpdateTeam={handleUpdateTeam}
          onUpdateQuestion={handleUpdateQuestion}
          onResetQuestion={handleResetQuestion}
          onResetAllQuestions={handleResetAllQuestions}
          onResetAllTeams={handleResetAllTeams}
          onResetTimer={handleResetTimer}
          onToggleTimer={handleToggleTimer}
          onManualLockQuestion={handleManualLockQuestion}
        />
      )}
    </div>
  );
}
