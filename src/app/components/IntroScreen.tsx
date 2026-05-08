import React from 'react'
import { motion } from 'motion/react'
import { Sparkles } from 'lucide-react'
import { Button } from './ui/button'
import { AdminButton } from './AdminButton'

type IntroScreenProps = {
  onStart: () => void
  onAdminClick: () => void
}

export function IntroScreen({ onStart, onAdminClick }: IntroScreenProps) {
  const title = 'Escape Quiz Room'
  const chars = Array.from(title)

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mystery-card p-10 relative overflow-hidden"
        >
          <div className="text-center">
            <div className="mx-auto lg:mx-0 mb-6 w-20 h-20 border border-white/40 bg-black/50 flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.08)]">
              <img
                src="/sherlock/assets/images/favicon.png"
                alt="logo"
                className="w-12 h-12 object-contain opacity-95"
                draggable={false}
              />
            </div>

            <div className="text-xs tracking-[0.35em] text-white/55">
              YOU SEE, BUT DO NOT OBSERVE.
            </div>

            <h1 className="mt-3 text-4xl font-bold mystery-title">
              <motion.span
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: 0.035, delayChildren: 0.12 } },
                }}
                aria-label={title}
              >
                {chars.map((ch, idx) => (
                  <motion.span
                    key={`${ch}-${idx}`}
                    variants={{
                      hidden: { opacity: 0, y: 10, filter: 'blur(6px)' },
                      show: {
                        opacity: 1,
                        y: 0,
                        filter: 'blur(0px)',
                        transition: { duration: 0.55, ease: [0.2, 0.8, 0.2, 1] },
                      },
                    }}
                    className="inline-block"
                  >
                    {ch === ' ' ? '\u00A0' : ch}
                  </motion.span>
                ))}
              </motion.span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.6 }}
              className="mt-3 mystery-subtitle leading-relaxed"
            >
              신비한 공간에 오신 것을 환영합니다.
              <br />
              팀을 선택하고 한 번만 인증하면, 이제부터는 비밀번호 입력 없이 문제를 풀 수 있어요.
            </motion.p>

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

