import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  timeRemaining: number; // in seconds
  timerRunning: boolean;
  onTimeUpdate: (newTime: number) => void;
}

export function Timer({ timeRemaining, timerRunning, onTimeUpdate }: TimerProps) {
  useEffect(() => {
    if (timeRemaining <= 0 || !timerRunning) return;

    const interval = setInterval(() => {
      onTimeUpdate(timeRemaining - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining, timerRunning, onTimeUpdate]);

  const hours = Math.floor(timeRemaining / 3600);
  const minutes = Math.floor((timeRemaining % 3600) / 60);
  const seconds = timeRemaining % 60;

  const isLowTime = timeRemaining < 600; // Less than 10 minutes

  return (
    <div
      className={`flex items-center gap-3 px-6 py-4 rounded-2xl backdrop-blur-md border ${
        isLowTime
          ? 'bg-red-500/20 border-red-400/50 shadow-lg shadow-red-500/30'
          : 'bg-white/10 border-white/30 shadow-lg shadow-purple-500/20'
      } transition-all duration-300`}
    >
      <Clock
        className={`w-6 h-6 ${isLowTime ? 'text-red-400 animate-pulse' : 'text-purple-300'}`}
      />
      <div className="text-center">
        <div
          className={`text-3xl font-bold font-mono ${
            isLowTime
              ? 'text-red-300 animate-pulse'
              : 'bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent'
          }`}
        >
          {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:
          {String(seconds).padStart(2, '0')}
        </div>
        <div className="text-xs text-gray-300 mt-1">
          {timerRunning ? 'Time Remaining' : 'Paused'}
        </div>
      </div>
    </div>
  );
}
