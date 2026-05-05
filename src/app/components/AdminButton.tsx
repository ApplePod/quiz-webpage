import React from 'react';
import { Settings } from 'lucide-react';

interface AdminButtonProps {
  onClick: () => void;
}

export function AdminButton({ onClick }: AdminButtonProps) {
  return (
    <button
      onClick={onClick}
      className="mt-2 w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-gray-800/30 hover:bg-gray-700/40 border border-gray-600/30 hover:border-gray-500/50 transition-all duration-200 text-gray-400 hover:text-gray-300 text-sm"
    >
      <Settings className="w-3.5 h-3.5" />
      <span>Admin</span>
    </button>
  );
}
