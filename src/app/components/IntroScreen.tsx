import React from 'react'
import { motion } from 'motion/react'
import { Compass, Sparkles } from 'lucide-react'
import { Button } from './ui/button'
import { AdminButton } from './AdminButton'

type IntroScreenProps = {
  onStart: () => void
  onAdminClick: () => void
}

export function IntroScreen({ onStart, onAdminClick }: IntroScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mystery-card p-10 relative overflow-hidden"
        >
          {/* Detective caricature watermark */}
          <div className="pointer-events-none absolute -right-10 -bottom-12 opacity-[0.14]">
            <svg
              width="420"
              height="420"
              viewBox="0 0 420 420"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              {/* Spotlight */}
              <path
                d="M380 55C320 25 250 25 190 55C120 90 70 170 70 255C70 345 135 392 215 392C305 392 370 342 370 255C370 170 325 90 380 55Z"
                fill="white"
                opacity="0.10"
              />
              {/* Hat */}
              <path
                d="M130 155C155 120 190 103 235 103C280 103 315 120 340 155C305 170 272 178 235 178C198 178 165 170 130 155Z"
                fill="white"
              />
              <path d="M150 165H320C312 186 294 198 270 198H200C176 198 158 186 150 165Z" fill="white" opacity="0.92" />
              {/* Face silhouette */}
              <path
                d="M170 205C170 170 197 145 235 145C273 145 300 170 300 205V225C300 270 270 305 235 305C200 305 170 270 170 225V205Z"
                fill="white"
                opacity="0.9"
              />
              {/* Pipe */}
              <path
                d="M272 255C300 255 318 270 318 288C318 306 300 318 272 318H238V300H272C288 300 298 295 298 288C298 281 288 275 272 275H252V255H272Z"
                fill="white"
                opacity="0.85"
              />
              <path d="M222 292C222 278 233 266 248 266H260V286H248C244 286 242 289 242 292V324C242 336 232 346 220 346H190V326H212C218 326 222 320 222 314V292Z" fill="white" opacity="0.6" />
              {/* Magnifier */}
              <circle cx="130" cy="290" r="42" stroke="white" strokeWidth="10" opacity="0.7" />
              <path d="M158 322L196 360" stroke="white" strokeWidth="12" strokeLinecap="round" opacity="0.6" />
            </svg>
          </div>
          <div className="text-center">
            <div className="mx-auto mb-6 w-20 h-20 border border-white/40 bg-black/50 flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.08)]">
              <Compass className="w-10 h-10 text-white" />
            </div>
            <div className="text-xs tracking-[0.35em] text-white/55">
              YOU SEE, BUT DO NOT OBSERVE.
            </div>
            <h1 className="mt-3 text-4xl font-bold mystery-title">Escape Quiz Room</h1>
            <p className="mt-3 mystery-subtitle leading-relaxed">
              신비한 공간에 오신 것을 환영합니다.
              <br />
              팀을 선택하고 한 번만 인증하면, 이제부터는 비밀번호 입력 없이 문제를 풀 수 있어요.
            </p>

            <div className="mt-8">
              <Button
                onClick={onStart}
                className="w-full border border-white/40 bg-transparent text-white font-semibold py-7 text-lg hover:bg-white/10"
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

