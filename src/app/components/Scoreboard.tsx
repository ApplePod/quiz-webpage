import React from 'react';
import { Team } from '../types';
import { Trophy, Coins } from 'lucide-react';
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
        <div className="escape-card">
          <div className="escape-card-inner p-6">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <h2 className="text-2xl font-bold text-white">Scoreboard</h2>
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
                  className={`p-4 rounded-xl border transition-all duration-300 ${
                    isTopTeam
                      ? 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border-yellow-400/50 shadow-lg shadow-yellow-500/30'
                      : 'bg-white/5 border-white/20 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          isTopTeam
                            ? 'bg-yellow-400 text-yellow-900'
                            : 'bg-purple-500/50 text-white'
                        }`}
                      >
                        {team.name.split(' ')[1]}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{team.name}</div>
                        {index === 0 && (
                          <div className="text-xs text-yellow-400 flex items-center gap-1">
                            <Trophy className="w-3 h-3" />
                            Leading
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Coins className="w-5 h-5 text-yellow-400" />
                      <motion.span
                        key={team.coins}
                        initial={{ scale: 1.3, color: '#facc15' }}
                        animate={{ scale: 1, color: '#ffffff' }}
                        transition={{ duration: 0.5 }}
                        className="text-xl font-bold text-white"
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
    </div>
  );
}
