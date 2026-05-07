import React, { useMemo, useState } from 'react';
import { QuestionCard } from './QuestionCard';
import { Scoreboard } from './Scoreboard';
import { TimerHeader } from './TimerHeader';
import { AdminButton } from './AdminButton';
import { Team, QuestionStatus, Question } from '../types';
import { BookOpen, Coins, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { directionDigitsToArrows } from '../utils/answerCodec';

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
  onPurchaseAnswerReveal?: (teamId: string, questionId: number, cost?: number) => Promise<any> | any;
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
  onPurchaseAnswerReveal,
}: MainScreenProps) {
  const [lockedDialogOpen, setLockedDialogOpen] = useState(false);
  const [lockedQuestionId, setLockedQuestionId] = useState<number | null>(null);
  const [isPurchasingReveal, setIsPurchasingReveal] = useState(false);
  const [revealError, setRevealError] = useState<string>('');
  const REVEAL_COST = 10;

  const lockedQuestion = useMemo(
    () => (lockedQuestionId ? questions.find((q) => q.id === lockedQuestionId) ?? null : null),
    [lockedQuestionId, questions],
  );

  const lockedQuestionStatus = useMemo(
    () =>
      lockedQuestionId
        ? questionStatuses.find((s) => s.questionId === lockedQuestionId) ?? null
        : null,
    [lockedQuestionId, questionStatuses],
  );

  const alreadyRevealedForActiveTeam = Boolean(
    activeTeam && lockedQuestionStatus?.revealedByTeams?.includes(activeTeam.id),
  );

  const answerLabel = useMemo(() => {
    if (!lockedQuestion) return '';
    if (lockedQuestion.answerType === 'directionLock' && Array.isArray(lockedQuestion.correctAnswer)) {
      return `${directionDigitsToArrows(lockedQuestion.correctAnswer)}  [${lockedQuestion.correctAnswer.join(', ')}]`;
    }
    return String(lockedQuestion.correctAnswer ?? '');
  }, [lockedQuestion]);

  const openLockedDialog = (questionId: number) => {
    // Already-solved teams should not see the reveal prompt.
    const status = questionStatuses.find((s) => s.questionId === questionId);
    if (activeTeam && status?.solvedByTeams?.includes(activeTeam.id)) return;
    setRevealError('');
    setLockedQuestionId(questionId);
    setLockedDialogOpen(true);
  };

  const handlePurchaseReveal = async () => {
    if (!activeTeam) return;
    if (!lockedQuestionId) return;
    if (!onPurchaseAnswerReveal) return;
    setRevealError('');
    setIsPurchasingReveal(true);
    try {
      const res = await onPurchaseAnswerReveal(activeTeam.id, lockedQuestionId, REVEAL_COST);
      if (res?.ok === false && res?.reason === 'insufficient_coins') {
        setRevealError('코인이 부족합니다.');
      } else if (res?.ok === false && res?.reason === 'not_locked') {
        setRevealError('이 문제는 아직 잠긴 문제가 아니에요.');
      } else if (res?.ok === false) {
        setRevealError('정답 보기를 구매할 수 없어요.');
      }
      // success will reflect via snapshot/state updates
    } catch {
      setRevealError('정답 보기를 구매할 수 없어요.');
    } finally {
      setIsPurchasingReveal(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header with Title and Timer */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-6">
          {/* Left: Title Section */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 border border-white/40 bg-black/50 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.08)]">
              <BookOpen className="w-8 h-8 text-white/90" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white tracking-tight">Quiz Competition</h1>
              <p className="text-gray-300 mt-1">Select a question to begin</p>
            </div>
          </div>

          {/* Right: Timer */}
          <div className="flex items-center gap-4">
            {activeTeam && (
              <div className="hidden sm:flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-2">
                <div className="w-8 h-8 border border-white/40 bg-black/40 flex items-center justify-center">
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
          <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/20 p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-6">Questions</h2>
            {/* 5x5 stays fixed; cells scale with viewport (clamp) and scroll when needed */}
            <div
              className="-mx-6 px-6 overflow-x-auto"
              style={
                {
                  ['--cell' as any]: 'clamp(64px, 12vw, 132px)',
                  ['--gap' as any]: 'clamp(8px, 1.8vw, 16px)',
                } as React.CSSProperties
              }
            >
              <div className="w-fit mx-auto pb-1">
                <div className="grid grid-cols-[repeat(5,var(--cell))] gap-[var(--gap)]">
                  {questions.map((question) => {
                    const status = questionStatuses.find((s) => s.questionId === question.id);
                    const solveCount = status?.solveCount || 0;
                    const solvedByActiveTeam = Boolean(activeTeam && status?.solvedByTeams?.includes(activeTeam.id));
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
                        solvedByActiveTeam={solvedByActiveTeam}
                        onLockedClick={() => {
                          if (solvedByActiveTeam) return;
                          openLockedDialog(question.id);
                        }}
                        onClick={() => onQuestionSelect(question.id)}
                      />
                    );
                  })}
                </div>
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

      {/* Locked question dialog */}
      <Dialog open={lockedDialogOpen} onOpenChange={setLockedDialogOpen}>
        <DialogContent className="bg-gray-900/95 border-white/20 text-white overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-300" />
              정답 궁금해요?
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              {alreadyRevealedForActiveTeam
                ? '이미 구매한 정답입니다.'
                : `궁금하면 ${REVEAL_COST}코인으로 정답을 볼 수 있어요.`}
            </DialogDescription>
          </DialogHeader>

          {revealError && (
            <div className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {revealError}
            </div>
          )}

          {alreadyRevealedForActiveTeam ? (
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="text-sm text-gray-300 mb-2">정답</div>
              <div className="text-lg font-semibold text-white break-words">{answerLabel}</div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center gap-2 text-gray-200">
                <Coins className="w-5 h-5 text-yellow-300" />
                <div>
                  <div className="font-semibold">-{REVEAL_COST} 코인</div>
                  <div className="text-sm text-gray-400">구매하면 이후엔 무료로 다시 볼 수 있어요.</div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLockedDialogOpen(false)}
              className="border-white/30 text-white hover:bg-white/10"
            >
              닫기
            </Button>
            {!alreadyRevealedForActiveTeam && (
              <Button
                onClick={handlePurchaseReveal}
                disabled={!activeTeam || !lockedQuestionId || !onPurchaseAnswerReveal || isPurchasingReveal}
                className="border border-white/40 bg-transparent text-white font-semibold hover:bg-white/10"
              >
                {isPurchasingReveal ? '구매 중...' : `정답 보기 (-${REVEAL_COST})`}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
