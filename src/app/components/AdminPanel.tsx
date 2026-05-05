import React, { useState } from 'react';
import { X, FileText, Users, Settings, RotateCcw, Play, Pause, StopCircle, Unlock, Lock, Save, Coins } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Team, Question, QuestionStatus } from '../types';
import { motion } from 'motion/react';

interface AdminPanelProps {
  teams: Team[];
  questions: Question[];
  questionStatuses: QuestionStatus[];
  timeRemaining: number;
  timerRunning: boolean;
  onClose: () => void;
  onUpdateTeam: (teamId: string, updates: Partial<Team>) => void;
  onUpdateQuestion: (questionId: number, updates: Partial<Question>) => void;
  onResetQuestion: (questionId: number) => void;
  onResetAllQuestions: () => void;
  onResetAllTeams: () => void;
  onResetTimer: () => void;
  onToggleTimer: () => void;
  onManualLockQuestion: (questionId: number, locked: boolean) => void;
}

export function AdminPanel({
  teams,
  questions,
  questionStatuses,
  timeRemaining,
  timerRunning,
  onClose,
  onUpdateTeam,
  onUpdateQuestion,
  onResetQuestion,
  onResetAllQuestions,
  onResetAllTeams,
  onResetTimer,
  onToggleTimer,
  onManualLockQuestion,
}: AdminPanelProps) {
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);
  const [teamEdits, setTeamEdits] = useState<Partial<Team>>({});
  const [questionEdits, setQuestionEdits] = useState<Partial<Question>>({});

  const handleTeamEdit = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId);
    if (team) {
      setEditingTeam(teamId);
      setTeamEdits(team);
    }
  };

  const handleTeamSave = (teamId: string) => {
    onUpdateTeam(teamId, teamEdits);
    setEditingTeam(null);
    setTeamEdits({});
  };

  const handleQuestionEdit = (questionId: number) => {
    const question = questions.find((q) => q.id === questionId);
    if (question) {
      setEditingQuestion(questionId);
      setQuestionEdits(question);
    }
  };

  const handleQuestionSave = (questionId: number) => {
    onUpdateQuestion(questionId, questionEdits);
    setEditingQuestion(null);
    setQuestionEdits({});
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4 py-8 overflow-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-6xl shadow-2xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-3xl font-bold text-white">Admin Panel</h2>
            <p className="text-gray-400 mt-1">Manage quiz settings and data</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <Tabs defaultValue="questions" className="w-full">
            <TabsList className="bg-gray-800 border-gray-700">
              <TabsTrigger value="questions" className="data-[state=active]:bg-gray-700">
                <FileText className="w-4 h-4 mr-2" />
                Questions
              </TabsTrigger>
              <TabsTrigger value="teams" className="data-[state=active]:bg-gray-700">
                <Users className="w-4 h-4 mr-2" />
                Teams
              </TabsTrigger>
              <TabsTrigger value="controls" className="data-[state=active]:bg-gray-700">
                <Settings className="w-4 h-4 mr-2" />
                Game Controls
              </TabsTrigger>
            </TabsList>

            {/* Questions Tab */}
            <TabsContent value="questions" className="mt-6">
              <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-800 border-b border-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-gray-300 font-semibold">Q#</th>
                        <th className="px-4 py-3 text-left text-gray-300 font-semibold">Question Text</th>
                        <th className="px-4 py-3 text-left text-gray-300 font-semibold">Answer</th>
                        <th className="px-4 py-3 text-left text-gray-300 font-semibold">Hint</th>
                        <th className="px-4 py-3 text-left text-gray-300 font-semibold">Hint Cost</th>
                        <th className="px-4 py-3 text-left text-gray-300 font-semibold">Reward</th>
                        <th className="px-4 py-3 text-left text-gray-300 font-semibold">Solves</th>
                        <th className="px-4 py-3 text-left text-gray-300 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {questions.map((question) => {
                        const status = questionStatuses.find((s) => s.questionId === question.id);
                        const isEditing = editingQuestion === question.id;
                        const isLocked = (status?.solveCount || 0) >= 3;

                        return (
                          <tr key={question.id} className="hover:bg-gray-800/50 transition-colors">
                            <td className="px-4 py-3 text-white font-medium">Q{question.id}</td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <Input
                                  value={questionEdits.questionText || ''}
                                  onChange={(e) =>
                                    setQuestionEdits({ ...questionEdits, questionText: e.target.value })
                                  }
                                  className="bg-gray-700 border-gray-600 text-white text-xs"
                                />
                              ) : (
                                <span className="text-gray-300 text-xs line-clamp-2">
                                  {question.questionText}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <Input
                                  value={questionEdits.correctAnswer || ''}
                                  onChange={(e) =>
                                    setQuestionEdits({ ...questionEdits, correctAnswer: e.target.value })
                                  }
                                  className="bg-gray-700 border-gray-600 text-white text-xs"
                                />
                              ) : (
                                <span className="text-green-400 font-mono text-xs">
                                  {question.correctAnswer}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <Input
                                  value={questionEdits.hint || ''}
                                  onChange={(e) =>
                                    setQuestionEdits({ ...questionEdits, hint: e.target.value })
                                  }
                                  className="bg-gray-700 border-gray-600 text-white text-xs"
                                />
                              ) : (
                                <span className="text-yellow-400 text-xs line-clamp-1">
                                  {question.hint}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <Input
                                  type="number"
                                  value={questionEdits.hintCost || 0}
                                  onChange={(e) =>
                                    setQuestionEdits({
                                      ...questionEdits,
                                      hintCost: parseInt(e.target.value) || 0,
                                    })
                                  }
                                  className="bg-gray-700 border-gray-600 text-white text-xs w-20"
                                />
                              ) : (
                                <span className="text-orange-400">{question.hintCost}</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <Input
                                  type="number"
                                  value={questionEdits.coinReward || 0}
                                  onChange={(e) =>
                                    setQuestionEdits({
                                      ...questionEdits,
                                      coinReward: parseInt(e.target.value) || 0,
                                    })
                                  }
                                  className="bg-gray-700 border-gray-600 text-white text-xs w-20"
                                />
                              ) : (
                                <div className="flex items-center gap-1">
                                  <span className="text-yellow-400 font-bold">{question.coinReward}</span>
                                  <Coins className="w-4 h-4 text-yellow-400" />
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-semibold ${
                                    isLocked
                                      ? 'bg-red-500/20 text-red-400'
                                      : (status?.solveCount || 0) > 0
                                      ? 'bg-green-500/20 text-green-400'
                                      : 'bg-gray-700 text-gray-400'
                                  }`}
                                >
                                  {status?.solveCount || 0}/3
                                </span>
                                {isLocked && <Lock className="w-3 h-3 text-red-400" />}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {isEditing ? (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => handleQuestionSave(question.id)}
                                      className="bg-green-600 hover:bg-green-700 text-white h-7 px-2 text-xs"
                                    >
                                      <Save className="w-3 h-3 mr-1" />
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setEditingQuestion(null)}
                                      className="border-gray-600 text-gray-300 h-7 px-2 text-xs"
                                    >
                                      Cancel
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => handleQuestionEdit(question.id)}
                                      className="bg-blue-600 hover:bg-blue-700 text-white h-7 px-2 text-xs"
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => onResetQuestion(question.id)}
                                      className="bg-orange-600 hover:bg-orange-700 text-white h-7 px-2 text-xs"
                                    >
                                      <RotateCcw className="w-3 h-3" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={onResetAllQuestions}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset All Questions
                </Button>
              </div>
            </TabsContent>

            {/* Teams Tab */}
            <TabsContent value="teams" className="mt-6">
              <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-800 border-b border-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-gray-300 font-semibold">ID</th>
                        <th className="px-4 py-3 text-left text-gray-300 font-semibold">Team Name</th>
                        <th className="px-4 py-3 text-left text-gray-300 font-semibold">Coins</th>
                        <th className="px-4 py-3 text-left text-gray-300 font-semibold">Password</th>
                        <th className="px-4 py-3 text-left text-gray-300 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {teams.map((team) => {
                        const isEditing = editingTeam === team.id;

                        return (
                          <tr key={team.id} className="hover:bg-gray-800/50 transition-colors">
                            <td className="px-4 py-3">
                              <span className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                                {team.id}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <Input
                                  value={teamEdits.name || ''}
                                  onChange={(e) => setTeamEdits({ ...teamEdits, name: e.target.value })}
                                  className="bg-gray-700 border-gray-600 text-white"
                                />
                              ) : (
                                <span className="text-white font-semibold">{team.name}</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <Input
                                  type="number"
                                  value={teamEdits.coins || 0}
                                  onChange={(e) =>
                                    setTeamEdits({ ...teamEdits, coins: parseInt(e.target.value) || 0 })
                                  }
                                  className="bg-gray-700 border-gray-600 text-white w-24"
                                />
                              ) : (
                                <span className="text-yellow-400 font-bold text-lg">{team.coins}</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <Input
                                  value={teamEdits.password || ''}
                                  onChange={(e) =>
                                    setTeamEdits({ ...teamEdits, password: e.target.value })
                                  }
                                  className="bg-gray-700 border-gray-600 text-white"
                                />
                              ) : (
                                <span className="text-gray-400 font-mono">{'•'.repeat(team.password.length)}</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {isEditing ? (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => handleTeamSave(team.id)}
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      <Save className="w-4 h-4 mr-1" />
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setEditingTeam(null)}
                                      className="border-gray-600 text-gray-300"
                                    >
                                      Cancel
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => handleTeamEdit(team.id)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                  >
                                    Edit
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={onResetAllTeams}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset All Teams
                </Button>
              </div>
            </TabsContent>

            {/* Game Controls Tab */}
            <TabsContent value="controls" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Timer Controls */}
                <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Timer Controls
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                      <div className="text-sm text-gray-400 mb-1">Current Time</div>
                      <div className="text-3xl font-bold text-white font-mono">
                        {formatTime(timeRemaining)}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        Status: {timerRunning ? (
                          <span className="text-green-400">Running</span>
                        ) : (
                          <span className="text-orange-400">Paused</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={onToggleTimer}
                        className={`flex-1 ${
                          timerRunning
                            ? 'bg-orange-600 hover:bg-orange-700'
                            : 'bg-green-600 hover:bg-green-700'
                        } text-white`}
                      >
                        {timerRunning ? (
                          <>
                            <Pause className="w-4 h-4 mr-2" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Start
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={onResetTimer}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset to 2h
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Game Statistics */}
                <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Game Statistics
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-900 rounded-lg border border-gray-700">
                      <span className="text-gray-300">Total Questions</span>
                      <span className="text-white font-bold">{questions.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-900 rounded-lg border border-gray-700">
                      <span className="text-gray-300">Questions Solved</span>
                      <span className="text-green-400 font-bold">
                        {questionStatuses.filter((s) => s.solveCount > 0).length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-900 rounded-lg border border-gray-700">
                      <span className="text-gray-300">Locked Questions</span>
                      <span className="text-red-400 font-bold">
                        {questionStatuses.filter((s) => s.solveCount >= 3).length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-900 rounded-lg border border-gray-700">
                      <span className="text-gray-300">Total Teams</span>
                      <span className="text-white font-bold">{teams.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    </div>
  );
}
