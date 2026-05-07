import React, { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { AlertCircle, ArrowLeft, Lock, Users } from 'lucide-react'
import { Team } from '../types'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { AdminButton } from './AdminButton'

type TeamAuthScreenProps = {
  teams: Team[]
  onAuthenticate: (teamId: string, password: string) => Promise<boolean> | boolean
  onAuthenticated: (team: Team) => void
  onBack: () => void
  onAdminClick: () => void
}

export function TeamAuthScreen({
  teams,
  onAuthenticate,
  onAuthenticated,
  onBack,
  onAdminClick,
}: TeamAuthScreenProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedTeam = useMemo(
    () => (selectedTeamId ? teams.find((t) => t.id === selectedTeamId) ?? null : null),
    [selectedTeamId, teams],
  )

  const handleSelectTeam = (teamId: string) => {
    setSelectedTeamId(teamId)
    setPassword('')
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTeam) return
    setIsSubmitting(true)
    const isValid = await onAuthenticate(selectedTeam.id, password)
    if (!isValid) {
      setError('Incorrect password. Please try again.')
      setPassword('')
      setIsSubmitting(false)
      return
    }
    setIsSubmitting(false)
    onAuthenticated(selectedTeam)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-3xl">
        <Button
          onClick={() => {
            if (selectedTeamId) {
              setSelectedTeamId(null)
              setPassword('')
              setError('')
              return
            }
            onBack()
          }}
          variant="ghost"
          className="mb-6 text-white hover:bg-white/10 backdrop-blur-sm"
          disabled={isSubmitting}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {selectedTeamId ? 'Back to Teams' : 'Back'}
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/30 p-8 shadow-2xl"
        >
          {!selectedTeam ? (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 border border-white/40 bg-black/50 mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Select Your Team</h2>
                <p className="text-gray-300">팀을 선택한 뒤 비밀번호를 한 번만 입력하면 됩니다.</p>
              </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {teams.map((team, index) => (
                <motion.button
                  key={team.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.06 }}
                  whileHover={{ scale: 1.03, y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSelectTeam(team.id)}
                  className="p-6 border border-white/25 bg-black/35 transition-all duration-300 hover:border-white/50 hover:bg-white/5"
                  type="button"
                  aria-label={`${team.name} 팀 선택`}
                >
                  <div className="text-center">
                    <div className="w-12 h-12 border border-white/40 bg-black/40 flex items-center justify-center mx-auto mb-3">
                      <span className="text-xl font-bold text-white">{team.id}</span>
                    </div>
                    <div className="text-xl font-semibold text-white mb-1">{team.name}</div>
                    <div className="text-sm text-gray-300">{team.coins} coins</div>
                  </div>
                </motion.button>
              ))}
            </div>

              <div className="mt-6">
                <AdminButton onClick={onAdminClick} />
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 border border-white/40 bg-black/50 mb-4">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Team Authentication</h2>
                <p className="text-gray-300">{selectedTeam.name}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                    Enter Team Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setError('')
                    }}
                    placeholder="••••••••"
                    className="bg-black/40 border-white/40 text-white placeholder:text-white/50 focus:border-white/70 focus:ring-white/30"
                    autoFocus
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 rounded-lg bg-red-500/20 border border-red-400/50"
                  >
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <p className="text-sm text-red-300">{error}</p>
                  </motion.div>
                )}

                <Button
                  type="submit"
                  className="w-full border border-white/40 bg-transparent text-white font-semibold py-6 text-lg hover:bg-white/10"
                  disabled={isSubmitting || password.length === 0}
                >
                  {isSubmitting ? 'Checking...' : 'Continue'}
                </Button>
              </form>

              <div className="mt-6">
                <AdminButton onClick={onAdminClick} />
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}

