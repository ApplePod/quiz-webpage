import React, { useMemo, useState } from 'react';
import {
  X,
  FileText,
  Users,
  Settings,
  RotateCcw,
  Play,
  Pause,
  Lock,
  Save,
  Coins,
  FlaskConical,
  ListOrdered,
  Filter,
  Search,
  Plus,
  Trash2,
  Shield,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Team, Question, QuestionStatus, TeamAdminUpdate } from '../types';
import { motion } from 'motion/react';
import { formatDirectionDigits, parseDirectionDigits, directionDigitsToArrows } from '../utils/answerCodec';
import { isSupabaseConfigured } from '../../lib/supabase';
import { uploadHintImage } from '../services/gameService';
import { draftParticipantsForEdit, participantsListForTeam } from '../utils/teamParticipants';

/** Matches main app: glassy white + soft quiz shadow */
const adminShellCard =
  'rounded-2xl border border-border bg-white/65 backdrop-blur-sm shadow-[0_16px_44px_rgba(32,26,34,0.10)]';

const adminSectionPad = `${adminShellCard} overflow-hidden`;

const tabTriggerActive =
  'data-[state=active]:border-violet-200/70 data-[state=active]:bg-gradient-to-b data-[state=active]:from-violet-50/95 data-[state=active]:to-white data-[state=active]:text-foreground data-[state=active]:shadow-[0_6px_18px_rgba(139,92,246,0.12)]';

