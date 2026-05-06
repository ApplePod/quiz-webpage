import React from 'react'
import { motion } from 'motion/react'
import { Heart, KeyRound, Sparkles } from 'lucide-react'
import { Button } from './ui/button'
import { AdminButton } from './AdminButton'

type IntroScreenProps = {
  onStart: () => void
  onAdminClick: () => void
}

export function IntroScreen({ onStart, onAdminClick }: IntroScreenProps) {
  return (
    <div className="escape-container">
      <div className="w-full max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden escape-card"
        >
          {/* Poster-like illustration layer */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-3xl" />
            <div className="absolute -bottom-28 -left-28 h-96 w-96 rounded-full bg-rose-500/10 blur-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.08),transparent_55%)]" />
          </div>

          <div className="text-center escape-card-inner">
            <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/20 px-4 py-2 text-sm text-gray-200">
              <Heart className="h-4 w-4 text-rose-300" />
              소개팅 방탈출
              <span className="text-gray-400">·</span>
              <KeyRound className="h-4 w-4 text-amber-200" />
              러브&락
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
              <span className="bg-gradient-to-r from-amber-200 via-rose-200 to-fuchsia-200 bg-clip-text text-transparent">
                단서
              </span>
              를 모아,
              <br />
              <span className="bg-gradient-to-r from-fuchsia-200 via-rose-200 to-amber-200 bg-clip-text text-transparent">
                마음
              </span>
              을 열어라
            </h1>

            <p className="mt-4 text-gray-300 leading-relaxed">
              이 방에서 풀어야 하는 건 문제만이 아니야.
              <br />
              단서로 잠금을 해제하고, 마지막에 “소개팅 미션”을 완성해!
            </p>

            {/* Character */}
            <div className="mt-8 flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="relative w-full max-w-xl"
              >
                <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-500/10 blur-2xl" />
                <svg
                  viewBox="0 0 740 360"
                  className="w-full"
                  role="img"
                  aria-label="Detective character illustration"
                >
                  <defs>
                    <linearGradient id="coat" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="rgba(56,189,248,0.12)" />
                      <stop offset="55%" stopColor="rgba(168,85,247,0.14)" />
                      <stop offset="100%" stopColor="rgba(244,63,94,0.10)" />
                    </linearGradient>
                    <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
                      <stop offset="60%" stopColor="rgba(255,255,255,0.10)" />
                      <stop offset="100%" stopColor="rgba(255,255,255,0.22)" />
                    </linearGradient>
                    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="2.4" />
                    </filter>
                  </defs>

                  {/* frame */}
                  <rect x="18" y="18" width="704" height="324" rx="26" fill="rgba(0,0,0,0.18)" stroke="rgba(255,255,255,0.18)" />

                  {/* neon grid lines */}
                  <g opacity="0.22">
                    <path d="M80 70H660" stroke="rgba(255,255,255,0.18)" />
                    <path d="M80 120H660" stroke="rgba(255,255,255,0.14)" />
                    <path d="M80 170H660" stroke="rgba(255,255,255,0.12)" />
                    <path d="M80 220H660" stroke="rgba(255,255,255,0.10)" />
                    <path d="M80 270H660" stroke="rgba(255,255,255,0.08)" />
                  </g>

                  {/* character silhouette */}
                  <g transform="translate(250,55)">
                    {/* hat */}
                    <path
                      d="M60 90C75 45 140 25 190 44C215 54 232 74 235 93C210 105 84 116 60 90Z"
                      fill="rgba(10,10,14,0.9)"
                      stroke="rgba(255,255,255,0.12)"
                    />
                    <path
                      d="M40 102C72 92 220 92 255 102C246 124 63 124 40 102Z"
                      fill="rgba(10,10,14,0.95)"
                      stroke="rgba(255,255,255,0.10)"
                    />

                    {/* head */}
                    <path
                      d="M112 118C122 92 158 80 186 90C210 98 224 118 221 141C218 167 198 184 171 187C140 191 106 164 112 118Z"
                      fill="rgba(10,10,14,0.92)"
                      stroke="rgba(255,255,255,0.10)"
                    />
                    {/* glow eye */}
                    <circle cx="158" cy="133" r="6.5" fill="rgba(252,211,77,0.85)" filter="url(#soft)" />

                    {/* coat */}
                    <path
                      d="M70 235C76 182 110 150 158 150C215 150 252 190 255 244C257 282 236 305 198 316C140 332 78 304 70 235Z"
                      fill="url(#coat)"
                      stroke="rgba(255,255,255,0.12)"
                    />
                    <path
                      d="M110 175C142 200 185 200 216 175"
                      stroke="rgba(255,255,255,0.12)"
                      strokeWidth="2"
                      fill="none"
                      opacity="0.7"
                    />

                    {/* key + heart */}
                    <g transform="translate(16,205)">
                      <circle cx="40" cy="40" r="22" fill="rgba(0,0,0,0.25)" stroke="rgba(255,255,255,0.15)" />
                      <path d="M40 28C34 22 22 28 28 40C33 50 40 56 40 56C40 56 47 50 52 40C58 28 46 22 40 28Z" fill="rgba(244,63,94,0.72)" />
                      <path d="M70 46H118" stroke="url(#metal)" strokeWidth="8" strokeLinecap="round" />
                      <circle cx="126" cy="46" r="12" fill="rgba(0,0,0,0.25)" stroke="url(#metal)" strokeWidth="6" />
                      <path d="M118 46h20" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
                    </g>
                  </g>

                  {/* title stamps */}
                  <g opacity="0.8">
                    <text x="66" y="66" fill="rgba(255,255,255,0.65)" fontSize="16" fontFamily="ui-sans-serif, system-ui" letterSpacing="2">
                      LOVE ESCAPE FILE
                    </text>
                    <text x="66" y="88" fill="rgba(255,255,255,0.35)" fontSize="12" fontFamily="ui-monospace, SFMono-Regular" letterSpacing="1.5">
                      CASE# 01 · FIND THE KEY · OPEN THE HEART
                    </text>
                  </g>
                </svg>
              </motion.div>
            </div>

            <div className="mt-8">
              <Button
                onClick={onStart}
                className="escape-btn-primary py-7 text-lg"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                시작하기
              </Button>
            </div>

            <div className="mt-6">
              <AdminButton onClick={onAdminClick} />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

