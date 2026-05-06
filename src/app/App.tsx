import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MainScreen } from './components/MainScreen';
import { AnswerScreen } from './components/AnswerScreen';
import { AdminAuth } from './components/AdminAuth';
import { AdminPanel } from './components/AdminPanel';
import { IntroScreen } from './components/IntroScreen';
import { TeamAuthScreen } from './components/TeamAuthScreen';
import { Team, Question, QuestionStatus, ViewType } from './types';
import { initialTeams, initialQuestions } from './data/initialData';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  adminMarkAllSolved,
  adminResetGame,
  adminSetTestMode,
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
import { isCorrectForQuestion } from './utils/answerCodec';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('intro');
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
  const tickWriteAccumulator = useRef(0);
  const STORAGE_TEAM_KEY = 'quiz.activeTeamId';

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

  // Restore active team from localStorage (per device)
  useEffect(() => {
    try {
      const storedId = window.localStorage.getItem(STORAGE_TEAM_KEY);
      if (!storedId) return;
      const team = teams.find((t) => t.id === storedId) ?? null;
      if (team) {
        setSelectedTeam(team);
      }
    } catch {
      // ignore
    }
  }, [teams]);

  // Local ticking so the timer visually counts down immediately.
  // When using Supabase, we also persist the remaining time periodically so other clients stay close.
  useEffect(() => {
    if (!timerRunning) return;
    if (timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((previous) => Math.max(0, previous - 1));

      if (!isSupabaseConfigured) return;

      tickWriteAccumulator.current += 1;
      // Persist every 5 seconds to reduce DB writes but keep clients synced.
      if (tickWriteAccumulator.current >= 5) {
        tickWriteAccumulator.current = 0;
        void updateTimer(Math.max(0, timeRemaining - 1), true).catch(() => {
          // Ignore periodic write failures; next snapshot sync will correct.
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timerRunning, timeRemaining]);

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
    if (!selectedTeam) {
      setCurrentView('team-auth');
      return;
    }
    setSelectedQuestionId(questionId);
    setCurrentView('answer');
  };

  const handleAuthenticateTeam = async (teamId: string, password: string) => {
    try {
      const isValid = await verifyTeamPassword(teamId, password);
      return isValid;
    } catch (authError) {
      const message =
        authError instanceof Error ? authError.message : 'Failed to validate team password.';
      setError(message);
      return false;
    }
  };

  const handleTeamAuthenticated = (team: Team) => {
    setSelectedTeam(team);
    try {
      window.localStorage.setItem(STORAGE_TEAM_KEY, team.id);
    } catch {
      // ignore
    }
    setCurrentView('main');
  };

  const handleChangeTeam = () => {
    setSelectedTeam(null);
    try {
      window.localStorage.removeItem(STORAGE_TEAM_KEY);
    } catch {
      // ignore
    }
    setCurrentView('team-auth');
  };

  const handleLocalAnswerSubmit = (answer: string, teamId: string) => {
    if (!selectedQuestionId) return;
    const question = questions.find((entry) => entry.id === selectedQuestionId);
    if (!question) return;

    const currentStatus = questionStatuses.find((status) => status.questionId === selectedQuestionId);
    if (currentStatus && (currentStatus.locked || currentStatus.solveCount >= 3)) {
      setError('이미 3팀이 정답 처리하여 잠긴 문제입니다.');
      return;
    }

    const isCorrect = isCorrectForQuestion(question, answer);
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

    // Guard against race: question can become locked after user entered the answer screen.
    const currentStatus = questionStatuses.find((status) => status.questionId === selectedQuestionId);
    if (currentStatus && (currentStatus.locked || currentStatus.solveCount >= 3)) {
      setError('이미 3팀이 정답 처리하여 잠긴 문제입니다.');
      setTimeout(() => {
        setCurrentView('main');
        setSelectedQuestionId(null);
        setSelectedTeam(null);
      }, 1200);
      return;
    }

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
        tickWriteAccumulator.current = 0;
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
        tickWriteAccumulator.current = 0;
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

  const handleAdminResetGame = async () => {
    try {
      if (!isSupabaseConfigured) {
        setQuestionStatuses([]);
        setTeams(initialTeams);
        setQuestions(initialQuestions);
        setTimeRemaining(7200);
        setTimerRunning(false);
        return;
      }
      await adminResetGame();
      await syncFromSnapshot();
    } catch (actionError) {
      handleActionError(actionError, 'Failed to reset the game.');
    }
  };

  const handleAdminSetTestMode = async () => {
    try {
      if (!isSupabaseConfigured) {
        setTeams((previous) => previous.map((t) => ({ ...t, password: '1' })));
        setQuestions((previous) =>
          previous.map((q) => ({ ...q, questionText: '1', answerType: 'text', correctAnswer: '1' })),
        );
        return;
      }
      await adminSetTestMode();
      await syncFromSnapshot();
    } catch (actionError) {
      handleActionError(actionError, 'Failed to enable test mode.');
    }
  };

  const handleAdminMarkAllSolved = async () => {
    try {
      if (!isSupabaseConfigured) {
        const topTeams = teams.slice().sort((a, b) => a.id.localeCompare(b.id)).slice(0, 3);
        const solvedByTeams = topTeams.map((t) => t.id);
        setQuestionStatuses(
          questions.map((q) => ({
            questionId: q.id,
            solvedByTeams,
            solveCount: 3,
            locked: true,
          })),
        );
        return;
      }
      await adminMarkAllSolved();
      await syncFromSnapshot();
    } catch (actionError) {
      handleActionError(actionError, 'Failed to mark all questions as solved.');
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
        {currentView === 'intro' && (
          <IntroScreen
            onStart={() => setCurrentView(selectedTeam ? 'main' : 'team-auth')}
            onAdminClick={handleAdminClick}
          />
        )}

        {currentView === 'team-auth' && (
          <TeamAuthScreen
            teams={teams}
            onAuthenticate={handleAuthenticateTeam}
            onAuthenticated={handleTeamAuthenticated}
            onBack={() => setCurrentView('intro')}
            onAdminClick={handleAdminClick}
          />
        )}

        {currentView === 'main' && (
          <MainScreen
            teams={teams}
            questions={questions}
            questionStatuses={questionStatuses}
            timeRemaining={timeRemaining}
            timerRunning={timerRunning}
            onQuestionSelect={handleQuestionSelect}
            onAdminClick={handleAdminClick}
            activeTeam={selectedTeam}
            onChangeTeam={handleChangeTeam}
          />
        )}

        {currentView === 'answer' && selectedTeam && currentQuestion && (
          <AnswerScreen
            team={selectedTeam}
            question={currentQuestion}
            solveCount={
              questionStatuses.find((status) => status.questionId === currentQuestion.id)?.solveCount || 0
            }
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
          {...({
            teams,
            questions,
            questionStatuses,
            timeRemaining,
            timerRunning,
            onClose: handleAdminPanelClose,
            onUpdateTeam: handleUpdateTeam,
            onUpdateQuestion: handleUpdateQuestion,
            onResetQuestion: handleResetQuestion,
            onResetAllQuestions: handleResetAllQuestions,
            onResetAllTeams: handleResetAllTeams,
            onResetTimer: handleResetTimer,
            onToggleTimer: handleToggleTimer,
            onManualLockQuestion: handleManualLockQuestion,
            onAdminResetGame: handleAdminResetGame,
            onAdminSetTestMode: handleAdminSetTestMode,
            onAdminMarkAllSolved: handleAdminMarkAllSolved,
          } as any)}
        />
      )}
    </div>
  );
}
