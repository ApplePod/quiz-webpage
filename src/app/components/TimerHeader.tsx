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
      className={`relative overflow-hidden backdrop-blur-md border transition-all duration-500 ${
        isCriticalTime
          ? 'bg-red-600/20 border-red-400/60 shadow-[0_0_40px_rgba(239,68,68,0.25)]'
          : isLowTime
          ? 'bg-orange-500/15 border-orange-300/50 shadow-[0_0_40px_rgba(249,115,22,0.20)]'
          : 'bg-white/65 border-border shadow-[0_16px_44px_rgba(32,26,34,0.12)]'
      }`}
    >
      {/* Subtle scanline + fog */}
      <div className="absolute inset-0 opacity-[0.06] bg-[linear-gradient(transparent_0%,rgba(255,255,255,0.9)_50%,transparent_100%)] bg-[length:100%_8px]" />
      <div className="absolute inset-0 opacity-[0.85] bg-[radial-gradient(circle_at_30%_20%,rgba(255,79,167,0.14),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(130,102,255,0.12),transparent_52%)]" />

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
              <Clock className="w-7 h-7 text-foreground/85" />
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
                isCriticalTime ? 'text-red-200' : isLowTime ? 'text-orange-200' : 'text-foreground'
              }`}
              style={{
                textShadow: isCriticalTime
                  ? '0 0 15px rgba(239, 68, 68, 0.6)'
                  : isLowTime
                  ? '0 0 15px rgba(249, 115, 22, 0.6)'
                  : '0 1px 0 rgba(255, 255, 255, 0.9)',
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
                  : 'text-foreground/60'
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
