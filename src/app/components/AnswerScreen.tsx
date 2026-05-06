import React, { useEffect, useMemo, useState } from 'react';
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
  onSubmit: (answer: string, teamId: string) => void;
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
  const [answer, setAnswer] = useState('');
  const [directionDigits, setDirectionDigits] = useState<number[]>([]);
  const [lastDirectionDigit, setLastDirectionDigit] = useState<number | null>(null);
  const [showHintDialog, setShowHintDialog] = useState(false);
  const [hintRevealed, setHintRevealed] = useState(false);
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(null);
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
    
    // Pass the result to parent after a short delay
    setTimeout(() => {
      onSubmit(answer, team.id);
    }, 2000);
  };

  useEffect(() => {
    // Reset input when question changes
    setAnswer('');
    setDirectionDigits([]);
    setLastDirectionDigit(null);
    setResult(null);
    setHintRevealed(false);
  }, [question.id]);

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
        setTimeout(() => {
          onSubmit(submitted, team.id);
        }, 2000);
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
      <div className="w-full max-w-3xl">
        {/* Back Button */}
        <Button
          onClick={onBack}
          variant="ghost"
          className="mb-6 text-white hover:bg-white/10 backdrop-blur-sm"
          disabled={result !== null}
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
                <div className="text-3xl font-bold text-yellow-400">{team.coins}</div>
              </div>
            </div>
          </div>

          {/* Question */}
          <div className="mb-8">
            <div className="bg-white/5 rounded-xl p-6 border border-white/20">
              <p className="text-xl text-white leading-relaxed">{question.questionText}</p>
            </div>
          </div>

          {/* Result Display */}
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{
                opacity: 1,
                scale: [0.5, 1.1, 1],
                boxShadow: result === 'correct'
                  ? ['0 0 0px rgba(34, 197, 94, 0)', '0 0 30px rgba(34, 197, 94, 0.8)', '0 0 20px rgba(34, 197, 94, 0.4)']
                  : ['0 0 0px rgba(239, 68, 68, 0)', '0 0 30px rgba(239, 68, 68, 0.8)', '0 0 20px rgba(239, 68, 68, 0.4)']
              }}
              transition={{
                duration: 0.6,
                times: [0, 0.5, 1],
                ease: "easeOut"
              }}
              className={`mb-8 p-6 rounded-xl border-2 flex items-center gap-4 ${
                result === 'correct'
                  ? 'bg-green-500/20 border-green-400'
                  : 'bg-red-500/20 border-red-400'
              }`}
            >
              {result === 'correct' ? (
                <>
                  <motion.div
                    initial={{ rotate: -180, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                  >
                    <CheckCircle2 className="w-12 h-12 text-green-400" />
                  </motion.div>
                  <div>
                    <motion.h3
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-2xl font-bold text-green-400"
                    >
                      Correct! 🎉
                    </motion.h3>
                    <motion.p
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-green-300"
                    >
                      Well done! +{rewardForCurrentOrder} coins awarded.
                    </motion.p>
                  </div>
                </>
              ) : (
                <>
                  <motion.div
                    initial={{ rotate: 180, scale: 0 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                  >
                    <XCircle className="w-12 h-12 text-red-400" />
                  </motion.div>
                  <div>
                    <motion.h3
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-2xl font-bold text-red-400"
                    >
                      Incorrect
                    </motion.h3>
                    <motion.p
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-red-300"
                    >
                      The correct answer was: {correctAnswerLabel}
                    </motion.p>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* Answer Form */}
          {!result && (
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
