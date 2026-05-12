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
    <div className="min-h-dvh min-h-screen flex items-center justify-center px-4 py-8">
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
          className="mb-6 text-foreground hover:bg-white/70 backdrop-blur-sm"
          disabled={isSubmitting}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {selectedTeamId ? 'Back to Teams' : 'Back'}
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mystery-card p-8 shadow-[0_22px_70px_rgba(32,26,34,0.16)]"
        >
          {!selectedTeam ? (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 border border-border bg-white/70 mb-4 rounded-2xl shadow-[0_12px_34px_rgba(32,26,34,0.10)]">
                  <Users className="w-8 h-8 text-foreground/85" />
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-2">팀 선택</h2>
                <p className="text-muted-foreground">팀을 선택한 뒤 비밀번호를 한 번만 입력하면 됩니다.</p>
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
                  className="p-6 border border-border bg-white/65 backdrop-blur transition-all duration-300 hover:bg-white/85 shadow-[0_12px_34px_rgba(32,26,34,0.10)] rounded-2xl"
                  type="button"
                  aria-label={`${team.name} 팀 선택`}
                >
                  <div className="text-center">
                    <div className="w-12 h-12 border border-border bg-white/75 flex items-center justify-center mx-auto mb-3 rounded-xl">
                      <span className="text-xl font-bold text-foreground">{team.id}</span>
                    </div>
                    <div className="text-xl font-semibold text-foreground mb-1">{team.name}</div>
                    <div className="text-sm text-muted-foreground">{team.coins} coins</div>
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
                <div className="inline-flex items-center justify-center w-16 h-16 border border-border bg-white/70 mb-4 rounded-2xl shadow-[0_12px_34px_rgba(32,26,34,0.10)]">
                  <Lock className="w-8 h-8 text-foreground/85" />
                </div>
                <h2 className="text-3xl font-bold text-foreground mb-2">팀 인증</h2>
                <p className="text-muted-foreground">{selectedTeam.name}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-foreground/80 mb-2">
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
                    className="bg-white/80 border-border text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/25 rounded-2xl"
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
                  className="w-full border border-primary/25 bg-primary text-primary-foreground font-semibold py-6 text-lg hover:opacity-95"
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

