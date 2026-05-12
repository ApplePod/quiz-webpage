import React, { useState } from 'react';
import { Shield, X, Lock } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { motion } from 'motion/react';

interface AdminAuthProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const ADMIN_PASSWORD = 'admin';

export function AdminAuth({ onSuccess, onCancel }: AdminAuthProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      onSuccess();
    } else {
      setError(true);
      setPassword('');
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 bg-[rgba(32,26,34,0.28)] backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mystery-card p-8 w-full max-w-md shadow-[0_22px_70px_rgba(32,26,34,0.20)]"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 border border-border bg-white/70 flex items-center justify-center shadow-[0_12px_34px_rgba(32,26,34,0.12)] rounded-2xl">
              <Shield className="w-6 h-6 text-foreground/85" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Admin Access</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="admin-password" className="block text-sm font-medium text-foreground/80 mb-2">
              Admin Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className={`pl-10 bg-white/80 border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/25 rounded-2xl ${
                  error ? 'border-red-500 shake' : ''
                }`}
                autoFocus
              />
            </div>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-sm mt-2"
              >
                Incorrect password
              </motion.p>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 border-border text-foreground/80 hover:bg-secondary hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 border border-primary/25 bg-primary text-primary-foreground hover:opacity-95"
              disabled={!password}
            >
              Access Admin
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
