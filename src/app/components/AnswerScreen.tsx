import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import confetti from 'canvas-confetti';
import { Team, Question } from '../types';
import {
  ArrowLeft,
  Lightbulb,
  AlertTriangle,
  Send,
  CheckCircle2,
  XCircle,
  Coins,
  Sparkles,
  Unlock,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Delete,
  X,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { motion } from 'motion/react';
import {
  directionDigitsToArrows,
  encodeCorrectAnswer,
  isCorrectForQuestion,
} from '../utils/answerCodec';

interface AnswerScreenProps {
  team: Team;
  question: Question;
  solveCount: number;
  onSubmit: (answer: string, teamId: string) => Promise<any> | any;
  onHintRequest: (teamId: string, questionId: number) => void;
  onBack: () => void;
  hintPurchased?: boolean;
}

export function AnswerScreen({
  team,
  question,
  solveCount,
  onSubmit,
  onHintRequest,
  onBack,
  hintPurchased = false,
}: AnswerScreenProps) {
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const confettiRef = useRef<null | ((options: any) => Promise<null | void> | null)>(null);
  const autoBackTimerRef = useRef<number | null>(null);
  const [answer, setAnswer] = useState('');
  const [displayTeamCoins, setDisplayTeamCoins] = useState<number>(team.coins);
  const [directionDigits, setDirectionDigits] = useState<number[]>([]);
  const [lastDirectionDigit, setLastDirectionDigit] = useState<number | null>(null);
  const [hintModalOpen, setHintModalOpen] = useState(false);
  const [showRechargeNotice, setShowRechargeNotice] = useState(false);
  const [hintRevealed, setHintRevealed] = useState(false);
  const [result, setResult] = useState<'correct' | 'incorrect' | 'locked' | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [pendingSubmitAnswer, setPendingSubmitAnswer] = useState<string | null>(null);
  const [isSubmittingResult, setIsSubmittingResult] = useState(false);
  const [retryShake, setRetryShake] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showWrongFx, setShowWrongFx] = useState(false);
  const [showSolvedFx, setShowSolvedFx] = useState(false);
  const [resolvedReward, setResolvedReward] = useState<number | null>(null);
  const [hintInsufficientCoins, setHintInsufficientCoins] = useState(false);
  const rewardForCurrentOrder =
    solveCount === 0
      ? question.coinRewardFirst
      : solveCount === 1
        ? question.coinRewardSecond
        : question.coinRewardThird;

  const expectedDirectionDigits = useMemo(
    () => (question.answerType === 'directionLock' && Array.isArray(question.correctAnswer) ? question.correctAnswer : []),
    [question.answerType, question.correctAnswer],
  );

  const correctAnswerLabel =
    question.answerType === 'directionLock' && Array.isArray(question.correctAnswer)
      ? `${directionDigitsToArrows(question.correctAnswer)} (${question.correctAnswer.join(', ')})`
      : String(question.correctAnswer ?? '');

  const submitCorrectAnswer = async (submittedAnswer: string) => {
    setIsSubmittingResult(true);
    setResolvedReward(null);
    try {
      const response: any = await onSubmit(submittedAnswer, team.id);
      if (response?.locked) {
        setShowConfetti(false);
        setShowWrongFx(false);
        setShowSolvedFx(false);
        setResult('locked');
        setShowResultDialog(true);
        return;
      }
      if (typeof response?.reward === 'number') {
        setResolvedReward(response.reward);
      }
      setShowSolvedFx(true);
      setShowConfetti(true);
      setShowWrongFx(false);
      setShowResultDialog(true);

      // Auto return home after a short celebration.
      if (autoBackTimerRef.current) window.clearTimeout(autoBackTimerRef.current);
      autoBackTimerRef.current = window.setTimeout(() => {
        onBack();
      }, 3000);
    } finally {
      // Keep the dialog stable; reward text must come from resolvedReward.
      setIsSubmittingResult(false);
    }
  };

  useEffect(() => {
    if (!showRechargeNotice) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowRechargeNotice(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showRechargeNotice]);

  useEffect(() => {
    // While we're in the "correct" flow, ignore ESC so the user can't accidentally
    // dismiss/interrupt and think points didn't apply.
    if (result !== 'correct') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener('keydown', onKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', onKeyDown, { capture: true } as any);
  }, [result]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;

    const isCorrect = isCorrectForQuestion(question, answer);
    setResult(isCorrect ? 'correct' : 'incorrect');
    setShowSolvedFx(false);
    setShowResultDialog(false);
    setShowConfetti(false);
    setShowWrongFx(!isCorrect);

    if (isCorrect) {
      void submitCorrectAnswer(answer);
      return;
    }

    setShowResultDialog(true);
    setRetryShake(true);
    setTimeout(() => setRetryShake(false), 450);
  };

  useEffect(() => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;

    // Use dedicated canvas + worker for smoother tablets (iPad/Galaxy Tab).
    confettiRef.current = confetti.create(canvas, {
      resize: true,
      useWorker: true,
      disableForReducedMotion: true,
    });

    return () => {
      try {
        (confettiRef.current as any)?.reset?.();
      } catch {
        // ignore
      }
      confettiRef.current = null;
    };
  }, []);

  useEffect(() => {
    // Reset input when question changes
    if (autoBackTimerRef.current) window.clearTimeout(autoBackTimerRef.current);
    setAnswer('');
    setDisplayTeamCoins(team.coins);
    setDirectionDigits([]);
    setLastDirectionDigit(null);
    setResult(null);
    setShowResultDialog(false);
    setPendingSubmitAnswer(null);
    setIsSubmittingResult(false);
    setShowConfetti(false);
    setShowWrongFx(false);
    setShowSolvedFx(false);
    setResolvedReward(null);
    setHintRevealed(hintPurchased);
  }, [question.id]);

  useEffect(() => {
    // If the hint gets purchased (e.g., via realtime/snapshot), keep it visible.
    if (hintPurchased) setHintRevealed(true);
  }, [hintPurchased]);

  useEffect(() => {
    // Keep the coin display in sync while NOT showing result dialogs.
    // During result dialogs we intentionally "freeze" it for UX stability.
    if (showResultDialog || result) return;
    setDisplayTeamCoins(team.coins);
  }, [team.coins, showResultDialog, result]);

  useEffect(() => {
    // directionLock input now uses on-screen buttons (mouse/touch-friendly)
    // (We intentionally do not bind keydown here to match the desired UX.)
    return undefined;
  }, [expectedDirectionDigits, onSubmit, question, result, team.id]);

  const pushDirectionDigit = (digit: number) => {
    if (result) return;
    if (question.answerType !== 'directionLock') return;

    setLastDirectionDigit(digit);
    setDirectionDigits((previous) => {
      const next = [...previous, digit];
      const targetLength = expectedDirectionDigits.length || next.length;
      const trimmed = next.slice(0, targetLength);

      if (expectedDirectionDigits.length > 0 && trimmed.length === expectedDirectionDigits.length) {
        const submitted = encodeCorrectAnswer('directionLock', trimmed);
        const isCorrect = isCorrectForQuestion(
          { ...question, answerType: 'directionLock', correctAnswer: expectedDirectionDigits },
          submitted,
        );
        setResult(isCorrect ? 'correct' : 'incorrect');
        setShowSolvedFx(false);
        setShowResultDialog(false);
        setShowConfetti(false);
        setShowWrongFx(!isCorrect);

        if (isCorrect) {
          void submitCorrectAnswer(submitted);
        } else {
          setShowResultDialog(true);
          setRetryShake(true);
          setTimeout(() => setRetryShake(false), 450);
        }
      }

      return trimmed;
    });
  };

  const popDirectionDigit = () => {
    if (result) return;
    setDirectionDigits((previous) => previous.slice(0, -1));
  };

  const resetDirectionDigits = () => {
    if (result) return;
    setDirectionDigits([]);
    setLastDirectionDigit(null);
  };

  const handleRetry = () => {
    setResult(null);
    setShowResultDialog(false);
    setPendingSubmitAnswer(null);
    setIsSubmittingResult(false);
    setShowConfetti(false);
    setShowWrongFx(false);
    setShowSolvedFx(false);
    setResolvedReward(null);
    if (question.answerType === 'text') {
      setAnswer('');
    } else {
      setDirectionDigits([]);
      setLastDirectionDigit(null);
    }
  };

  const handleConfirmCorrect = () => {
    setShowResultDialog(false);
    setShowConfetti(false);
    setShowWrongFx(false);
    setShowSolvedFx(false);
    onBack();
  };

  useEffect(() => {
    if (!showConfetti) return;
    if (result !== 'correct') return;

    const durationMs = 2600;
    const end = Date.now() + durationMs;

    const palette = ['#a855f7', '#ec4899', '#fb7185', '#fbbf24', '#22c55e', '#60a5fa'];

    // Base options inspired by the "interval burst" pattern.
    const base = {
      startVelocity: 34,
      spread: 120,
      ticks: 240,
      gravity: 0.95,
      decay: 0.92,
      scalar: 1,
      zIndex: 1000,
      colors: palette,
      shapes: ['square', 'circle', 'star'] as const,
      disableForReducedMotion: true,
    };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    // Fire from randomized positions for a couple seconds (prettier + more "full screen").
    const fire = (options: any) => {
      const fn = confettiRef.current ?? (confetti as any);
      return fn(options);
    };

    const interval = window.setInterval(() => {
      const timeLeft = end - Date.now();
      if (timeLeft <= 0) {
        window.clearInterval(interval);
        return;
      }

      const particleCount = Math.max(18, Math.floor(65 * (timeLeft / durationMs)));
      fire({
        ...base,
        particleCount,
        origin: { x: randomInRange(0.12, 0.88), y: randomInRange(0.05, 0.35) },
      });
    }, 220);

    // Extra side cannons at start for impact.
    fire({ ...base, particleCount: 80, angle: 60, spread: 65, origin: { x: 0, y: 0.75 } });
    fire({ ...base, particleCount: 80, angle: 120, spread: 65, origin: { x: 1, y: 0.75 } });

    return () => {
      window.clearInterval(interval);
      try {
        (confettiRef.current as any)?.reset?.();
      } catch {
        // ignore
      }
    };
  }, [result, showConfetti]);

  const wrongEmojiShapes = useMemo(() => {
    const api = confetti as unknown as {
      shapeFromText?: (options: { text: string; scalar?: number; color?: string; fontFamily?: string }) => any;
    };
    if (!api.shapeFromText) return null;

    const scalar = 2;
    // TODO: change emojis here if you want
    return [
      api.shapeFromText({ text: '🤡', scalar }),
      api.shapeFromText({ text: '💥', scalar }),
      api.shapeFromText({ text: '💦', scalar }),
    ];
  }, []);

  useEffect(() => {
    if (!showWrongFx) return;
    if (result !== 'incorrect') return;

    const fire = (options: any) => {
      const fn = confettiRef.current ?? (confetti as any);
      return fn(options);
    };

    const base = {
      particleCount: 18,
      spread: 55,
      startVelocity: 22,
      ticks: 140,
      gravity: 1.15,
      decay: 0.9,
      scalar: 1,
      zIndex: 1000,
      disableForReducedMotion: true,
      origin: { x: 0.5, y: 0.3 },
    };

    if (wrongEmojiShapes?.length) {
      fire({ ...base, particleCount: 16, spread: 45, shapes: wrongEmojiShapes as any });
      fire({ ...base, particleCount: 12, spread: 70, origin: { x: 0.5, y: 0.25 }, shapes: wrongEmojiShapes as any });
    } else {
      fire({ ...base, colors: ['#fb7185', '#a855f7', '#60a5fa'], shapes: ['square', 'circle', 'star'] as any });
    }

    const timer = window.setTimeout(() => setShowWrongFx(false), 450);
    return () => window.clearTimeout(timer);
  }, [result, showWrongFx, wrongEmojiShapes]);

  const handleHintConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (hintInsufficientCoins) {
      setHintModalOpen(false);
      window.setTimeout(() => setShowRechargeNotice(true), 200);
      return;
    }

    setHintModalOpen(false);
    setHintRevealed(true);
    onHintRequest(team.id, question.id);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <canvas
        ref={confettiCanvasRef}
        className="pointer-events-none fixed inset-0 z-[70] h-full w-full"
        aria-hidden="true"
      />
      {showSolvedFx && (
        <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.6, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 12 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-5 shadow-[0_12px_28px_rgba(32,26,34,0.1)]"
            aria-hidden="true"
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, -8, 0], scale: [1, 1.08, 1] }}
                transition={{ duration: 0.5, repeat: 1, repeatType: 'mirror' }}
              >
                <Unlock className="w-10 h-10 text-emerald-600" />
              </motion.div>
              <div className="leading-tight">
                <div className="text-emerald-950 font-bold">문제가 풀렸어요!</div>
                <div className="text-sm text-emerald-800/90">점수는 제출 순간에 확정됩니다.</div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      <div className="w-full max-w-3xl">
        {/* Back Button */}
        <Button
          onClick={onBack}
          variant="ghost"
          className="mb-6 text-foreground hover:bg-white/70 backdrop-blur-sm"
          disabled={showResultDialog || isSubmittingResult}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          뒤로가기
        </Button>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 backdrop-blur-md rounded-3xl border border-border p-8 shadow-[0_22px_70px_rgba(32,26,34,0.16)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-border/70">
            <div>
              <h3 className="text-sm text-muted-foreground">Q {question.id}</h3>
              <h2 className="text-2xl font-bold text-foreground">{team.name}</h2>
            </div>
            <div className="flex gap-6">
              <div className="text-right">
                <div className="text-sm text-muted-foreground">보상</div>
                <div className="text-3xl font-bold text-emerald-700 flex items-center gap-2">
                  <Coins className="w-7 h-7" />
                  {rewardForCurrentOrder}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">현재 보유코인</div>
                <div className="text-3xl font-bold text-primary">{displayTeamCoins}</div>
              </div>
            </div>
          </div>

          {/* Question */}
          <div className="mb-8">
            <motion.div
              animate={retryShake ? { x: [-6, 6, -4, 4, -2, 2, 0] } : {}}
              transition={{ duration: 0.45 }}
              className="bg-white/60 rounded-2xl p-6 border border-border shadow-[0_12px_34px_rgba(32,26,34,0.10)]"
            >
              <p className="text-xl text-foreground leading-relaxed">{question.questionText}</p>
            </motion.div>
          </div>

          {/* Answer Form */}
          {!showResultDialog && !isSubmittingResult && result !== 'correct' && (
            <>
              {question.answerType === 'text' ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="answer" className="block text-sm font-medium text-foreground/80 mb-2">
                      정답입력
                    </label>
                    <Input
                      id="answer"
                      type="text"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="이곳에 정답을 입력해주세요.."
                      className="bg-white/80 border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/25 text-lg py-6 rounded-2xl"
                      autoFocus
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full border border-primary/25 bg-primary text-primary-foreground font-semibold py-6 text-lg hover:opacity-95"
                    disabled={!answer.trim()}
                  >
                    <Send className="w-5 h-5 mr-2" />
                    제출하기
                  </Button>
                </form>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-foreground/85">방향 자물쇠</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        버튼(상/하/좌/우)을 눌러 입력하세요.
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">입력 횟수</div>
                      <div className="text-sm text-foreground font-mono">
                        {directionDigits.length}/{expectedDirectionDigits.length || '∞'}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/60 rounded-2xl border border-border p-6 shadow-[0_12px_34px_rgba(32,26,34,0.10)]">
                    <div className="flex items-center justify-center">
                      <div className="relative w-56 h-56">
                        <div className="absolute inset-0 border border-border bg-gradient-to-br from-violet-50/90 via-white to-sky-50/80 shadow-inner rounded-2xl" />
                        <div className="absolute inset-6 rounded-full border border-violet-100/80 bg-white/70 shadow-[inset_0_2px_12px_rgba(139,92,246,0.08)]" />

                        {/* Buttons */}
                        <button
                          type="button"
                          onClick={() => pushDirectionDigit(1)}
                          className="absolute left-1/2 top-2 -translate-x-1/2 rounded-full border border-violet-200/90 bg-gradient-to-b from-white to-violet-50 px-4 py-3 text-violet-700 shadow-md transition hover:border-violet-300 hover:from-violet-50 hover:to-violet-100 hover:shadow-lg active:scale-95"
                        >
                          <ChevronUp className="w-6 h-6" />
                        </button>
                        <button
                          type="button"
                          onClick={() => pushDirectionDigit(2)}
                          className="absolute left-1/2 bottom-2 -translate-x-1/2 rounded-full border border-sky-200/90 bg-gradient-to-t from-white to-sky-50 px-4 py-3 text-sky-700 shadow-md transition hover:border-sky-300 hover:from-sky-50 hover:to-sky-100 hover:shadow-lg active:scale-95"
                        >
                          <ChevronDown className="w-6 h-6" />
                        </button>
                        <button
                          type="button"
                          onClick={() => pushDirectionDigit(4)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-fuchsia-200/90 bg-gradient-to-r from-white to-fuchsia-50 px-4 py-3 text-fuchsia-700 shadow-md transition hover:border-fuchsia-300 hover:from-fuchsia-50 hover:to-fuchsia-100 hover:shadow-lg active:scale-95"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                          type="button"
                          onClick={() => pushDirectionDigit(3)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-amber-200/90 bg-gradient-to-l from-white to-amber-50 px-4 py-3 text-amber-800 shadow-md transition hover:border-amber-300 hover:from-amber-50 hover:to-amber-100 hover:shadow-lg active:scale-95"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>

                        {/* Knob — round, soft pastel */}
                        <motion.div
                          animate={{
                            x:
                              lastDirectionDigit === 4
                                ? -26
                                : lastDirectionDigit === 3
                                  ? 26
                                  : 0,
                            y:
                              lastDirectionDigit === 1
                                ? -26
                                : lastDirectionDigit === 2
                                  ? 26
                                  : 0,
                            scale: lastDirectionDigit ? [1, 1.06, 1] : 1,
                          }}
                          transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                        >
                          <div className="relative flex h-[5.25rem] w-[5.25rem] items-center justify-center rounded-full border-2 border-white/90 bg-gradient-to-br from-violet-200/90 via-pink-100 to-amber-100 p-1 shadow-[0_10px_28px_rgba(139,92,246,0.25)] ring-2 ring-violet-200/40">
                            <div className="absolute inset-2 z-[1] rounded-full bg-gradient-to-br from-white/90 to-violet-50/80 shadow-inner" />
                            <div className="absolute left-1/2 top-2.5 z-[2] h-6 w-2.5 -translate-x-1/2 rounded-full bg-gradient-to-b from-violet-500 to-fuchsia-400 shadow-[0_2px_8px_rgba(139,92,246,0.45)]" />
                          </div>
                        </motion.div>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col items-center gap-3">
                      <div className="text-2xl text-foreground tracking-widest">
                        {directionDigits.length ? directionDigitsToArrows(directionDigits) : '—'}
                      </div>
                      <div className="flex items-center gap-2">
                        {Array.from({ length: Math.max(1, expectedDirectionDigits.length || 8) }).slice(
                          0,
                          expectedDirectionDigits.length || 8,
                        ).map((_, idx) => (
                          <div
                            key={idx}
                            className={`h-2.5 w-2.5 rounded-full border ${
                              idx < directionDigits.length
                                ? 'border-violet-400 bg-violet-400 shadow-[0_0_10px_rgba(139,92,246,0.35)]'
                                : 'border-border/80 bg-muted/30'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {directionDigits.length ? `[${directionDigits.join(', ')}]` : '[ ]'}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={popDirectionDigit}
                      className="min-h-11 min-w-[8.5rem] border-2 border-violet-400 bg-gradient-to-b from-violet-50 to-white px-4 font-semibold text-violet-950 shadow-md hover:border-violet-500 hover:from-violet-100 hover:to-violet-50/90 hover:shadow-lg disabled:border-violet-200 disabled:from-muted/40 disabled:to-muted/30 disabled:text-muted-foreground disabled:shadow-none"
                      disabled={directionDigits.length === 0}
                    >
                      <Delete className="w-4 h-4 mr-2 shrink-0 text-violet-700" />
                      한 칸 삭제
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetDirectionDigits}
                      className="min-h-11 min-w-[8.5rem] border-2 border-sky-400 bg-gradient-to-b from-sky-50 to-white px-4 font-semibold text-sky-950 shadow-md hover:border-sky-500 hover:from-sky-100 hover:to-sky-50/90 hover:shadow-lg disabled:border-sky-200 disabled:from-muted/40 disabled:to-muted/30 disabled:text-muted-foreground disabled:shadow-none"
                      disabled={directionDigits.length === 0}
                    >
                      <RotateCcw className="w-4 h-4 mr-2 shrink-0 text-sky-700" />
                      초기화
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    입력이 정답 길이에 도달하면 자동으로 제출/판정됩니다.
                  </div>
                </div>
              )}
            </>
          )}

          {/* Submit-in-progress / Correct state: hide inputs */}
          {!showResultDialog && (isSubmittingResult || result === 'correct') && (
            <div className="rounded-xl border border-white/15 bg-black/20 p-6 text-center">
              <div className="text-white font-semibold">
                {isSubmittingResult ? '정답 제출 중...' : '정답 처리 중...'}
              </div>
              <div className="mt-2 text-sm text-gray-300">
                잠시만 기다려주세요. 정답이면 3초 뒤 홈으로 이동합니다.
              </div>
            </div>
          )}

          {/* Hint Section */}
          {!result && (
            <div className="mt-6">
              <div className="border-t border-white/20 pt-6">
                {hintRevealed ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-50/95 border border-amber-900/25 rounded-xl p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <Lightbulb className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="font-semibold text-amber-950 mb-1">힌트</h4>
                        {question.hintType === 'image' ? (
                          <div className="space-y-2">
                            {question.hintImageUrl ? (
                              <img
                                src={question.hintImageUrl}
                                alt="Hint"
                                className="max-h-[320px] w-auto rounded-lg border border-amber-900/20"
                                loading="lazy"
                              />
                            ) : (
                              <p className="text-amber-900/80 text-sm">이미지 힌트가 설정되지 않았습니다.</p>
                            )}
                            {question.hint?.trim() ? (
                              <p className="text-amber-950">{question.hint}</p>
                            ) : null}
                          </div>
                        ) : (
                          <p className="text-amber-950">{question.hint}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowRechargeNotice(false);
                      setHintInsufficientCoins(displayTeamCoins < question.hintCost);
                      setHintModalOpen(true);
                    }}
                    className="w-full border-amber-900/40 bg-amber-50 text-amber-950 shadow-[0_2px_0_rgba(120,53,15,0.08)] hover:bg-amber-100 hover:border-amber-900/55 hover:text-amber-950"
                    disabled={hintPurchased}
                  >
                    <Lightbulb className="w-5 h-5 mr-2 text-amber-800 shrink-0" />
                    {hintPurchased ? '힌트를 확인했어요' : `힌트보기 (-${question.hintCost} 코인)`}
                  </Button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* 힌트 확인 (Radix Dialog) */}
      <Dialog open={hintModalOpen} onOpenChange={setHintModalOpen}>
        <DialogContent
          className={
            hintInsufficientCoins
              ? 'border-2 border-red-500 bg-white text-red-600 shadow-xl sm:max-w-md'
              : 'border border-border bg-white text-foreground shadow-xl'
          }
        >
          <DialogHeader>
            <DialogTitle
              className={
                hintInsufficientCoins
                  ? 'flex items-center gap-2 text-xl font-bold text-red-600'
                  : 'flex items-center gap-2 text-foreground'
              }
            >
              {hintInsufficientCoins ? (
                <>
                  <AlertTriangle className="h-6 w-6 shrink-0 text-red-600" aria-hidden />
                  경고
                </>
              ) : (
                <>
                  <Lightbulb className="h-6 w-6 shrink-0 text-amber-600" aria-hidden />
                  힌트보기
                </>
              )}
            </DialogTitle>
            <DialogDescription
              className={
                hintInsufficientCoins
                  ? 'text-lg font-semibold leading-snug text-red-600 sm:text-xl'
                  : 'text-base text-muted-foreground'
              }
            >
              {hintInsufficientCoins
                ? '코인이 부족합니다. 무료충전하시겠습니까?'
                : `힌트를 보면 팀 코인에서 ${question.hintCost}코인이 차감돼요. 계속할까요?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setHintModalOpen(false)}
              className={
                hintInsufficientCoins
                  ? 'border-red-500 text-red-600 hover:bg-red-50'
                  : 'border-border text-foreground hover:bg-muted/80'
              }
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={handleHintConfirm}
              className={
                hintInsufficientCoins
                  ? 'bg-red-600 font-semibold text-white hover:bg-red-700'
                  : 'border border-primary/20 bg-primary font-semibold text-primary-foreground hover:opacity-95'
              }
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showRechargeNotice
        ? createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-[rgba(32,26,34,0.35)] backdrop-blur-[2px]"
                onClick={() => setShowRechargeNotice(false)}
                aria-hidden
              />
              <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="recharge-counter-title"
                className="relative z-[1] w-full max-w-md overflow-hidden rounded-xl border-2 border-violet-200/90 bg-gradient-to-br from-violet-50/95 via-white to-cyan-50/90 p-6 shadow-[0_22px_50px_-12px_rgba(139,92,246,0.28)]"
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-gradient-to-br from-fuchsia-200/55 to-violet-200/45 blur-3xl"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-gradient-to-tr from-cyan-200/50 to-sky-100/55 blur-3xl"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-100/35 blur-3xl"
                  aria-hidden
                />

                <button
                  type="button"
                  onClick={() => setShowRechargeNotice(false)}
                  className="absolute right-3 top-3 rounded-md p-2 text-violet-500 transition hover:bg-violet-100/80 hover:text-violet-800"
                  aria-label="닫기"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="relative z-10 flex flex-col gap-4 pt-2 text-left">
                  <div className="flex items-center gap-3 pr-10">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-200/90 to-fuchsia-200/80 shadow-inner ring-2 ring-white/90">
                      <Sparkles className="h-6 w-6 text-violet-700" aria-hidden />
                    </div>
                    <h2
                      id="recharge-counter-title"
                      className="text-xl font-bold tracking-tight text-violet-950 sm:text-2xl"
                    >
                      무료충전 안내
                    </h2>
                  </div>
                  <div className="space-y-3 rounded-2xl border border-violet-100/90 bg-white/55 px-4 py-4 text-[15px] leading-relaxed text-violet-900/85 shadow-sm backdrop-blur-[2px] sm:text-base">
                    <p className="font-medium text-violet-950">
                      무료 충전을 위해{' '}
                      <span className="rounded-md bg-gradient-to-r from-violet-100 to-fuchsia-100 px-1.5 py-0.5 text-violet-900">
                        카운터로 와주세요
                      </span>
                      .
                    </p>
                    <p className="text-violet-800/90">스태프가 바로 코인을 충전해드릴게요.</p>
                  </div>
                  <div className="flex justify-center pt-2">
                    <Button
                      type="button"
                      onClick={() => setShowRechargeNotice(false)}
                      className="rounded-full border-0 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500 bg-[length:200%_100%] px-10 font-semibold text-white shadow-lg shadow-violet-300/45 transition-[background-position,transform] hover:bg-[position:100%_0] hover:shadow-violet-400/50 active:scale-[0.98]"
                    >
                      확인
                    </Button>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {/* Result Dialog */}
      <Dialog
        open={showResultDialog}
        onOpenChange={(open) => {
          if (open) return;
          // Only allow dismiss-to-retry for incorrect answers.
          if (result === 'incorrect') handleRetry();
        }}
      >
        <DialogContent
          className={`bg-gray-900/95 border-white/20 text-white overflow-hidden ${
            result !== 'incorrect' ? '[&>button]:hidden' : ''
          }`}
          onEscapeKeyDown={(e) => {
            if (result !== 'incorrect') e.preventDefault();
          }}
          onInteractOutside={(e) => {
            if (result !== 'incorrect') e.preventDefault();
          }}
        >
          {result === 'correct' && (
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(34,197,94,0.18),transparent_55%)]" />
          )}

          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {result === 'correct' ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                  정답입니다!
                </>
              ) : result === 'locked' ? (
                <>
                  <XCircle className="w-6 h-6 text-amber-300" />
                  늦었어요!
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-red-400" />
                  틀렸습니다
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              {result === 'correct' ? (
                typeof resolvedReward === 'number' ? (
                  `+${resolvedReward} 코인 획득!`
                ) : (
                  '보상 계산중...'
                )
              ) : result === 'locked' ? (
                '다른 3팀이 먼저 문제를 풀었어요.'
              ) : (
                '다시 한 번 도전해보세요.'
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="relative z-10 rounded-xl border border-white/10 bg-black/20 p-4">
            {result === 'correct' ? (
              <div className="text-sm text-gray-200">
                확인을 누르면 홈으로 이동합니다.
              </div>
            ) : result === 'locked' ? (
              <div className="text-sm text-gray-200">
                이 문제는 잠겨서 더 이상 제출할 수 없어요. 홈으로 이동합니다.
              </div>
            ) : (
              <div className="text-sm text-gray-200">
                입력을 초기화하고 바로 다시 풀 수 있어요.
              </div>
            )}
          </div>

          <DialogFooter>
            {result === 'correct' ? (
              <Button
                onClick={handleConfirmCorrect}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={isSubmittingResult}
              >
                확인
              </Button>
            ) : result === 'locked' ? (
              <Button
                onClick={onBack}
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold"
              >
                홈으로
              </Button>
            ) : (
              <Button
                onClick={handleRetry}
                className="border border-white/40 bg-transparent text-white hover:bg-white/10"
              >
                다시 풀기
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
