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
          className="mb-6 text-foreground hover:bg-white/70 backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Questions
        </Button>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mystery-card p-8"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 border border-border bg-white/70 mb-4 shadow-[0_12px_34px_rgba(32,26,34,0.10)] rounded-2xl">
              <Users className="w-8 h-8 text-foreground/85" />
            </div>
            <h2 className="text-3xl font-bold mystery-title mb-2">Select Your Team</h2>
            <p className="mystery-subtitle">
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
                      : 'bg-white/65 border-border hover:bg-white/85 shadow-[0_12px_34px_rgba(32,26,34,0.10)]'
                  }`}
                >
                  <div className="text-center relative">
                    {hasSolved && (
                      <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div className="w-12 h-12 border border-border bg-white/75 flex items-center justify-center mx-auto mb-3 rounded-xl">
                      <span className="text-xl font-bold text-foreground">{team.id}</span>
                    </div>
                    <div className="text-xl font-semibold text-foreground mb-1">{team.name}</div>
                    <div className="text-sm text-muted-foreground">
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
