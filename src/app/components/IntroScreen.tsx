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
          className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/30 p-10 shadow-2xl"
        >
          <div className="text-center">
            <div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
              <Compass className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">Escape Quiz Room</h1>
            <p className="mt-3 text-gray-300 leading-relaxed">
              신비한 공간에 오신 것을 환영합니다.
              <br />
              팀을 선택하고 한 번만 인증하면, 이제부터는 비밀번호 입력 없이 문제를 풀 수 있어요.
            </p>

            <div className="mt-8">
              <Button
                onClick={onStart}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-7 text-lg"
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