export type AdminPanelProps = {
  teams: Team[];
  questions: Question[];
  questionStatuses: QuestionStatus[];
  timeRemaining: number;
  timerRunning: boolean;
  onClose: () => void;
  onUpdateTeam: (teamId: string, updates: TeamAdminUpdate) => void;
  onUpdateQuestion: (questionId: number, updates: Partial<Question>) => Promise<void> | void;
  onResetQuestion: (questionId: number) => void;
  onResetAllQuestions: () => void;
  onResetAllTeams: () => void;
  onResetTimer: () => void;
  onToggleTimer: () => void;
  onManualLockQuestion: (questionId: number, locked: boolean) => void;
  onAdminResetGame: () => void;
  onAdminSetTestMode: () => void;
  onAdminMarkAllSolved: () => void;
  onAdminSetAllQuestionsSolveTier: (tier: 1 | 2 | 3) => void;
};

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
  onAdminResetGame,
  onAdminSetTestMode,
  onAdminMarkAllSolved,
  onAdminSetAllQuestionsSolveTier,
}: AdminPanelProps) {
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);
  const [teamEdits, setTeamEdits] = useState<TeamAdminUpdate>({});
  const [questionEdits, setQuestionEdits] = useState<Partial<Question>>({});
  const [answerTypeDraft, setAnswerTypeDraft] = useState<Question['answerType']>('text');
  const [correctAnswerDraft, setCorrectAnswerDraft] = useState<string>('');
  const [solveTeamFilter, setSolveTeamFilter] = useState<string>('all');
  const [solveOnlySolved, setSolveOnlySolved] = useState<boolean>(false);
  const [solveQuery, setSolveQuery] = useState<string>('');

  const teamById = useMemo(() => {
    const map = new Map<string, Team>();
    for (const team of teams) map.set(team.id, team);
    return map;
  }, [teams]);

  const solveRows = useMemo(() => {
    const qLower = solveQuery.trim().toLowerCase();
    return questions
      .slice()
      .sort((a, b) => a.id - b.id)
      .map((question) => {
        const status = questionStatuses.find((s) => s.questionId === question.id);
        const solvedBy = status?.solvedByTeams ?? [];
        return { question, status, solvedBy };
      })
      .filter(({ question, solvedBy }) => {
        if (solveOnlySolved && solvedBy.length === 0) return false;
        if (solveTeamFilter !== 'all' && !solvedBy.includes(solveTeamFilter)) return false;
        if (!qLower) return true;
        return (
          String(question.id).includes(qLower) ||
          (question.questionText ?? '').toLowerCase().includes(qLower)
        );
      });
  }, [questions, questionStatuses, solveOnlySolved, solveTeamFilter, solveQuery]);

  const solveTimeMissing = useMemo(() => {
    return questionStatuses.some(
      (status) =>
        (status.solvedByTeams?.length ?? 0) > 0 && (status.solvedBy?.length ?? 0) === 0,
    );
  }, [questionStatuses]);

  const formatSolvedAt = (value?: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const handleTeamEdit = (teamId: string) => {
    const team = teams.find((t) => t.id === teamId);
    if (team) {
      setEditingTeam(teamId);
      setTeamEdits({ ...team, newTeamCode: team.id, participants: draftParticipantsForEdit(team) });
    }
  };

  const handleTeamSave = (teamId: string) => {
    const raw = (teamEdits.newTeamCode ?? teamId).trim();
    if (!raw) {
      window.alert('팀 코드를 입력하세요.');
      return;
    }
    if (raw !== teamId && teams.some((t) => t.id === raw)) {
      window.alert('이미 사용 중인 팀 코드입니다.');
      return;
    }
    const rawList = (teamEdits.participants ?? [])
      .map((p) => ({
        name: (p.name ?? '').trim(),
        gender: p.gender === 'F' || p.gender === 'M' ? p.gender : null,
      }))
      .filter((p) => p.name.length > 0);
    const first = rawList[0];
    onUpdateTeam(teamId, {
      ...teamEdits,
      newTeamCode: raw,
      participants: rawList,
      participantName: first?.name ?? '',
      gender: first?.gender ?? null,
    });
    setEditingTeam(null);
    setTeamEdits({});
  };

  const handleQuestionEdit = (questionId: number) => {
    const question = questions.find((q) => q.id === questionId);
    if (question) {
      setEditingQuestion(questionId);
      setQuestionEdits(question);
      setAnswerTypeDraft(question.answerType ?? 'text');
      if (question.answerType === 'directionLock' && Array.isArray(question.correctAnswer)) {
        setCorrectAnswerDraft(formatDirectionDigits(question.correctAnswer));
      } else {
        setCorrectAnswerDraft(String(question.correctAnswer ?? ''));
      }
    }
  };

  const handleQuestionSave = async (questionId: number) => {
    const nextCorrectAnswer: Question['correctAnswer'] =
      answerTypeDraft === 'directionLock' ? parseDirectionDigits(correctAnswerDraft) : correctAnswerDraft;

    await onUpdateQuestion(questionId, {
      ...questionEdits,
      answerType: answerTypeDraft,
      correctAnswer: nextCorrectAnswer,
    });
    setEditingQuestion(null);
    setQuestionEdits({});
    setCorrectAnswerDraft('');
  };

  const handleHintTypeChange = (nextType: NonNullable<Question['hintType']>) => {
    setQuestionEdits((prev) => {
      const next: Partial<Question> = { ...prev, hintType: nextType };
      if (nextType === 'text') {
        next.hintImageUrl = '';
      }
      return next;
    });
  };

  const handleHintImagePick = async (questionId: number, file: File | null) => {
    if (!file) return;
    if (!isSupabaseConfigured) return;

    const url = await uploadHintImage(questionId, file);
    setQuestionEdits((prev) => ({
      ...prev,
      hintType: 'image',
      hintImageUrl: url,
    }));
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-[rgba(32,26,34,0.28)] backdrop-blur-sm flex items-center justify-center z-50 px-4 py-8 overflow-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex max-h-[90vh] w-full max-w-6xl flex-col rounded-3xl border border-border bg-white/70 shadow-[0_22px_70px_rgba(32,26,34,0.16)] backdrop-blur-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-border/70 px-6 py-5">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-white/70 shadow-[0_12px_34px_rgba(32,26,34,0.10)]">
              <Shield className="h-6 w-6 text-violet-600/90" />
            </div>
            <div className="min-w-0">
              <h2 className="mystery-title text-2xl font-bold tracking-tight sm:text-3xl">Admin Panel</h2>
              <p className="mystery-subtitle mt-1 text-sm">Manage quiz settings and data</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl p-2 text-muted-foreground transition-colors hover:bg-white/60 hover:text-foreground"
            aria-label="Close admin"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <Tabs defaultValue="questions" className="w-full">
            <TabsList className="inline-flex h-auto min-h-11 w-full flex-wrap gap-1 rounded-2xl border border-border bg-white/50 p-1.5 shadow-[0_8px_24px_rgba(32,26,34,0.06)] backdrop-blur-sm">
              <TabsTrigger value="questions" className={`rounded-xl px-3 py-2 ${tabTriggerActive}`}>
                <FileText className="mr-2 h-4 w-4" />
                Questions
              </TabsTrigger>
              <TabsTrigger value="solves" className={`rounded-xl px-3 py-2 ${tabTriggerActive}`}>
                <ListOrdered className="mr-2 h-4 w-4" />
                풀이 기록
              </TabsTrigger>
              <TabsTrigger value="teams" className={`rounded-xl px-3 py-2 ${tabTriggerActive}`}>
                <Users className="mr-2 h-4 w-4" />
                팀 / 참가자
              </TabsTrigger>
              <TabsTrigger value="controls" className={`rounded-xl px-3 py-2 ${tabTriggerActive}`}>
                <Settings className="mr-2 h-4 w-4" />
                Game Controls
              </TabsTrigger>
              <TabsTrigger value="test" className={`rounded-xl px-3 py-2 ${tabTriggerActive}`}>
                <FlaskConical className="mr-2 h-4 w-4" />
                테스트/리셋
              </TabsTrigger>
            </TabsList>

            {/* Questions Tab */}
            <TabsContent value="questions" className="mt-6">
              <div className={adminSectionPad}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-white/70 border-b border-border">
                      <tr>
                        <th className="px-4 py-3 text-left text-muted-foreground font-semibold">Q#</th>
                        <th className="px-4 py-3 text-left text-muted-foreground font-semibold">Question Text</th>
                        <th className="px-4 py-3 text-left text-muted-foreground font-semibold">Type</th>
                        <th className="px-4 py-3 text-left text-muted-foreground font-semibold">Answer</th>
                        <th className="px-4 py-3 text-left text-muted-foreground font-semibold">Hint</th>
                        <th className="px-4 py-3 text-left text-muted-foreground font-semibold">Hint Cost</th>
                        <th className="px-4 py-3 text-left text-muted-foreground font-semibold">Reward (1st/2nd/3rd)</th>
                        <th className="px-4 py-3 text-left text-muted-foreground font-semibold">Solves</th>
                        <th className="px-4 py-3 text-left text-muted-foreground font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {questions.map((question) => {
                        const status = questionStatuses.find((s) => s.questionId === question.id);
                        const isEditing = editingQuestion === question.id;
                        const isLocked = (status?.solveCount || 0) >= 3;

                        return (
                          <tr key={question.id} className="hover:bg-muted/45 transition-colors">
                            <td className="px-4 py-3 text-neutral-950 font-medium">Q{question.id}</td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <Input
                                  value={questionEdits.questionText || ''}
                                  onChange={(e) =>
                                    setQuestionEdits({ ...questionEdits, questionText: e.target.value })
                                  }
                                  className="bg-white border-border text-neutral-950 text-xs"
                                />
                              ) : (
                                <span className="text-neutral-800 text-xs line-clamp-2">
                                  {question.questionText}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <select
                                  value={answerTypeDraft}
                                  onChange={(e) => {
                                    const next = e.target.value as Question['answerType'];
                                    setAnswerTypeDraft(next);
                                    setCorrectAnswerDraft((previous) => {
                                      if (next === 'directionLock') {
                                        const parsed = parseDirectionDigits(previous);
                                        return parsed.length ? formatDirectionDigits(parsed) : '1, 2, 3, 4';
                                      }
                                      return previous;
                                    });
                                  }}
                                  className="h-9 rounded-md bg-white border border-border text-neutral-950 text-xs px-2"
                                >
                                  <option value="text">text</option>
                                  <option value="directionLock">directionLock</option>
                                </select>
                              ) : (
                                <span className="text-neutral-800 text-xs font-mono">
                                  {question.answerType}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <Input
                                  value={correctAnswerDraft}
                                  onChange={(e) => setCorrectAnswerDraft(e.target.value)}
                                  placeholder={
                                    answerTypeDraft === 'directionLock'
                                      ? 'e.g. 1, 2, 3, 4 (↑↓→←)'
                                      : 'Type the answer...'
                                  }
                                  className="bg-white border-border text-neutral-950 text-xs"
                                />
                              ) : (
                                <span className="text-emerald-700 font-mono text-xs">
                                  {question.answerType === 'directionLock' && Array.isArray(question.correctAnswer)
                                    ? `${directionDigitsToArrows(question.correctAnswer)}  [${question.correctAnswer.join(', ')}]`
                                    : String(question.correctAnswer ?? '')}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <div className="space-y-2 min-w-[260px]">
                                  <div className="flex items-center gap-2">
                                    <select
                                      value={(questionEdits.hintType ?? 'text') as any}
                                      onChange={(e) => handleHintTypeChange(e.target.value as any)}
                                      className="h-9 rounded-md bg-white border border-border text-neutral-950 text-xs px-2"
                                    >
                                      <option value="text">text</option>
                                      <option value="image">image</option>
                                    </select>
                                    {(questionEdits.hintType ?? 'text') === 'image' && (
                                      <div className="text-[11px] text-neutral-800">
                                        {isSupabaseConfigured ? '업로드 또는 URL' : 'URL만 가능(로컬)'}
                                      </div>
                                    )}
                                  </div>

                                  {(questionEdits.hintType ?? 'text') === 'image' ? (
                                    <div className="space-y-2">
                                      {isSupabaseConfigured && (
                                        <Input
                                          type="file"
                                          accept="image/*"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0] ?? null;
                                            void handleHintImagePick(question.id, file);
                                          }}
                                          className="bg-white border-border text-neutral-950 text-xs"
                                        />
                                      )}
                                      <Input
                                        value={questionEdits.hintImageUrl || ''}
                                        onChange={(e) =>
                                          setQuestionEdits({ ...questionEdits, hintImageUrl: e.target.value })
                                        }
                                        placeholder="Hint image URL (public)"
                                        className="bg-white border-border text-neutral-950 text-xs"
                                      />
                                      <Input
                                        value={questionEdits.hint || ''}
                                        onChange={(e) =>
                                          setQuestionEdits({ ...questionEdits, hint: e.target.value })
                                        }
                                        placeholder="(optional) caption text"
                                        className="bg-white border-border text-neutral-950 text-xs"
                                      />
                                      {questionEdits.hintImageUrl ? (
                                        <img
                                          src={questionEdits.hintImageUrl}
                                          alt="Hint preview"
                                          className="mt-1 max-h-20 w-auto rounded-lg border border-border"
                                        />
                                      ) : null}
                                    </div>
                                  ) : (
                                    <Input
                                      value={questionEdits.hint || ''}
                                      onChange={(e) =>
                                        setQuestionEdits({ ...questionEdits, hint: e.target.value })
                                      }
                                      className="bg-white border-border text-neutral-950 text-xs"
                                    />
                                  )}
                                </div>
                              ) : (
                                <span className="text-amber-800 text-xs line-clamp-1">
                                  {question.hintType === 'image' ? (question.hintImageUrl ? '🖼️ image hint' : '🖼️ image (missing)') : question.hint}
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
                                  className="bg-white border-border text-neutral-950 text-xs w-20"
                                />
                              ) : (
                                <span className="text-orange-700">{question.hintCost}</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    value={questionEdits.coinRewardFirst || 0}
                                    onChange={(e) =>
                                      setQuestionEdits({
                                        ...questionEdits,
                                        coinRewardFirst: parseInt(e.target.value) || 0,
                                      })
                                    }
                                    className="bg-white border-border text-neutral-950 text-xs w-20"
                                  />
                                  <Input
                                    type="number"
                                    value={questionEdits.coinRewardSecond || 0}
                                    onChange={(e) =>
                                      setQuestionEdits({
                                        ...questionEdits,
                                        coinRewardSecond: parseInt(e.target.value) || 0,
                                      })
                                    }
                                    className="bg-white border-border text-neutral-950 text-xs w-20"
                                  />
                                  <Input
                                    type="number"
                                    value={questionEdits.coinRewardThird || 0}
                                    onChange={(e) =>
                                      setQuestionEdits({
                                        ...questionEdits,
                                        coinRewardThird: parseInt(e.target.value) || 0,
                                      })
                                    }
                                    className="bg-white border-border text-neutral-950 text-xs w-20"
                                  />
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    <span className="text-amber-800 font-bold">{question.coinRewardFirst}</span>
                                    <Coins className="w-4 h-4 text-amber-800" />
                                  </div>
                                  <span className="text-neutral-600">/</span>
                                  <span className="text-amber-800 font-semibold">{question.coinRewardSecond}</span>
                                  <span className="text-neutral-600">/</span>
                                  <span className="text-amber-900 font-semibold">{question.coinRewardThird}</span>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-semibold ${
                                    isLocked
                                      ? 'bg-red-100 text-red-800 border border-red-200'
                                      : (status?.solveCount || 0) > 0
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                                  }`}
                                >
                                  {status?.solveCount || 0}/3
                                </span>
                                {isLocked && <Lock className="w-3 h-3 text-red-700" />}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {isEditing ? (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() => void handleQuestionSave(question.id)}
                                      className="bg-green-600 hover:bg-green-700 text-white h-7 px-2 text-xs"
                                    >
                                      <Save className="w-3 h-3 mr-1" />
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setEditingQuestion(null)}
                                      className="border-border text-neutral-800 h-7 px-2 text-xs"
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
                  className="rounded-xl bg-red-600 text-white hover:bg-red-700"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset All Questions
                </Button>
              </div>
            </TabsContent>

            {/* Solves Tab */}
            <TabsContent value="solves" className="mt-6">
              <div className={adminSectionPad}>
                <div className="border-b border-border/80 bg-gradient-to-r from-violet-50/85 via-white/80 to-cyan-50/70 px-4 py-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
                    <div className="flex items-center gap-2 font-semibold text-foreground">
                      <Filter className="h-4 w-4 text-violet-600/80" />
                      필터
                    </div>

                    <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                      <div className="flex flex-1 items-center gap-2">
                        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <Input
                          value={solveQuery}
                          onChange={(e) => setSolveQuery(e.target.value)}
                          placeholder="문제 번호 또는 문제 텍스트 검색"
                          className="rounded-xl border-border bg-white/90 text-foreground placeholder:text-muted-foreground"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="whitespace-nowrap text-xs text-muted-foreground">팀</span>
                        <select
                          value={solveTeamFilter}
                          onChange={(e) => setSolveTeamFilter(e.target.value)}
                          className="h-9 min-w-[160px] rounded-xl border border-border bg-white/90 px-2 text-sm text-foreground"
                        >
                          <option value="all">전체</option>
                          {teams
                            .slice()
                            .sort((a, b) => a.id.localeCompare(b.id))
                            .map((team) => (
                              <option key={team.id} value={team.id}>
                                {team.id} · {team.name}
                              </option>
                            ))}
                        </select>
                      </div>

                      <Button
                        type="button"
                        variant={solveOnlySolved ? 'default' : 'outline'}
                        onClick={() => setSolveOnlySolved((prev) => !prev)}
                        className={
                          solveOnlySolved
                            ? 'rounded-xl bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'rounded-xl border-border bg-white/70 text-foreground hover:bg-white'
                        }
                      >
                        {solveOnlySolved ? '푼 문제만' : '전체 문제'}
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    “1st/2nd/3rd”는 서버 기준 풀이 순서입니다. (동시 제출도 순서가 결정되도록 처리됨)
                  </div>
                  {solveTimeMissing && (
                    <div className="mt-2 rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs text-amber-950">
                      풀이 시간 정보가 아직 내려오지 않습니다. Supabase를 사용 중이면 DB의
                      <span className="font-mono"> get_game_snapshot</span> 함수를 최신 스키마로 업데이트해야 합니다.
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border bg-white/70">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Q#</th>
                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">문제</th>
                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">1st</th>
                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">2nd</th>
                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">3rd</th>
                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">상태</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {solveRows.map(({ question, status, solvedBy }) => {
                        const isLocked = (status?.solveCount ?? 0) >= 3;
                        const place = (idx: number) => {
                          const teamId = solvedBy[idx];
                          if (!teamId) {
                            return <span className="text-neutral-600">-</span>;
                          }
                          const team = teamById.get(teamId);
                          const solvedAt = status?.solvedBy?.[idx]?.solvedAt;
                          const solvedAtLabel = formatSolvedAt(solvedAt);
                          return (
                            <div className="inline-flex items-center gap-2 rounded-xl border border-border/90 bg-white/70 px-2 py-1 shadow-[0_4px_12px_rgba(32,26,34,0.05)]">
                              <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-violet-200/70 bg-gradient-to-br from-violet-100/90 to-pink-50/80 text-xs font-bold text-violet-950">
                                {teamId}
                              </span>
                              <div className="leading-tight">
                                <div className="text-neutral-950 text-xs font-semibold">{team?.name ?? 'Unknown team'}</div>
                                <div className="text-[10px] text-neutral-700">
                                  team {teamId}
                                  {solvedAtLabel ? <span className="text-neutral-600"> · {solvedAtLabel}</span> : null}
                                </div>
                              </div>
                            </div>
                          );
                        };

                        return (
                          <tr key={question.id} className="hover:bg-muted/45 transition-colors">
                            <td className="px-4 py-3 text-neutral-950 font-medium">Q{question.id}</td>
                            <td className="px-4 py-3">
                              <div className="text-neutral-800 text-xs line-clamp-2 max-w-[520px]">
                                {question.questionText}
                              </div>
                            </td>
                            <td className="px-4 py-3">{place(0)}</td>
                            <td className="px-4 py-3">{place(1)}</td>
                            <td className="px-4 py-3">{place(2)}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-semibold ${
                                    isLocked
                                      ? 'bg-red-100 text-red-800 border border-red-200'
                                      : solvedBy.length > 0
                                        ? 'border border-emerald-200 bg-emerald-100 text-emerald-800'
                                        : 'bg-neutral-100 text-neutral-800 border border-neutral-200'
                                  }`}
                                >
                                  {solvedBy.length}/3
                                </span>
                                {isLocked && <Lock className="w-3 h-3 text-red-700" />}
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {solveRows.length === 0 && (
                        <tr>
                          <td className="px-4 py-8 text-center text-neutral-700" colSpan={6}>
                            조건에 맞는 기록이 없습니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* Teams Tab */}
            <TabsContent value="teams" className="mt-6">
              <div className="mb-4 rounded-2xl border border-violet-200/70 bg-gradient-to-br from-violet-50/90 via-white/95 to-pink-50/70 px-4 py-4 text-sm leading-relaxed text-foreground shadow-[0_8px_28px_rgba(139,92,246,0.08)]">
                <p className="mb-1 font-semibold text-foreground">팀 · 참가자 (인트로 카드)</p>
                <p className="text-muted-foreground">
                  <strong className="font-semibold text-foreground">참가자</strong>는 한 팀에 여러 명 둘 수 있으며, 인트로 첫 화면 카드는{' '}
                  <strong className="font-semibold text-foreground">참가자 수만큼</strong> 늘어납니다. 각 줄마다 이름·성별(F/M/자동)을
                  지정하고 <strong className="font-semibold text-foreground">참가자 추가</strong>로 줄을 늘리세요.{' '}
                  아래 표에서 <strong className="font-semibold text-foreground">Edit → Save</strong>로 반영합니다.{' '}
                  <strong className="font-semibold text-foreground">팀 코드</strong>는 로그인에 쓰이는 값이고,{' '}
                  <strong className="font-semibold text-foreground">팀명</strong>은 스코어보드 등에 표시됩니다. 성별{' '}
                  <strong className="font-semibold text-foreground">자동</strong>은 인트로 카드 전체 순서에서 앞쪽 절반 F, 뒤 M으로
                  맞춥니다.
                </p>
              </div>
              <div className={adminSectionPad}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-border bg-white/70">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">팀 코드</th>
                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">팀명</th>
                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">참가자 (인트로 카드)</th>
                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Coins</th>
                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Password</th>
                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {teams.map((team) => {
                        const isEditing = editingTeam === team.id;

                        return (
                          <tr key={team.id} className="hover:bg-muted/45 transition-colors">
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <Input
                                  value={teamEdits.newTeamCode ?? ''}
                                  onChange={(e) =>
                                    setTeamEdits({ ...teamEdits, newTeamCode: e.target.value })
                                  }
                                  className="bg-white border-border text-neutral-950 w-20 font-mono uppercase"
                                  maxLength={16}
                                  placeholder="A"
                                  aria-label="팀 코드"
                                />
                              ) : (
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-200/70 bg-gradient-to-br from-violet-100/90 to-pink-50/80 text-sm font-bold text-violet-950">
                                  {team.id}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <Input
                                  value={teamEdits.name || ''}
                                  onChange={(e) => setTeamEdits({ ...teamEdits, name: e.target.value })}
                                  className="bg-white border-border text-neutral-950"
                                />
                              ) : (
                                <span className="text-neutral-950 font-semibold">{team.name}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 align-top max-w-md">
                              {isEditing ? (
                                <div className="space-y-2">
                                  {(teamEdits.participants ?? [{ name: '', gender: null }]).map((p, i) => (
                                    <div key={i} className="flex flex-wrap items-end gap-2">
                                      <Input
                                        value={p.name}
                                        onChange={(e) => {
                                          const next = [...(teamEdits.participants ?? [])];
                                          next[i] = { ...next[i], name: e.target.value };
                                          setTeamEdits({ ...teamEdits, participants: next });
                                        }}
                                        placeholder="이름"
                                        className="bg-white border-border text-neutral-950 flex-1 min-w-[120px]"
                                      />
                                      <select
                                        value={p.gender === 'F' || p.gender === 'M' ? p.gender : ''}
                                        onChange={(e) => {
                                          const v = e.target.value;
                                          const next = [...(teamEdits.participants ?? [])];
                                          next[i] = {
                                            ...next[i],
                                            gender: v === '' ? null : (v as 'F' | 'M'),
                                          };
                                          setTeamEdits({ ...teamEdits, participants: next });
                                        }}
                                        className="h-9 rounded-md bg-white border border-border text-neutral-950 text-sm px-2 min-w-[110px]"
                                      >
                                        <option value="">자동</option>
                                        <option value="F">F</option>
                                        <option value="M">M</option>
                                      </select>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="border-border text-neutral-800 shrink-0"
                                        onClick={() => {
                                          const next = [...(teamEdits.participants ?? [])];
                                          next.splice(i, 1);
                                          if (next.length === 0) next.push({ name: '', gender: null });
                                          setTeamEdits({ ...teamEdits, participants: next });
                                        }}
                                        aria-label="참가자 줄 삭제"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  ))}
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    className="bg-white text-neutral-950 border border-border hover:bg-neutral-100"
                                    onClick={() =>
                                      setTeamEdits({
                                        ...teamEdits,
                                        participants: [
                                          ...(teamEdits.participants ?? []),
                                          { name: '', gender: null },
                                        ],
                                      })
                                    }
                                  >
                                    <Plus className="w-4 h-4 mr-1" />
                                    참가자 추가
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-neutral-900 text-sm leading-snug">
                                  {(() => {
                                    const list = participantsListForTeam(team);
                                    if (list.length === 0) return '—';
                                    return list
                                      .map((p) =>
                                        p.gender === 'F' || p.gender === 'M'
                                          ? `${p.name} (${p.gender})`
                                          : p.name,
                                      )
                                      .join(', ');
                                  })()}
                                </span>
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
                                  className="bg-white border-border text-neutral-950 w-24"
                                />
                              ) : (
                                <span className="text-amber-800 font-bold text-lg">{team.coins}</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <Input
                                  value={teamEdits.password || ''}
                                  onChange={(e) =>
                                    setTeamEdits({ ...teamEdits, password: e.target.value })
                                  }
                                  className="bg-white border-border text-neutral-950"
                                />
                              ) : (
                                <span className="text-neutral-700 font-mono">{'•'.repeat(team.password.length)}</span>
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
                                      className="border-border text-neutral-800"
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
                  className="rounded-xl bg-red-600 text-white hover:bg-red-700"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset All Teams
                </Button>
              </div>
            </TabsContent>

            {/* Game Controls Tab */}
            <TabsContent value="controls" className="mt-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Timer Controls */}
                <div className={`${adminShellCard} p-6`}>
                  <h3 className="mb-4 flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
                    <Settings className="h-5 w-5 text-violet-600/85" />
                    Timer Controls
                  </h3>
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-violet-200/60 bg-gradient-to-br from-violet-50/80 via-white to-pink-50/50 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                      <div className="mb-1 text-sm text-muted-foreground">Current Time</div>
                      <div className="font-mono text-3xl font-bold tracking-tight text-foreground">
                        {formatTime(timeRemaining)}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        Status:{' '}
                        {timerRunning ? (
                          <span className="font-semibold text-emerald-700">Running</span>
                        ) : (
                          <span className="font-medium text-orange-700">Paused</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={onToggleTimer}
                        className={`flex-1 rounded-xl ${
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
                        className="flex-1 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset to 2h
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Game Statistics */}
                <div className={`${adminShellCard} p-6`}>
                  <h3 className="mb-4 flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
                    <FileText className="h-5 w-5 text-cyan-600/80" />
                    Game Statistics
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-xl border border-border/80 bg-white/55 px-3 py-3 backdrop-blur-sm">
                      <span className="text-muted-foreground">Total Questions</span>
                      <span className="font-bold text-foreground">{questions.length}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-emerald-200/60 bg-emerald-50/50 px-3 py-3">
                      <span className="text-muted-foreground">Questions Solved</span>
                      <span className="font-bold text-emerald-800">
                        {questionStatuses.filter((s) => s.solveCount > 0).length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-rose-200/60 bg-rose-50/50 px-3 py-3">
                      <span className="text-muted-foreground">Locked Questions</span>
                      <span className="font-bold text-rose-800">
                        {questionStatuses.filter((s) => s.solveCount >= 3).length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl border border-border/80 bg-white/55 px-3 py-3 backdrop-blur-sm">
                      <span className="text-muted-foreground">Total Teams</span>
                      <span className="font-bold text-foreground">{teams.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reset buttons (high visibility) */}
              <div className={`mt-6 ${adminShellCard} p-6`}>
                <h3 className="mb-4 flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
                  <RotateCcw className="h-5 w-5 text-orange-600/85" />
                  Reset
                </h3>
                <div className="flex flex-col gap-3 md:flex-row">
                  <Button
                    onClick={onResetAllQuestions}
                    className="flex-1 rounded-xl bg-orange-600 text-white hover:bg-orange-700"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset All Solves
                  </Button>
                  <Button
                    onClick={onResetAllTeams}
                    className="flex-1 rounded-xl bg-red-600 text-white hover:bg-red-700"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset All Team Scores
                  </Button>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Team scores reset to 0. Solve history is cleared for every question.
                </p>
              </div>
            </TabsContent>

            {/* Test/Reset Tab */}
            <TabsContent value="test" className="mt-6">
              <div className={`${adminShellCard} p-6`}>
                <h3 className="mb-2 flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
                  <FlaskConical className="h-5 w-5 text-violet-600/85" />
                  테스트/리셋 도구
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  아래 버튼들은 “테스트를 빨리 돌리기” 위한 기능입니다. 버튼을 누르면 DB(서버) 상태가 즉시 변경되어 모든 참가자 화면에 실시간 반영됩니다.
                </p>

                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-rose-200/70 bg-gradient-to-b from-rose-50/95 to-white/90 p-4 shadow-[0_8px_24px_rgba(244,63,94,0.08)]">
                    <div className="font-semibold text-foreground">전체 게임 초기화</div>
                    <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      제출 기록/정답 기록/문제 상태를 모두 삭제하고, 팀 코인을 0으로 초기화합니다.
                      타이머는 2시간(정지)로 리셋됩니다.
                    </div>
                    <Button
                      onClick={() => {
                        const ok = window.confirm('정말 전체 게임을 초기화할까요? (되돌릴 수 없습니다)');
                        if (!ok) return;
                        onAdminResetGame();
                      }}
                      className="mt-3 w-full rounded-xl bg-red-600 text-white hover:bg-red-700"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      전체 초기화 실행
                    </Button>
                  </div>

                  <div className="rounded-2xl border border-indigo-200/70 bg-gradient-to-b from-indigo-50/90 to-white/90 p-4 shadow-[0_8px_24px_rgba(99,102,241,0.10)]">
                    <div className="font-semibold text-foreground">테스트 모드 (전부 ‘1’)</div>
                    <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      모든 팀 비밀번호를 <span className="font-mono font-medium text-foreground">1</span>로 설정하고,
                      모든 문제의 질문/정답을 <span className="font-mono font-medium text-foreground">1</span>로 통일합니다.
                      (이미 데이터가 1이라면 변화 없습니다)
                    </div>
                    <Button
                      onClick={onAdminSetTestMode}
                      className="mt-3 w-full rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      테스트 모드 적용
                    </Button>
                  </div>

                  <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-b from-emerald-50/90 to-white/90 p-4 shadow-[0_8px_24px_rgba(16,185,129,0.10)]">
                    <div className="font-semibold text-foreground">전체 문제 “3팀 정답” 처리</div>
                    <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      모든 문제를 “3팀이 이미 맞춘 상태(잠금)”로 만들어 메인 화면에서 잠김 UI(X 표시)를 한 번에 확인할 수 있습니다.
                      정답팀은 팀코드 기준 상위 3팀으로 기록됩니다.
                    </div>
                    <Button
                      onClick={() => {
                        const ok = window.confirm('모든 문제를 잠금(3/3) 상태로 만들까요?');
                        if (!ok) return;
                        onAdminMarkAllSolved();
                      }}
                      className="mt-3 w-full rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      전체 정답 처리
                    </Button>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-violet-200/65 bg-gradient-to-br from-violet-50/70 via-white to-cyan-50/50 p-4 shadow-[0_8px_28px_rgba(139,92,246,0.10)]">
                  <div className="mb-1 flex items-center gap-2 font-semibold text-foreground">
                    <ListOrdered className="h-4 w-4 shrink-0 text-violet-600/85" />
                    전체 문제 단계 미리보기
                  </div>
                  <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
                    <span className="font-medium text-foreground">모든 문제</span>가 같은 단계로 맞춰집니다. 팀코드 순 앞쪽{' '}
                    <span className="text-foreground">1팀 / 2팀 / 3팀</span>이 각각 정답 처리된 것으로 기록됩니다.
                    (1차·2차는 잠금 아님, 3차는 전체 잠금.) 다른 풀이 기록은 모두 지워집니다.
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Button
                      onClick={() => {
                        const ok = window.confirm(
                          '모든 문제를 “1차(팀 1팀만 정답)” 상태로 맞출까요? 기존 풀이는 초기화됩니다.',
                        );
                        if (!ok) return;
                        onAdminSetAllQuestionsSolveTier(1);
                      }}
                      className="w-full rounded-xl bg-sky-600/95 text-white hover:bg-sky-500"
                    >
                      전체 1차
                    </Button>
                    <Button
                      onClick={() => {
                        const ok = window.confirm(
                          '모든 문제를 “2차(팀 2팀까지 정답)” 상태로 맞출까요? 기존 풀이는 초기화됩니다.',
                        );
                        if (!ok) return;
                        onAdminSetAllQuestionsSolveTier(2);
                      }}
                      className="w-full rounded-xl bg-pink-600/95 text-white hover:bg-pink-500"
                    >
                      전체 2차
                    </Button>
                    <Button
                      onClick={() => {
                        const ok = window.confirm(
                          '모든 문제를 “3차(3팀 정답·잠금)”으로 맞출까요? 기존 풀이는 초기화됩니다.',
                        );
                        if (!ok) return;
                        onAdminSetAllQuestionsSolveTier(3);
                      }}
                      className="w-full rounded-xl bg-emerald-600/95 text-white hover:bg-emerald-500"
                    >
                      전체 3차(잠금)
                    </Button>
                  </div>
                </div>

                <div className="mt-5 text-xs leading-relaxed text-muted-foreground">
                  팁: “전체 게임 초기화”는 테스트를 처음부터 다시 시작할 때 사용하세요. “테스트 모드”는 빠른 입력 확인용,
                  위 “전체 정답 처리” 카드와 “전체 3차(잠금)”는 같은 결과입니다.
                  <span className="mt-1 block">
                    “전체 1·2차”는 그리드 파스텀 카드가 한꺼번에 1차/2차 톤으로 바뀌는지 확인할 때 쓰세요.
                  </span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    </div>
  );
}
