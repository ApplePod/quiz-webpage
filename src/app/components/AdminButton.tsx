import React from 'react';
import { Settings } from 'lucide-react';

interface AdminButtonProps {
  onClick: () => void;
}

export function AdminButton({ onClick }: AdminButtonProps) {
  return (
    <button
      onClick={onClick}
      className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/25 transition-all duration-200 text-gray-200/70 hover:text-gray-100 text-sm backdrop-blur"
    >
      <Settings className="w-3.5 h-3.5" />
      <span>Admin</span>
    </button>
  );
}
