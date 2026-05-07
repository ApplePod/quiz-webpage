import React from 'react'
import { motion } from 'motion/react'
import { Compass, Sparkles } from 'lucide-react'
import { Button } from './ui/button'
import { AdminButton } from './AdminButton'
import { DetectiveMascot } from './DetectiveMascot'

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
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
            <div className="flex-1 text-center lg:text-left">
              <div className="mx-auto lg:mx-0 mb-6 w-20 h-20 border border-white/40 bg-black/50 flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.08)]">
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

              <div className="mt-8 lg:max-w-md">
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

            <div className="relative flex shrink-0 justify-center lg:w-[220px] lg:pt-2">
              <div className="pointer-events-none absolute inset-[-20%] opacity-[0.1] lg:opacity-[0.14] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.4),transparent_65%)]" />
              <DetectiveMascot hideFootnote className="relative z-[1]" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

