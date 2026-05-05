import React from 'react';
import { Circle, X, Trophy, Award, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuestionCardProps {
  questionNumber: number;
  coinReward: number;
  solveCount: number; // 0-3
  onClick: () => void;
}

export function QuestionCard({
  questionNumber,
  coinReward,
  solveCount,
  onClick,
}: QuestionCardProps) {
  const isLocked = solveCount >= 3;

  // Determine card state
  const getCardStyle = () => {
    if (solveCount === 0) {
      return {
        bg: 'bg-white/10',
        border: 'border-white/30 hover:border-white/50',
        shadow: 'shadow-lg hover:shadow-purple-500/40',
        hoverBg: 'hover:bg-white/20',
      };
    } else if (solveCount === 1) {
      return {
        bg: 'bg-green-500/20',
        border: 'border-green-400/60',
        shadow: 'shadow-lg shadow-green-500/40',
        hoverBg: 'hover:bg-green-500/30',
      };
    } else if (solveCount === 2) {
      return {
        bg: 'bg-orange-500/20',
        border: 'border-orange-400/60',
        shadow: 'shadow-lg shadow-orange-500/40',
        hoverBg: 'hover:bg-orange-500/30',
      };
    } else {
      // Locked (3 solves)
      return {
        bg: 'bg-gray-500/10',
        border: 'border-gray-500/30',
        shadow: 'shadow-lg',
        hoverBg: '',
      };
    }
  };

  const cardStyle = getCardStyle();

  return (
    <motion.button
      key={`${questionNumber}-${solveCount}`}
      onClick={isLocked ? undefined : onClick}
      whileHover={isLocked ? {} : { scale: 1.05, y: -5 }}
      whileTap={isLocked ? {} : { scale: 0.95 }}
      animate={
        solveCount > 0 && !isLocked
          ? {
              boxShadow: [
                cardStyle.shadow,
                solveCount === 1
                  ? '0 10px 40px rgba(34, 197, 94, 0.5)'
                  : '0 10px 40px rgba(249, 115, 22, 0.5)',
                cardStyle.shadow,
              ],
            }
          : {}
      }
      transition={{ duration: 0.6 }}
      className={`relative p-6 rounded-2xl backdrop-blur-md border transition-all duration-300 ${
        cardStyle.bg
      } ${cardStyle.border} ${cardStyle.shadow} ${
        isLocked ? 'cursor-not-allowed opacity-60' : `${cardStyle.hoverBg} cursor-pointer`
      }`}
      disabled={isLocked}
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
            className="absolute inset-0 flex items-center justify-center bg-gray-900/70 rounded-2xl backdrop-blur-sm z-10"
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
              <X className="w-16 h-16 text-red-400 stroke-[3]" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col items-center gap-3">
        {/* Icon based on state */}
        {solveCount === 0 && <Circle className="w-8 h-8 text-purple-300" />}
        {solveCount === 1 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <Trophy className="w-8 h-8 text-green-400" />
          </motion.div>
        )}
        {solveCount === 2 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <Award className="w-8 h-8 text-orange-400" />
          </motion.div>
        )}
        {solveCount >= 3 && <Circle className="w-8 h-8 text-gray-500" />}

        <div className="text-2xl font-bold text-white">Q{questionNumber}</div>

        {/* Coin Reward */}
        {!isLocked && (
          <div className="flex items-center gap-1 text-yellow-400 mt-1">
            <Coins className="w-4 h-4" />
            <span className="text-sm font-semibold">{coinReward}</span>
          </div>
        )}
      </div>

      {/* Solve count indicator */}
      {solveCount > 0 && solveCount < 3 && (
        <div className="absolute top-2 right-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1 bg-black/40 rounded-full px-2 py-1"
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i < solveCount
                    ? solveCount === 1
                      ? 'bg-green-400'
                      : 'bg-orange-400'
                    : 'bg-gray-600'
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
            className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full"
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
            className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full"
          >
            2nd
          </motion.div>
        </div>
      )}
    </motion.button>
  );
}
