import React, { useState } from 'react';
import { ShieldAlert, X, Lock } from 'lucide-react';
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
        initial={{ opacity: 0, scale: 0.9, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
        className="mystery-card p-8 w-full max-w-md shadow-[0_22px_70px_rgba(32,26,34,0.20)] relative overflow-hidden"
      >
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-200/35 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-8 bottom-0 h-28 w-28 rounded-full bg-pink-200/25 blur-2xl"
          aria-hidden
        />

        <button
          type="button"
          onClick={onCancel}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="닫기"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="relative text-center mb-6 pt-1">
          <motion.div
            animate={{ rotate: [0, -5, 5, -3, 0] }}
            transition={{ duration: 0.55, repeat: Infinity, repeatDelay: 2.8, ease: 'easeInOut' }}
            className="inline-flex items-center justify-center w-16 h-16 border-2 border-amber-200/90 bg-gradient-to-br from-amber-50 to-orange-50 mb-4 shadow-[0_12px_34px_rgba(251,191,36,0.18)] rounded-2xl"
          >
            <ShieldAlert className="w-8 h-8 text-amber-600" strokeWidth={2.25} />
          </motion.div>
          <h2 className="mystery-title text-2xl font-bold tracking-tight text-amber-950">
            관계자외 진입금지
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-amber-900/85">
            아이코~ 여기는 관계자만 들어올 수 있어요
            <span className="ml-1" aria-hidden>
              🙅
            </span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">모르시면 살짝 뒤로 가 주세요!</p>
        </div>

        <form onSubmit={handleSubmit} className="relative space-y-6">
          <div>
            <label htmlFor="admin-password" className="mystery-subtitle mb-2 block text-sm font-medium">
              관계자 비밀번호
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력해 주세요"
                className={`pl-10 bg-white/80 border-border text-foreground placeholder:text-muted-foreground focus:border-amber-400/60 focus:ring-amber-400/25 rounded-2xl ${
                  error ? 'border-red-400 shake' : ''
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
                앗, 비밀번호가 틀렸어요! 다시 확인해 주세요
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
              돌아가기
            </Button>
            <Button
              type="submit"
              className="flex-1 border border-amber-300/50 bg-gradient-to-b from-amber-400 to-amber-500 text-amber-950 font-semibold hover:from-amber-300 hover:to-amber-400"
              disabled={!password}
            >
              입장하기
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
