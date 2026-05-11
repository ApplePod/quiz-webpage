import React, { useEffect, useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Team, Question } from '../types';
import {
  ArrowLeft,
  Lightbulb,
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
  const [showHintDialog, setShowHintDialog] = useState(false);
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
  const [showRechargeDialog, setShowRechargeDialog] = useState(false);
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

  const handleHintConfirm = () => {
    setShowHintDialog(false);

    if (hintInsufficientCoins) {
      setShowRechargeDialog(true);
      return;
    }

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
            className="rounded-2xl border border-green-400/30 bg-black/55 backdrop-blur-md px-6 py-5 shadow-[0_0_40px_rgba(34,197,94,0.25)]"
            aria-hidden="true"
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, -8, 0], scale: [1, 1.08, 1] }}
                transition={{ duration: 0.5, repeat: 1, repeatType: 'mirror' }}
              >
                <Unlock className="w-10 h-10 text-green-300" />
              </motion.div>
              <div className="leading-tight">
                <div className="text-white font-bold">문제가 풀렸어요!</div>
                <div className="text-sm text-green-100/90">점수는 제출 순간에 확정됩니다.</div>
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
          className="mb-6 text-white hover:bg-white/10 backdrop-blur-sm"
          disabled={showResultDialog || isSubmittingResult}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/30 p-8 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/20">
            <div>
              <h3 className="text-sm text-gray-300">Question {question.id}</h3>
              <h2 className="text-2xl font-bold text-white">{team.name}</h2>
            </div>
            <div className="flex gap-6">
              <div className="text-right">
                <div className="text-sm text-gray-300">Reward</div>
                <div className="text-3xl font-bold text-green-400 flex items-center gap-2">
                  <Coins className="w-7 h-7" />
                  {rewardForCurrentOrder}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-300">Team Coins</div>
                <div className="text-3xl font-bold text-yellow-400">{displayTeamCoins}</div>
              </div>
            </div>
          </div>

          {/* Question */}
          <div className="mb-8">
            <motion.div
              animate={retryShake ? { x: [-6, 6, -4, 4, -2, 2, 0] } : {}}
              transition={{ duration: 0.45 }}
              className="bg-white/5 rounded-xl p-6 border border-white/20"
            >
              <p className="text-xl text-white leading-relaxed">{question.questionText}</p>
            </motion.div>
          </div>

          {/* Answer Form */}
          {!showResultDialog && !isSubmittingResult && result !== 'correct' && (
            <>
              {question.answerType === 'text' ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="answer" className="block text-sm font-medium text-gray-300 mb-2">
                      Your Answer
                    </label>
                    <Input
                      id="answer"
                      type="text"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Type your answer here..."
                      className="bg-black/40 border-white/40 text-white placeholder:text-white/50 focus:border-white/70 focus:ring-white/30 text-lg py-6"
                      autoFocus
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full border border-white/40 bg-transparent text-white font-semibold py-6 text-lg hover:bg-white/10"
                    disabled={!answer.trim()}
                  >
                    <Send className="w-5 h-5 mr-2" />
                    Submit Answer
                  </Button>
                </form>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-300">Direction Lock</div>
                      <div className="text-xs text-gray-400 mt-1">
                        버튼(상/하/좌/우)을 눌러 입력하세요.
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400">Progress</div>
                      <div className="text-sm text-white font-mono">
                        {directionDigits.length}/{expectedDirectionDigits.length || '∞'}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl border border-white/20 p-6">
                    <div className="flex items-center justify-center">
                      <div className="relative w-56 h-56">
                        <div className="absolute inset-0 border border-white/20 bg-white/5 shadow-inner" />
                        <div className="absolute inset-6 rounded-full border border-white/15 bg-black/20" />

                        {/* Buttons */}
                        <button
                          type="button"
                          onClick={() => pushDirectionDigit(1)}
                          className="absolute left-1/2 top-2 -translate-x-1/2 rounded-full border border-white/20 bg-white/10 backdrop-blur px-4 py-3 text-white hover:bg-white/15 active:scale-95 transition"
                        >
                          <ChevronUp className="w-6 h-6" />
                        </button>
                        <button
                          type="button"
                          onClick={() => pushDirectionDigit(2)}
                          className="absolute left-1/2 bottom-2 -translate-x-1/2 rounded-full border border-white/20 bg-white/10 backdrop-blur px-4 py-3 text-white hover:bg-white/15 active:scale-95 transition"
                        >
                          <ChevronDown className="w-6 h-6" />
                        </button>
                        <button
                          type="button"
                          onClick={() => pushDirectionDigit(4)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-white/10 backdrop-blur px-4 py-3 text-white hover:bg-white/15 active:scale-95 transition"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                          type="button"
                          onClick={() => pushDirectionDigit(3)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border border-white/20 bg-white/10 backdrop-blur px-4 py-3 text-white hover:bg-white/15 active:scale-95 transition"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>

                        {/* Knob */}
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
                          <div className="relative w-20 h-20 border border-white/30 bg-black/45 shadow-[0_0_30px_rgba(255,255,255,0.08)]">
                            <div className="absolute inset-2 rounded-full border border-white/15 bg-white/5" />
                            <div className="absolute left-1/2 top-2 -translate-x-1/2 w-2 h-6 bg-white/70 shadow-[0_0_14px_rgba(255,255,255,0.25)]" />
                          </div>
                        </motion.div>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col items-center gap-3">
                      <div className="text-2xl text-white tracking-widest">
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
                                ? 'bg-white/70 border-white/50 shadow-[0_0_10px_rgba(255,255,255,0.22)]'
                                : 'bg-white/5 border-white/15'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="text-xs text-gray-400 font-mono">
                        {directionDigits.length ? `[${directionDigits.join(', ')}]` : '[ ]'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={popDirectionDigit}
                      className="border-white/40 bg-black/30 text-white hover:bg-black/40 hover:border-white/60"
                      disabled={directionDigits.length === 0}
                    >
                      <Delete className="w-4 h-4 mr-2" />
                      한 칸 삭제
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetDirectionDigits}
                      className="border-white/40 bg-black/30 text-white hover:bg-black/40 hover:border-white/60"
                      disabled={directionDigits.length === 0}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      초기화
                    </Button>
                  </div>

                  <div className="text-xs text-gray-400">
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
                    className="bg-yellow-500/20 border border-yellow-400/50 rounded-xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      <Lightbulb className="w-5 h-5 text-yellow-400 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-yellow-300 mb-1">Hint</h4>
                        {question.hintType === 'image' ? (
                          <div className="space-y-2">
                            {question.hintImageUrl ? (
                              <img
                                src={question.hintImageUrl}
                                alt="Hint"
                                className="max-h-[320px] w-auto rounded-lg border border-yellow-400/30"
                                loading="lazy"
                              />
                            ) : (
                              <p className="text-yellow-100/80 text-sm">이미지 힌트가 설정되지 않았습니다.</p>
                            )}
                            {question.hint?.trim() ? (
                              <p className="text-yellow-100">{question.hint}</p>
                            ) : null}
                          </div>
                        ) : (
                          <p className="text-yellow-100">{question.hint}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setHintInsufficientCoins(team.coins < question.hintCost);
                      setShowHintDialog(true);
                    }}
                    className="w-full border-yellow-400/50 text-yellow-300 hover:bg-yellow-500/10 hover:text-yellow-200"
                    disabled={hintPurchased}
                  >
                    <Lightbulb className="w-5 h-5 mr-2" />
                    {hintPurchased ? 'Hint Purchased' : `View Hint (-${question.hintCost} coins)`}
                  </Button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Hint Confirmation Dialog */}
      <Dialog open={showHintDialog} onOpenChange={setShowHintDialog}>
        <DialogContent className="bg-gray-900 border-yellow-400/50 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-yellow-300">
              <Lightbulb className="w-6 h-6" />
              {hintInsufficientCoins ? 'Coins Needed' : 'View Hint'}
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              {hintInsufficientCoins
                ? '코인이 부족합니다. 무료충전하시겠습니까?'
                : `Viewing the hint will deduct ${question.hintCost} coins from your team balance. Do you want to continue?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowHintDialog(false)}
              className="border-white/30 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleHintConfirm}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
            >
              {hintInsufficientCoins ? 'Yes' : 'Yes, Show Hint'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Recharge 안내 Dialog */}
      <Dialog open={showRechargeDialog} onOpenChange={setShowRechargeDialog}>
        <DialogContent className="bg-black/90 border-white/20 text-white overflow-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-[0.22] bg-[radial-gradient(circle_at_35%_20%,rgba(255,255,255,0.12),transparent_55%)]" />
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 border border-white/30 bg-black/40 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white/80" />
              </div>
              Free Recharge
            </DialogTitle>
            <DialogDescription className="text-white/70">
              무료 충전을 위해 <span className="font-semibold text-white">카운터로 와주세요</span>.
              <br />
              스태프가 바로 코인을 충전해드릴게요.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setShowRechargeDialog(false)}
              className="border border-white/40 bg-transparent text-white font-semibold hover:bg-white/10"
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
