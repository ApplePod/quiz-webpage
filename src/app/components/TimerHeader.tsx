import React from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface TimerHeaderProps {
  timeRemaining: number; // in seconds
  timerRunning: boolean;
}

export function TimerHeader({ timeRemaining, timerRunning }: TimerHeaderProps) {
  const hours = Math.floor(timeRemaining / 3600);
  const minutes = Math.floor((timeRemaining % 3600) / 60);
  const seconds = timeRemaining % 60;

  const isLowTime = timeRemaining < 600; // Less than 10 minutes
  const isCriticalTime = timeRemaining < 300; // Less than 5 minutes

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`relative overflow-hidden rounded-xl backdrop-blur-md border transition-all duration-500 ${
        isCriticalTime
          ? 'bg-red-600/30 border-red-400/60 shadow-xl shadow-red-500/40'
          : isLowTime
          ? 'bg-orange-500/20 border-orange-400/50 shadow-xl shadow-orange-500/30'
          : 'bg-gradient-to-r from-purple-600/30 via-pink-600/30 to-blue-600/30 border-white/30 shadow-xl shadow-purple-500/20'
      }`}
    >
      {/* Animated background gradient */}
      <div
        className={`absolute inset-0 opacity-20 ${
          isCriticalTime
            ? 'bg-gradient-to-r from-red-500 via-orange-500 to-red-500'
            : isLowTime
            ? 'bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-500'
            : 'bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500'
        } animate-gradient`}
        style={{
          backgroundSize: '200% 100%',
          animation: 'gradient 3s ease infinite',
        }}
      />

      {/* Content */}
      <div className="relative z-10 py-3 px-6">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <motion.div
            animate={
              isCriticalTime
                ? {
                    scale: [1, 1.15, 1],
                    rotate: [0, 8, -8, 0],
                  }
                : {}
            }
            transition={{
              duration: 1,
              repeat: Infinity,
              repeatDelay: 0.5,
            }}
          >
            {isCriticalTime ? (
              <AlertCircle className="w-7 h-7 text-red-300" />
            ) : (
              <Clock className="w-7 h-7 text-white" />
            )}
          </motion.div>

          {/* Timer Display */}
          <div>
            <motion.div
              animate={
                isCriticalTime
                  ? {
                      scale: [1, 1.03, 1],
                    }
                  : {}
              }
              transition={{
                duration: 1,
                repeat: Infinity,
              }}
              className={`text-3xl font-bold font-mono tracking-wide ${
                isCriticalTime
                  ? 'text-red-200'
                  : isLowTime
                  ? 'text-orange-200'
                  : 'text-transparent bg-gradient-to-r from-purple-200 via-pink-200 to-blue-200 bg-clip-text'
              }`}
              style={{
                textShadow: isCriticalTime
                  ? '0 0 15px rgba(239, 68, 68, 0.6)'
                  : isLowTime
                  ? '0 0 15px rgba(249, 115, 22, 0.6)'
                  : '0 0 15px rgba(168, 85, 247, 0.4)',
              }}
            >
              {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:
              {String(seconds).padStart(2, '0')}
            </motion.div>
            <div
              className={`text-xs font-medium mt-0.5 ${
                isCriticalTime
                  ? 'text-red-300'
                  : isLowTime
                  ? 'text-orange-300'
                  : 'text-purple-200'
              }`}
            >
              {!timerRunning ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                  Paused
                </span>
              ) : isCriticalTime ? (
                <span className="flex items-center gap-1.5 animate-pulse">
                  <AlertCircle className="w-3 h-3" />
                  Time Running Out!
                </span>
              ) : isLowTime ? (
                'Less than 10 min'
              ) : (
                'Time Remaining'
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pulse effect for critical time */}
      {isCriticalTime && (
        <motion.div
          className="absolute inset-0 bg-red-500/20 rounded-xl"
          animate={{
            opacity: [0, 0.4, 0],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
          }}
        />
      )}
    </motion.div>
  );
}
