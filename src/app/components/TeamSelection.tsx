import React from 'react';
import { Team, QuestionStatus } from '../types';
import { Users, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { motion } from 'motion/react';

interface TeamSelectionProps {
  teams: Team[];
  selectedQuestionId: number;
  questionStatuses: QuestionStatus[];
  onTeamSelect: (team: Team) => void;
  onBack: () => void;
}

export function TeamSelection({
  teams,
  selectedQuestionId,
  questionStatuses,
  onTeamSelect,
  onBack,
}: TeamSelectionProps) {
  // Get teams that have already solved this question
  const questionStatus = questionStatuses.find(
    (s) => s.questionId === selectedQuestionId
  );
  const solvedByTeamIds = questionStatus?.solvedByTeams || [];
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        {/* Back Button */}
        <Button
          onClick={onBack}
          variant="ghost"
          className="mb-6 text-white hover:bg-white/10 backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Questions
        </Button>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/30 p-8 shadow-2xl"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Select Your Team</h2>
            <p className="text-gray-300">
              Question {selectedQuestionId} • Choose a team to continue
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {teams.map((team, index) => {
              const hasSolved = solvedByTeamIds.includes(team.id);
              return (
                <motion.button
                  key={team.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={hasSolved ? {} : { scale: 1.05, y: -5 }}
                  whileTap={hasSolved ? {} : { scale: 0.95 }}
                  onClick={() => !hasSolved && onTeamSelect(team)}
                  disabled={hasSolved}
                  className={`p-6 rounded-xl border transition-all duration-300 ${
                    hasSolved
                      ? 'bg-green-500/10 border-green-400/30 opacity-60 cursor-not-allowed'
                      : 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-400/50 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/30'
                  }`}
                >
                  <div className="text-center relative">
                    {hasSolved && (
                      <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center mx-auto mb-3">
                      <span className="text-xl font-bold text-white">{team.id}</span>
                    </div>
                    <div className="text-xl font-semibold text-white mb-1">{team.name}</div>
                    <div className="text-sm text-gray-300">
                      {team.coins} coins
                      {hasSolved && (
                        <span className="block text-green-400 mt-1 text-xs">
                          Already solved ✓
                        </span>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
