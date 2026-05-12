import React, { useMemo, useState } from 'react';
import { QuestionCard } from './QuestionCard';
import { Scoreboard } from './Scoreboard';
import { TimerHeader } from './TimerHeader';
import { AdminButton } from './AdminButton';
import { Team, QuestionStatus, Question } from '../types';
import { Coins, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { directionDigitsToArrows } from '../utils/answerCodec';
import { sameQuestionId } from '../utils/questionIds';

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

const brandAsset = (file: string) =>
  `${import.meta.env.BASE_URL.replace(/\/?$/, '/')}brand/${file}`;

function activeTeamSolvedQuestion(
  activeTeam: Team | null | undefined,
  status: QuestionStatus | undefined,
) {
  if (!activeTeam || !status?.solvedByTeams?.length) return false;
  const aid = String(activeTeam.id);
  return status.solvedByTeams.some((tid) => String(tid) === aid);
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
    () => (lockedQuestionId ? questions.find((q) => sameQuestionId(q.id, lockedQuestionId)) ?? null : null),
    [lockedQuestionId, questions],
  );

  const lockedQuestionStatus = useMemo(
    () =>
      lockedQuestionId
        ? questionStatuses.find((s) => sameQuestionId(s.questionId, lockedQuestionId)) ?? null
        : null,
    [lockedQuestionId, questionStatuses],
  );

  const alreadyRevealedForActiveTeam = Boolean(
    activeTeam && lockedQuestionStatus?.revealedByTeams?.some((id) => String(id) === String(activeTeam.id)),
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
    const status = questionStatuses.find((s) => sameQuestionId(s.questionId, questionId));
    if (activeTeam && activeTeamSolvedQuestion(activeTeam, status)) return;
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
            <div className="flex shrink-0 items-center justify-center">
              <img
                src={brandAsset('logo.svg')}
                alt="BAR-O"
                className="h-12 w-auto max-w-[120px] object-contain sm:h-14 sm:max-w-[140px]"
                draggable={false}
              />
            </div>
            <div>
              <div className="text-[10px] tracking-[0.35em] text-black font-medium">
                윤월주관
              </div>
              <h1 className="text-4xl font-bold text-foreground tracking-tight">BAR-O</h1>
            </div>
          </div>

          {/* Right: Timer */}
          <div className="flex items-center gap-4">
            {activeTeam && (
              <div className="hidden sm:flex items-center gap-3 rounded-2xl border border-border bg-white/60 backdrop-blur px-4 py-2 shadow-[0_10px_24px_rgba(32,26,34,0.10)]">
                <div className="w-8 h-8 border border-border bg-white/70 flex items-center justify-center rounded-xl">
                  <span className="text-sm font-bold text-foreground">{activeTeam.id}</span>
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold text-foreground">{activeTeam.name}</div>
                  <button
                    onClick={onChangeTeam}
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
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
          <div className="mystery-card-solid rounded-2xl p-6">
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
                    const status = questionStatuses.find((s) => sameQuestionId(s.questionId, question.id));
                    const solveCount = status?.solveCount || 0;
                    const solvedByActiveTeam = activeTeamSolvedQuestion(activeTeam, status);
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
        <DialogContent className="bg-white/90 border-border text-foreground overflow-hidden backdrop-blur-md shadow-[0_22px_70px_rgba(32,26,34,0.20)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary/90" />
              정답 궁금해요?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
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
            <div className="rounded-2xl border border-border bg-white/70 p-4">
              <div className="text-sm text-muted-foreground mb-2">정답</div>
              <div className="text-lg font-semibold text-foreground break-words">{answerLabel}</div>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-white/70 p-4">
              <div className="flex items-center gap-2 text-foreground/80">
                <Coins className="w-5 h-5 text-primary/85" />
                <div>
                  <div className="font-semibold">-{REVEAL_COST} 코인</div>
                  <div className="text-sm text-muted-foreground">구매하면 이후엔 무료로 다시 볼 수 있어요.</div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLockedDialogOpen(false)}
              className="border-border text-foreground hover:bg-secondary"
            >
              닫기
            </Button>
            {!alreadyRevealedForActiveTeam && (
              <Button
                onClick={handlePurchaseReveal}
                disabled={!activeTeam || !lockedQuestionId || !onPurchaseAnswerReveal || isPurchasingReveal}
                className="border border-border bg-white/70 text-foreground font-semibold hover:bg-white/90"
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
