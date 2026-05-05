import React, { useCallback, useEffect, useState } from 'react';
import { MainScreen } from './components/MainScreen';
import { TeamSelection } from './components/TeamSelection';
import { PasswordAuth } from './components/PasswordAuth';
import { AnswerScreen } from './components/AnswerScreen';
import { AdminAuth } from './components/AdminAuth';
import { AdminPanel } from './components/AdminPanel';
import { Team, Question, QuestionStatus, ViewType } from './types';
import { initialTeams, initialQuestions } from './data/initialData';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  fetchGameSnapshot,
  requestHint,
  resetAllQuestions,
  resetAllTeams,
  resetQuestion,
  setQuestionLock,
  submitAnswer,
  subscribeToGameChanges,
  updateQuestion,
  updateTeam,
  updateTimer,
  verifyTeamPassword,
} from './services/gameService';

export default function App() {
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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const handleActionError = (actionError: unknown, fallbackMessage: string) => {
    const message =
      actionError instanceof Error ? actionError.message : fallbackMessage;
    setError(message);
  };

  const syncFromSnapshot = useCallback(async () => {
    try {
      const snapshot = await fetchGameSnapshot();
      setTeams(snapshot.teams);
      setQuestions(snapshot.questions);
      setQuestionStatuses(snapshot.questionStatuses);
      setTimeRemaining(snapshot.game.timerSeconds);
      setTimerRunning(snapshot.game.timerRunning);
      setError('');
    } catch (syncError) {
      const message =
        syncError instanceof Error ? syncError.message : 'Failed to sync game state.';
      setError(message);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await syncFromSnapshot();
      setLoading(false);
    })();
  }, [syncFromSnapshot]);

  useEffect(() => {
    let unsubscribe: undefined | (() => void);
    void (async () => {
      unsubscribe = await subscribeToGameChanges(async () => {
        await syncFromSnapshot();
      });
    })();

    return () => {
      unsubscribe?.();
    };
  }, [syncFromSnapshot]);

  const handleQuestionSelect = (questionId: number) => {
    const status = questionStatuses.find((entry) => entry.questionId === questionId);
    if (status && (status.locked || status.solveCount >= 3)) return;
    setSelectedQuestionId(questionId);
    setCurrentView('team-selection');
  };

  const handleTeamSelect = (team: Team) => {
    setSelectedTeam(team);
    setCurrentView('password');
  };

  const handlePasswordSuccess = async (password: string) => {
    if (!selectedTeam) return false;
    try {
      const isValid = await verifyTeamPassword(selectedTeam.id, password);
      if (isValid) {
        setCurrentView('answer');
        return true;
      }
      return false;
    } catch (authError) {
      const message =
        authError instanceof Error ? authError.message : 'Failed to validate team password.';
      setError(message);
      return false;
    }
  };

  const handleLocalAnswerSubmit = (answer: string, teamId: string) => {
    if (!selectedQuestionId) return;
    const question = questions.find((entry) => entry.id === selectedQuestionId);
    if (!question) return;

    const isCorrect = answer.trim().toLowerCase() === question.correctAnswer.toLowerCase();
    if (!isCorrect) return;

    const existingStatus = questionStatuses.find((status) => status.questionId === selectedQuestionId);
    const solveCount = existingStatus?.solveCount ?? 0;
    const reward =
      solveCount === 0
        ? question.coinRewardFirst
        : solveCount === 1
          ? question.coinRewardSecond
          : question.coinRewardThird;

    setQuestionStatuses((previous) => {
      const existing = previous.find((status) => status.questionId === selectedQuestionId);
      if (existing?.solvedByTeams.includes(teamId)) return previous;
      if (existing) {
        const solvedByTeams = [...existing.solvedByTeams, teamId];
        return previous.map((status) =>
          status.questionId === selectedQuestionId
            ? {
                ...status,
                solvedByTeams,
                solveCount: solvedByTeams.length,
                locked: solvedByTeams.length >= 3,
              }
            : status,
        );
      }

      return [
        ...previous,
        { questionId: selectedQuestionId, solvedByTeams: [teamId], solveCount: 1, locked: false },
      ];
    });

    setTeams((previous) =>
      previous.map((team) =>
        team.id === teamId ? { ...team, coins: team.coins + reward } : team,
      ),
    );
  };

  const handleAnswerSubmit = async (answer: string, teamId: string) => {
    if (!selectedQuestionId) return;
    if (!isSupabaseConfigured) {
      handleLocalAnswerSubmit(answer, teamId);
    } else {
      try {
        await submitAnswer(teamId, selectedQuestionId, answer);
        // Pull latest state immediately so the user sees the update
        // even if Realtime delivery is delayed.
        await syncFromSnapshot();
      } catch (submitError) {
        const message =
          submitError instanceof Error ? submitError.message : 'Failed to submit answer.';
        setError(message);
      }
    }

    setTimeout(() => {
      setCurrentView('main');
      setSelectedQuestionId(null);
      setSelectedTeam(null);
    }, 2000);
  };

  const handleHintRequest = async (teamId: string, questionId: number) => {
    const question = questions.find((entry) => entry.id === questionId);
    if (!question) return;

    if (!isSupabaseConfigured) {
      setTeams((previous) =>
        previous.map((team) =>
          team.id === teamId ? { ...team, coins: Math.max(0, team.coins - question.hintCost) } : team,
        ),
      );
      return;
    }

    try {
      await requestHint(teamId, questionId);
      await syncFromSnapshot();
    } catch (hintError) {
      const message =
        hintError instanceof Error ? hintError.message : 'Failed to request hint.';
      setError(message);
    }
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

  const handleUpdateTeam = async (teamId: string, updates: Partial<Team>) => {
    try {
      if (!isSupabaseConfigured) {
        setTeams((previous) =>
          previous.map((team) => (team.id === teamId ? { ...team, ...updates } : team)),
        );
        return;
      }
      await updateTeam(teamId, updates);
      await syncFromSnapshot();
    } catch (actionError) {
      handleActionError(actionError, 'Failed to update team.');
    }
  };

  const handleUpdateQuestion = async (questionId: number, updates: Partial<Question>) => {
    try {
      if (!isSupabaseConfigured) {
        setQuestions((previous) =>
          previous.map((question) =>
            question.id === questionId ? { ...question, ...updates } : question,
          ),
        );
        return;
      }
      await updateQuestion(questionId, updates);
      await syncFromSnapshot();
    } catch (actionError) {
      handleActionError(actionError, 'Failed to update question.');
    }
  };

  const handleResetQuestion = async (questionId: number) => {
    try {
      if (!isSupabaseConfigured) {
        setQuestionStatuses((previous) =>
          previous.filter((status) => status.questionId !== questionId),
        );
        return;
      }
      await resetQuestion(questionId);
      await syncFromSnapshot();
    } catch (actionError) {
      handleActionError(actionError, 'Failed to reset this question.');
    }
  };

  const handleResetAllQuestions = async () => {
    try {
      if (!isSupabaseConfigured) {
        setQuestionStatuses([]);
        return;
      }
      await resetAllQuestions();
      await syncFromSnapshot();
    } catch (actionError) {
      handleActionError(actionError, 'Failed to reset all questions.');
    }
  };

  const handleResetAllTeams = async () => {
    try {
      if (!isSupabaseConfigured) {
        setTeams(initialTeams);
        return;
      }
      await resetAllTeams();
      await syncFromSnapshot();
    } catch (actionError) {
      handleActionError(actionError, 'Failed to reset all teams.');
    }
  };

  const handleResetTimer = async () => {
    try {
      if (isSupabaseConfigured) {
        await updateTimer(7200, false);
        await syncFromSnapshot();
        return;
      }
      setTimeRemaining(7200);
      setTimerRunning(false);
    } catch (actionError) {
      handleActionError(actionError, 'Failed to reset timer.');
    }
  };

  const handleToggleTimer = async () => {
    try {
      if (isSupabaseConfigured) {
        await updateTimer(timeRemaining, !timerRunning);
        await syncFromSnapshot();
        return;
      }
      setTimerRunning((previous) => !previous);
    } catch (actionError) {
      handleActionError(actionError, 'Failed to toggle timer.');
    }
  };

  const handleManualLockQuestion = async (questionId: number, locked: boolean) => {
    try {
      if (!isSupabaseConfigured) {
        setQuestionStatuses((previous) => {
          const existing = previous.find((status) => status.questionId === questionId);
          if (!existing) {
            return [...previous, { questionId, solvedByTeams: [], solveCount: locked ? 3 : 0, locked }];
          }
          return previous.map((status) =>
            status.questionId === questionId
              ? { ...status, solveCount: locked ? 3 : 0, locked }
              : status,
          );
        });
        return;
      }
      await setQuestionLock(questionId, locked);
      await syncFromSnapshot();
    } catch (actionError) {
      handleActionError(actionError, 'Failed to change lock status.');
    }
  };

  const currentQuestion = selectedQuestionId
    ? questions.find((q) => q.id === selectedQuestionId)
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center text-white">
        Loading realtime quiz...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-3/4 left-3/4 w-64 h-64 bg-pink-500/20 rounded-full blur-2xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/15 p-3 text-sm text-red-100">
            {error}
          </div>
        )}

        {!isSupabaseConfigured && (
          <div className="mb-4 rounded-lg border border-yellow-500/40 bg-yellow-500/15 p-3 text-sm text-yellow-100">
            Supabase 환경변수가 없어 로컬 모드로 실행 중입니다. 멀티유저 실시간 동기화는 비활성화됩니다.
          </div>
        )}

        {/* View Rendering */}
        {currentView === 'main' && (
          <MainScreen
            teams={teams}
            questions={questions}
            questionStatuses={questionStatuses}
            timeRemaining={timeRemaining}
            timerRunning={timerRunning}
            onQuestionSelect={handleQuestionSelect}
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
