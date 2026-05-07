import React, { useState } from 'react';
import { motion } from 'motion/react';

/**
 * 방탈출 느낌 탐정 캐리커쳐 — idle / hover / tap 이벤트 모션
 */
export function DetectiveMascot({
  className = '',
  hideFootnote = false,
}: {
  className?: string;
  /** 인트로 등에서 한 줄 안내 숨김 */
  hideFootnote?: boolean;
}) {
  const [hint, setHint] = useState(false);
  const [burstKey, setBurstKey] = useState(0);

  const handleTap = () => {
    setBurstKey((k) => k + 1);
    setHint(true);
    window.setTimeout(() => setHint(false), 2200);
  };

  return (
    <motion.div
      className={`relative select-none cursor-pointer ${className}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={handleTap}
      role="img"
      aria-label="탐정 캐릭터 — 클릭하면 짧은 힌트가 표시됩니다"
    >
      {hint && (
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          className="absolute -top-2 left-1/2 z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded border border-white/30 bg-black/90 px-3 py-1.5 text-[11px] text-white/90 shadow-lg pointer-events-none"
        >
          단서는 화면 곳곳에… 관찰하세요.
        </motion.div>
      )}

      {burstKey > 0 && (
        <motion.span
          key={burstKey}
          className="pointer-events-none absolute left-1/2 top-[42%] z-10 -translate-x-1/2 -translate-y-1/2 text-2xl text-white/80"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0, 1, 0], scale: [0.6, 1.15, 0.95] }}
          transition={{ duration: 0.85, ease: 'easeOut' }}
        >
          ✦ ✧ ✦
        </motion.span>
      )}

      <motion.div
        className="relative mx-auto w-[min(200px,42vw)]"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg
          viewBox="0 0 200 240"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-auto w-full drop-shadow-[0_0_24px_rgba(255,255,255,0.12)]"
          aria-hidden
        >
          <motion.ellipse
            cx="100"
            cy="218"
            rx="72"
            ry="10"
            fill="white"
            opacity={0.08}
            animate={{ rx: [72, 78, 72], opacity: [0.06, 0.12, 0.06] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />

          <path
            d="M52 175 C48 200 55 220 100 224 C145 220 152 200 148 175 L140 130 L60 130 Z"
            fill="white"
            fillOpacity="0.14"
            stroke="white"
            strokeOpacity="0.45"
            strokeWidth="1.2"
          />

          <circle cx="100" cy="108" r="34" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.5" strokeWidth="1.2" />

          <path
            d="M66 92 C66 72 134 72 134 92 C134 98 122 104 100 104 C78 104 66 98 66 92Z"
            fill="white"
            fillOpacity="0.2"
          />
          <ellipse cx="100" cy="94" rx="44" ry="14" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.35" />

          <path d="M68 94 L62 118 L74 114 Z" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.3" />
          <path d="M132 94 L138 118 L126 114 Z" fill="white" fillOpacity="0.12" stroke="white" strokeOpacity="0.3" />

          <motion.g style={{ transformBox: 'fill-box', transformOrigin: '100px 104px' }}>
            <motion.circle
              cx="90"
              cy="104"
              r="3"
              fill="white"
              fillOpacity={0.85}
              animate={{ scaleY: [1, 0.15, 1, 1, 1], opacity: [0.85, 0.85, 0.85, 0.85, 0.85] }}
              transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 2.2, times: [0, 0.05, 0.1, 1, 1] }}
              style={{ transformOrigin: '90px 104px' }}
            />
            <motion.circle
              cx="110"
              cy="104"
              r="3"
              fill="white"
              fillOpacity={0.85}
              animate={{ scaleY: [1, 0.15, 1, 1, 1] }}
              transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 2.2, times: [0, 0.05, 0.1, 1, 1] }}
              style={{ transformOrigin: '110px 104px' }}
            />
          </motion.g>

          <path
            d="M92 120 Q100 126 108 118"
            stroke="white"
            strokeOpacity="0.45"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          <motion.g
            animate={{ rotate: [-6, 6, -6], x: [-2, 2, -2] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformBox: 'fill-box', transformOrigin: '142px 118px' }}
          >
            <circle cx="142" cy="118" r="22" stroke="white" strokeOpacity="0.7" strokeWidth="3.5" fill="white" fillOpacity="0.05" />
            <path d="M158 134 L176 154" stroke="white" strokeOpacity="0.55" strokeWidth="5" strokeLinecap="round" />
          </motion.g>

          <motion.circle
            cx="78"
            cy="118"
            r="6"
            fill="white"
            fillOpacity="0.15"
            animate={{ cy: [118, 95, 80], opacity: [0.2, 0.08, 0], scale: [1, 1.2, 1.4] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeOut' }}
          />
          <motion.circle
            cx="82"
            cy="118"
            r="4"
            fill="white"
            fillOpacity="0.12"
            animate={{ cy: [118, 92, 75], opacity: [0.15, 0.06, 0], scale: [1, 1.3, 1.5] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeOut', delay: 0.6 }}
          />

          <rect x="70" y="122" width="18" height="10" rx="2" fill="white" fillOpacity="0.35" />
          <path
            d="M88 126 L112 131"
            stroke="white"
            strokeOpacity="0.4"
            strokeWidth="4"
            strokeLinecap="round"
          />

          <motion.circle
            cx="40"
            cy="60"
            r="2"
            fill="white"
            fillOpacity="0.5"
            animate={{ opacity: [0.15, 0.55, 0.15], scale: [0.9, 1.15, 0.9] }}
            transition={{ duration: 2.2, repeat: Infinity }}
          />
          <motion.circle
            cx="170"
            cy="72"
            r="1.5"
            fill="white"
            fillOpacity="0.45"
            animate={{ opacity: [0.2, 0.6, 0.2], scale: [0.85, 1.2, 0.85] }}
            transition={{ duration: 2.8, repeat: Infinity, delay: 0.4 }}
          />
        </svg>

        {!hideFootnote && (
          <p className="mt-1 text-center text-[10px] tracking-wide text-white/35">
            탭 → 짧은 힌트 · 렌즈·연기 계속 움직임
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}
