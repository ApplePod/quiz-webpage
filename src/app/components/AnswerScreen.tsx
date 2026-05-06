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
  onSubmit: (answer: string, teamId: string) => Promise<void> | void;
  onHintRequest: (teamId: string, questionId: number) => void;
  onBack: () => void;
}

export function AnswerScreen({
  team,
  question,
  solveCount,
  onSubmit,
  onHintRequest,
  onBack,
}: AnswerScreenProps) {
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const confettiRef = useRef<null | ((options: any) => Promise<null | void> | null)>(null);
  const [answer, setAnswer] = useState('');
  const [displayTeamCoins, setDisplayTeamCoins] = useState<number>(team.coins);
  const [directionDigits, setDirectionDigits] = useState<number[]>([]);
  const [lastDirectionDigit, setLastDirectionDigit] = useState<number | null>(null);
  const [showHintDialog, setShowHintDialog] = useState(false);
  const [hintRevealed, setHintRevealed] = useState(false);
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [pendingSubmitAnswer, setPendingSubmitAnswer] = useState<string | null>(null);
  const [isSubmittingResult, setIsSubmittingResult] = useState(false);
  const [retryShake, setRetryShake] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showWrongFx, setShowWrongFx] = useState(false);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;

    const isCorrect = isCorrectForQuestion(question, answer);
    setResult(isCorrect ? 'correct' : 'incorrect');
    setPendingSubmitAnswer(isCorrect ? answer : null);
    setShowResultDialog(true);
    setShowConfetti(isCorrect);
    setShowWrongFx(!isCorrect);
    if (!isCorrect) {
      setRetryShake(true);
      setTimeout(() => setRetryShake(false), 450);
    }
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
    setHintRevealed(false);
  }, [question.id, team.coins]);

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
        setPendingSubmitAnswer(isCorrect ? submitted : null);
        setShowResultDialog(true);
        setShowConfetti(isCorrect);
        setShowWrongFx(!isCorrect);
        if (!isCorrect) {
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
    if (question.answerType === 'text') {
      setAnswer('');
    } else {
      setDirectionDigits([]);
      setLastDirectionDigit(null);
    }
  };

  const handleConfirmCorrect = async () => {
    if (!pendingSubmitAnswer) return;
    setIsSubmittingResult(true);
    try {
      await onSubmit(pendingSubmitAnswer, team.id);
    } finally {
      setIsSubmittingResult(false);
      setShowResultDialog(false);
      setShowConfetti(false);
      setShowWrongFx(false);
      onBack();
    }
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
          {!showResultDialog && (
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
                      className="bg-white/10 border-white/30 text-white placeholder:text-gray-400 focus:border-purple-400 focus:ring-purple-400 text-lg py-6"
                      autoFocus
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-6 text-lg"
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
                        <div className="absolute inset-0 rounded-full border border-white/20 bg-gradient-to-br from-white/10 to-white/0 shadow-inner" />
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
                          <div className="relative w-20 h-20 rounded-full border border-white/25 bg-gradient-to-br from-red-500/55 to-red-600/20 shadow-[0_0_30px_rgba(244,63,94,0.15)]">
                            <div className="absolute inset-2 rounded-full border border-white/15 bg-white/5" />
                            <div className="absolute left-1/2 top-2 -translate-x-1/2 w-2 h-6 rounded-full bg-purple-300/70 shadow-[0_0_14px_rgba(168,85,247,0.55)]" />
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
                                ? 'bg-purple-400/90 border-purple-300/70 shadow-[0_0_10px_rgba(168,85,247,0.6)]'
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
                      className="border-white/25 text-white hover:bg-white/10"
                      disabled={directionDigits.length === 0}
                    >
                      <Delete className="w-4 h-4 mr-2" />
                      한 칸 삭제
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetDirectionDigits}
                      className="border-white/25 text-white hover:bg-white/10"
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
                        <p className="text-yellow-100">{question.hint}</p>
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
                  >
                    <Lightbulb className="w-5 h-5 mr-2" />
                    View Hint (-{question.hintCost} coins)
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
      <Dialog open={showResultDialog} onOpenChange={(open) => (open ? null : handleRetry())}>
        <DialogContent className="bg-gray-900/95 border-white/20 text-white overflow-hidden">
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
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-red-400" />
                  틀렸습니다
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              {result === 'correct'
                ? `+${rewardForCurrentOrder} 코인 획득!`
                : '다시 한 번 도전해보세요.'}
            </DialogDescription>
          </DialogHeader>

          <div className="relative z-10 rounded-xl border border-white/10 bg-black/20 p-4">
            {result === 'correct' ? (
              <div className="text-sm text-gray-200">
                확인을 누르면 홈으로 이동합니다.
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
            ) : (
              <Button
                onClick={handleRetry}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                다시 풀기
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recharge 안내 Dialog */}
      <Dialog open={showRechargeDialog} onOpenChange={setShowRechargeDialog}>
        <DialogContent className="bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950 border-purple-400/50 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-200">
              <div className="w-8 h-8 rounded-full bg-purple-500/30 border border-purple-300/40 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-purple-200" />
              </div>
              Free Recharge
            </DialogTitle>
            <DialogDescription className="text-purple-100/90">
              무료 충전을 위해 <span className="font-semibold text-white">카운터로 와주세요</span>.
              <br />
              스태프가 바로 코인을 충전해드릴게요.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setShowRechargeDialog(false)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold"
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
