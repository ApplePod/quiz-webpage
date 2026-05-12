import React, { useState } from 'react';
import { Team } from '../types';
import { Lock, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { motion } from 'motion/react';

interface PasswordAuthProps {
  team: Team;
  selectedQuestionId: number;
  onSuccess: (password: string) => Promise<boolean> | boolean;
  onBack: () => void;
}

export function PasswordAuth({
  team,
  selectedQuestionId,
  onSuccess,
  onBack,
}: PasswordAuthProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const isValid = await onSuccess(password);
    if (!isValid) {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Back Button */}
        <Button
          onClick={onBack}
          variant="ghost"
          className="mb-6 text-foreground hover:bg-white/70 backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Team Selection
        </Button>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mystery-card p-8"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 border border-border bg-white/70 mb-4 shadow-[0_12px_34px_rgba(32,26,34,0.10)] rounded-2xl">
              <Lock className="w-8 h-8 text-foreground/85" />
            </div>
            <h2 className="text-3xl font-bold mystery-title mb-2">Team Authentication</h2>
            <p className="mystery-subtitle">
              Question {selectedQuestionId} • {team.name}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground/80 mb-2">
                Enter Team Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="••••••••"
                className="bg-white/80 border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/25 rounded-2xl"
                autoFocus
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 rounded-lg bg-red-500/20 border border-red-400/50"
              >
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-sm text-red-300">{error}</p>
              </motion.div>
            )}

            <Button
              type="submit"
              className="w-full border border-primary/25 bg-primary text-primary-foreground font-semibold py-6 text-lg hover:opacity-95"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Checking...' : 'Continue'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Passwords are validated securely against the shared game room.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
