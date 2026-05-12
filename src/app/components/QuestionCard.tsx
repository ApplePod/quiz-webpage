import React from 'react';
import { Lock, Unlock, X, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuestionCardProps {
  questionNumber: number;
  coinReward: number;
  solveCount: number; // 0-3
  solvedByActiveTeam?: boolean;
  onLockedClick?: () => void;
  onClick: () => void;
}

type BorderSide = 1 | 2 | 3 | 4

// Counter-clockwise: (1,2,3,4) = (top, left, bottom, right)
const solvedBorderMap: Record<number, BorderSide[] | 'diagonal'> = {
  1: [1, 2, 3],
  2: [1, 3],
  3: [2, 4],
  4: [1],
  5: [1, 4],
  6: [2],
  7: 'diagonal',
  8: [4],
  9: [3],
  10: [3, 4],
  11: [3],
  12: [3],
  14: [3],
  15: [3],
  16: [2, 3],
  17: [3],
  18: [4],
  19: [3],
  20: [3],
  21: [3],
  22: [3],
  23: [2, 4],
  24: [3],
  25: [3],
}

const solvedBorderThicknessPx = 5
const solvedBorderGlow = 'shadow-[0_0_10px_rgba(239,68,68,0.8)]'

function SolvedBorderMask({ sides }: { sides: BorderSide[] }) {
  // Return to the simpler overlay style, but match corner rounding
  // by rounding the segment ends with the same radius as the card.
  const thickness = `${solvedBorderThicknessPx}px`
  const style: React.CSSProperties = { width: thickness, height: thickness }

  return (
    <div className={`absolute inset-0 rounded-2xl ${solvedBorderGlow}`} aria-hidden="true">
      {sides.includes(1) && (
        <div
          className="absolute left-0 right-0 top-0 bg-red-500 rounded-t-2xl"
          style={{ height: thickness }}
        />
      )}
      {sides.includes(2) && (
        <div
          className="absolute bottom-0 left-0 top-0 bg-red-500 rounded-l-2xl"
          style={{ width: thickness }}
        />
      )}
      {sides.includes(3) && (
        <div
          className="absolute bottom-0 left-0 right-0 bg-red-500 rounded-b-2xl"
          style={{ height: thickness }}
        />
      )}
      {sides.includes(4) && (
        <div
          className="absolute bottom-0 right-0 top-0 bg-red-500 rounded-r-2xl"
          style={{ width: thickness }}
        />
      )}

      {/* Corner dots to soften joins when adjacent sides exist */}
      {sides.includes(1) && sides.includes(2) && (
        <div className="absolute left-0 top-0 bg-red-500 rounded-full" style={{ ...style }} />
      )}
      {sides.includes(1) && sides.includes(4) && (
        <div className="absolute right-0 top-0 bg-red-500 rounded-full" style={{ ...style }} />
      )}
      {sides.includes(3) && sides.includes(2) && (
        <div className="absolute bottom-0 left-0 bg-red-500 rounded-full" style={{ ...style }} />
      )}
      {sides.includes(3) && sides.includes(4) && (
        <div className="absolute bottom-0 right-0 bg-red-500 rounded-full" style={{ ...style }} />
      )}
    </div>
  )
}

export function QuestionCard({
  questionNumber,
  coinReward,
  solveCount,
  solvedByActiveTeam = false,
  onLockedClick,
  onClick,
}: QuestionCardProps) {
  const isLocked = solveCount >= 3;
  const isSolved = solveCount > 0;
  const isDisabled = isLocked || solvedByActiveTeam;
  const solvedBorder = solvedBorderMap[questionNumber];

  // Determine card state
  const getCardStyle = () => {
    if (solveCount === 0) {
      return {
        bg: 'bg-[#FEFCE8]',
        border: 'border-amber-200/90',
        shadow: 'shadow-[0_8px_20px_rgba(120,53,15,0.07)]',
        hoverBg: 'hover:bg-[#fffbeb]',
      };
    } else if (solveCount === 1) {
      return {
        bg: 'bg-[#DBEAFE]',
        border: 'border-sky-300/85',
        shadow: 'shadow-[0_8px_20px_rgba(30,64,175,0.08)]',
        hoverBg: 'hover:bg-[#e0f2fe]',
      };
    } else if (solveCount === 2) {
      return {
        bg: 'bg-[#FBCFE8]',
        border: 'border-pink-300/85',
        shadow: 'shadow-[0_8px_20px_rgba(190,24,93,0.09)]',
        hoverBg: 'hover:bg-[#fce7f3]',
      };
    } else {
      return {
        bg: 'bg-gradient-to-b from-[#b4b4bc] to-[#9ca3af]',
        border: 'border-zinc-500/70',
        shadow: 'shadow-[0_8px_22px_rgba(63,63,70,0.18)]',
        hoverBg: '',
      };
    }
  };

  const cardStyle = getCardStyle();

  const qLabelClass =
    solveCount === 0
      ? 'text-neutral-800'
      : solveCount === 1
        ? 'text-sky-950'
        : solveCount === 2
          ? 'text-pink-950'
          : 'text-white';
  const lockClassWhenOpen =
    solveCount === 0
      ? 'text-neutral-700'
      : solveCount === 1
        ? 'text-sky-950'
        : solveCount === 2
          ? 'text-pink-950'
          : isLocked
            ? 'text-neutral-500'
            : 'text-white/80';
  const unlockIconWhenTeamSolved =
    solveCount === 1 ? 'text-sky-950' : solveCount === 2 ? 'text-pink-950' : 'text-green-400';
  const coinRowClass =
    solveCount === 0
      ? 'text-amber-900/90'
      : solveCount === 1
        ? 'text-sky-950'
        : solveCount === 2
          ? 'text-pink-950'
          : 'text-yellow-400';

  return (
    <motion.button
      key={`${questionNumber}-${solveCount}`}
      onClick={isDisabled ? undefined : onClick}
      whileHover={isDisabled ? {} : { scale: 1.05, y: -5 }}
      whileTap={isDisabled ? {} : { scale: 0.95 }}
      className={`relative w-[var(--cell)] h-[var(--cell)] rounded-2xl border transition-all duration-300 ${cardStyle.bg} ${cardStyle.border} ${cardStyle.shadow} ${
        isDisabled ? 'cursor-not-allowed opacity-60' : `${cardStyle.hoverBg} cursor-pointer`
      }`}
      // Keep the element interactive for locked overlays (X click),
      // but fully disable for "solved by active team".
      disabled={solvedByActiveTeam}
      aria-disabled={isDisabled}
    >
      {/* Locked Overlay */}
      <AnimatePresence>
        {isLocked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
            animate={{
              opacity: 1,
              scale: 1,
              rotate: 0,
            }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 20,
            }}
            className="absolute inset-0 flex items-center justify-center bg-zinc-950/22 rounded-2xl z-10"
          >
            <button
              type="button"
              className="pointer-events-auto"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (solvedByActiveTeam) return;
                onLockedClick?.();
              }}
              aria-label="Locked question"
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  repeatDelay: 2,
                }}
              >
                <X className="w-[clamp(56px,9vw,128px)] h-[clamp(56px,9vw,128px)] text-zinc-100/85 stroke-[1.5]" />
              </motion.div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Solved border overlay (custom per question) */}
      {isSolved && solvedBorder && (
        <div className="pointer-events-none absolute inset-0 z-20">
          {solvedBorder === 'diagonal' ? (
            <div className="absolute inset-0 overflow-hidden rounded-2xl">
              <div
                className={`absolute left-1/2 top-1/2 w-[170%] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-red-500 ${solvedBorderGlow}`}
                style={{ height: `${solvedBorderThicknessPx}px` }}
                aria-hidden="true"
              />
            </div>
          ) : (
            <SolvedBorderMask sides={solvedBorder} />
          )}
        </div>
      )}

      <div className="relative z-30 h-full w-full flex flex-col items-center justify-center gap-[clamp(6px,1.2vw,12px)] px-[clamp(8px,1.4vw,16px)]">
        {/* Lock icon based on active team status */}
        {solvedByActiveTeam ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 220 }}
          >
            <Unlock
              strokeWidth={2.5}
              className={`w-[clamp(22px,3.2vw,32px)] h-[clamp(22px,3.2vw,32px)] ${unlockIconWhenTeamSolved}`}
            />
          </motion.div>
        ) : (
          <Lock
            strokeWidth={2.5}
            className={`w-[clamp(22px,3.2vw,32px)] h-[clamp(22px,3.2vw,32px)] ${lockClassWhenOpen}`}
          />
        )}

        <div className={`text-[clamp(14px,2.4vw,22px)] font-bold ${qLabelClass}`}>Q{questionNumber}</div>

        {/* Coin Reward */}
        {!isLocked && !solvedByActiveTeam && (
          <div className={`flex items-center gap-1 mt-1 ${coinRowClass}`}>
            <Coins className="w-[clamp(14px,2vw,18px)] h-[clamp(14px,2vw,18px)]" />
            <span className="text-[clamp(11px,1.6vw,14px)] font-semibold">{coinReward}</span>
          </div>
        )}
      </div>

      {/* Solve count indicator */}
      {solveCount > 0 && solveCount < 3 && (
        <div className="absolute top-2 right-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`flex items-center gap-1 rounded-full px-[clamp(6px,1vw,8px)] py-[clamp(4px,0.8vw,6px)] ring-1 ring-inset ${
              solveCount === 1
                ? 'bg-sky-200/90 ring-sky-400/40'
                : 'bg-pink-200/90 ring-pink-400/40'
            }`}
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={`w-[clamp(6px,1vw,8px)] h-[clamp(6px,1vw,8px)] rounded-full transition-all duration-300 ${
                  i < solveCount
                    ? solveCount === 1
                      ? 'bg-sky-600'
                      : 'bg-pink-600'
                    : solveCount === 1
                      ? 'bg-sky-900/18'
                      : 'bg-pink-900/18'
                }`}
              />
            ))}
          </motion.div>
        </div>
      )}

      {/* Badge for first or second solve */}
      {solveCount === 1 && (
        <div className="absolute top-2 left-2">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            className="border border-sky-400/60 bg-white/90 text-sky-900 text-[clamp(10px,1.4vw,12px)] font-bold px-[clamp(6px,1vw,8px)] py-[clamp(3px,0.7vw,4px)] rounded-full shadow-none"
          >
            1st
          </motion.div>
        </div>
      )}
      {solveCount === 2 && (
        <div className="absolute top-2 left-2">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            className="border border-pink-400/60 bg-white/90 text-pink-900 text-[clamp(10px,1.4vw,12px)] font-bold px-[clamp(6px,1vw,8px)] py-[clamp(3px,0.7vw,4px)] rounded-full shadow-none"
          >
            2nd
          </motion.div>
        </div>
      )}
    </motion.button>
  );
}
