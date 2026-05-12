import React from 'react';
import { Team } from '../types';
import { Trophy, Coins, Flame } from 'lucide-react';
import { motion } from 'motion/react';

interface ScoreboardProps {
  teams: Team[];
}

export function Scoreboard({ teams }: ScoreboardProps) {
  // Sort teams by coins (descending)
  const sortedTeams = [...teams].sort((a, b) => b.coins - a.coins);
  const topTeam = sortedTeams[0];

  return (
    <div className="h-full">
      <div className="sticky top-8">
        <div className="mystery-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <h2 className="text-2xl font-bold mystery-title">랭킹</h2>
          </div>

          <div className="space-y-3">
            {sortedTeams.map((team, index) => {
              const isTopTeam = team.id === topTeam.id;
              return (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-2xl border transition-all duration-300 ${
                    isTopTeam
                      ? 'bg-yellow-500/10 border-yellow-400/40 shadow-[0_0_30px_rgba(250,204,21,0.18)]'
                      : 'bg-white/60 border-border hover:bg-white/80 shadow-[0_12px_30px_rgba(32,26,34,0.10)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 border flex items-center justify-center font-bold rounded-xl ${
                          isTopTeam
                            ? 'border-yellow-300/60 bg-yellow-400 text-yellow-900'
                            : 'border-border bg-white/70 text-foreground'
                        }`}
                      >
                        {team.name.split(' ')[1]}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{team.name}</div>
                        {index === 0 && (
                          <div className="text-xs text-orange-500 flex items-center gap-1.5 font-medium">
                            <motion.span
                              className="inline-flex"
                              animate={{
                                scale: [1, 1.2, 0.92, 1.12, 1],
                                rotate: [-4, 5, -3, 4, 0],
                                y: [0, -1, 1, -0.5, 0],
                              }}
                              transition={{
                                duration: 1.15,
                                repeat: Infinity,
                                ease: 'easeInOut',
                              }}
                            >
                              <Flame
                                className="w-3.5 h-3.5 shrink-0 drop-shadow-[0_0_6px_rgba(249,115,22,0.75)]"
                                fill="currentColor"
                                strokeWidth={1.5}
                              />
                            </motion.span>
                            <motion.span
                              animate={{ opacity: [1, 0.82, 1, 0.9, 1] }}
                              transition={{ duration: 1.15, repeat: Infinity, ease: 'easeInOut' }}
                            >
                              불타는중
                            </motion.span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Coins className="w-5 h-5 text-yellow-400" />
                      <motion.span
                        key={team.coins}
                        initial={{ scale: 1.3, color: '#facc15' }}
                        animate={{ scale: 1, color: '#201a22' }}
                        transition={{ duration: 0.5 }}
                        className="text-xl font-bold text-foreground"
                      >
                        {team.coins}
                      </motion.span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
