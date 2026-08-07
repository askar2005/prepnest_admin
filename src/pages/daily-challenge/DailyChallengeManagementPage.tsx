import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { TextArea } from '../../components/ui/TextArea';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useToast } from '../../components/common/ToastHost';
import {
  Plus, Edit3, Trash2, Copy, Archive, Eye, Search, X, Send, CheckCircle2, Flame, FileQuestion,
} from 'lucide-react';

type Challenge = {
  id: string; question: string; description: string | null; topic: string | null; difficulty: string | null;
  tags: string[]; optionA: string; optionB: string; optionC: string; optionD: string;
  correctAnswer: string; explanation: string | null; status: string; publishedDate: string | null; createdAt: string;
};

type Counts = { queue: number; published: number; archived: number };
type Today = { published: boolean; id: string | null; question: string | null };

const statusBadge: Record<string, string> = {
  QUEUE: 'bg-slate-100 text-slate-600',
  PUBLISHED: 'bg-emerald-100 text-emerald-700',
  ARCHIVED: 'bg-amber-100 text-amber-700',
};
const difficultyBadge: Record<string, string> = {
  EASY: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HARD: 'bg-red-100 text-red-600',
};

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function DailyChallengeManagementPage() {
  const { pushToast } = useToast();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [, setTotal] = useState(0);
  const [counts, setCounts] = useState<Counts>({ queue: 0, published: 0, archived: 0 });
  const [today, setToday] = useState<Today>({ published: false, id: null, question: null });
  const [loading, setLoading] = useState(true);

  // filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // form
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('EASY');
  const [tagsInput, setTagsInput] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('A');
  const [explanation, setExplanation] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const [confirm, setConfirm] = useState<{ id: string; action: 'delete' | 'archive' } | null>(null);
  const [preview, setPreview] = useState<Challenge | null>(null);
  const [publishing, setPublishing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      params.set('limit', '100');
      const { data, status } = await apiClient.get(`/daily-challenges?${params.toString()}`);
      if (status === 200) {
        setChallenges(data?.items || []);
        setTotal(data?.total || 0);
      } else {
        pushToast('Failed to load challenges', 'error');
      }
    } catch (err: any) {
      if (err?.response?.status === 401) return;
      pushToast(err?.response?.status >= 500 ? 'Server error. Please try again.' : 'Failed to load challenges', 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, pushToast]);

  const fetchCounts = useCallback(async () => {
    try {
      const { data, status } = await apiClient.get('/daily-challenges/counts');
      if (status === 200) {
        setCounts(data?.counts || { queue: 0, published: 0, archived: 0 });
        setToday(data?.today || { published: false, id: null, question: null });
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchCounts(); }, [fetchCounts]);
  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const resetForm = () => {
    setQuestion(''); setDescription(''); setTopic(''); setDifficulty('EASY'); setTagsInput('');
    setOptionA(''); setOptionB(''); setOptionC(''); setOptionD('');
    setCorrectAnswer('A'); setExplanation(''); setEditId(null); setShowForm(false); setFieldErrors({});
  };

  const openEdit = (c: Challenge) => {
    setQuestion(c.question); setDescription(c.description || ''); setTopic(c.topic || '');
    setDifficulty(c.difficulty || 'EASY'); setTagsInput((c.tags || []).join(', '));
    setOptionA(c.optionA); setOptionB(c.optionB); setOptionC(c.optionC); setOptionD(c.optionD);
    setCorrectAnswer(c.correctAnswer); setExplanation(c.explanation || ''); setEditId(c.id); setShowForm(true); setFieldErrors({});
  };

  const eraseFieldErr = (field: string) => setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });

  const submit = async () => {
    const payload = {
      question: question.trim(),
      description: description.trim() || null,
      topic: topic.trim() || null,
      difficulty,
      tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      optionA: optionA.trim(),
      optionB: optionB.trim(),
      optionC: optionC.trim(),
      optionD: optionD.trim(),
      correctAnswer,
      explanation: explanation.trim() || null,
    };

    const missing: Record<string, string> = {};
    if (!payload.question) missing.question = 'Question is required';
    for (const o of ['A', 'B', 'C', 'D'] as const) {
      if (!payload[`option${o}`]) missing[`option${o}`] = `Option ${o} is required`;
    }
    if (Object.keys(missing).length > 0) { setFieldErrors(missing); return; }
    setFieldErrors({});
    setBusy(true);
    try {
      if (editId) { await apiClient.put(`/daily-challenges/${editId}`, payload); pushToast('Question updated', 'success'); }
      else { await apiClient.post('/daily-challenges', payload); pushToast('Question created', 'success'); }
      resetForm(); fetchData(); fetchCounts();
    } catch (err: any) {
      const details = err?.response?.data?.details;
      let msg = err?.response?.data?.message || err?.message || 'Failed';
      if (details && typeof details === 'object') {
        const fieldErrs: Record<string, string> = {};
        for (const [key, value] of Object.entries(details as Record<string, unknown>)) {
          if (Array.isArray(value)) fieldErrs[key] = value[0];
          else if (typeof value === 'string') fieldErrs[key] = value;
        }
        if (Object.keys(fieldErrs).length > 0) { setFieldErrors(fieldErrs); msg = Object.values(fieldErrs)[0]; }
      }
      pushToast(msg, 'error');
    } finally { setBusy(false); }
  };

  const runAction = async (id: string, action: string, successMsg: string) => {
    try {
      await apiClient.post(`/daily-challenges/${id}/${action}`);
      pushToast(successMsg, 'success');
      fetchData(); fetchCounts();
    } catch (err: any) {
      pushToast(err?.response?.data?.message || `${action} failed`, 'error');
    }
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    if (confirm.action === 'delete') {
      try { await apiClient.delete(`/daily-challenges/${confirm.id}`); pushToast('Deleted', 'success'); fetchData(); fetchCounts(); }
      catch (err: any) { pushToast(err?.response?.data?.message || 'Delete failed', 'error'); }
    } else {
      await runAction(confirm.id, 'archive', 'Archived');
    }
    setConfirm(null);
  };

  const publishNow = async () => {
    setPublishing(true);
    try {
      const { data } = await apiClient.post('/daily-challenges/advance');
      pushToast(data?.published ? 'Today\'s challenge published' : 'No queued questions left', data?.published ? 'success' : 'error');
      fetchData(); fetchCounts();
    } catch (err: any) {
      pushToast(err?.response?.data?.message || 'Publish failed', 'error');
    } finally { setPublishing(false); }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Daily Challenges</h1>
          <p className="text-sm text-slate-500 mt-1">One question is auto-published every day at midnight from the queue.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={publishNow} disabled={publishing}>
            <Send className="w-4 h-4 mr-1" /> {publishing ? 'Publishing...' : 'Publish Now'}
          </Button>
          <Button onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-1" /> Create Question</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={<FileQuestion className="w-5 h-5 text-brand-600" />} label="In Queue" value={counts.queue} sub={today.published ? 'Next: after today' : 'Feed for next publish'} />
        <StatCard icon={<Flame className="w-5 h-5 text-emerald-600" />} label="Published" value={counts.published} sub={today.published ? 'Today\'s live' : 'No live today'} />
        <StatCard icon={<CheckCircle2 className="w-5 h-5 text-slate-500" />} label="Archived" value={counts.archived} sub="Past challenges" />
        <StatCard icon={<Archive className="w-5 h-5 text-amber-600" />} label="Today" value={today.published ? 'LIVE' : '—'} sub={today.published ? 'Auto-published' : 'Queue not exhausted'} />
      </div>

      {showForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-soft space-y-4">
          <p className="text-sm font-semibold text-slate-700">{editId ? 'Edit Question' : 'New Question'}</p>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="space-y-1 sm:col-span-2">
              <span className="text-xs text-slate-500">Question *</span>
              <TextArea value={question} onChange={(e) => { setQuestion(e.target.value); eraseFieldErr('question'); }} placeholder="Enter the question" className="min-h-[60px]" />
              {fieldErrors.question && <p className="text-xs text-red-500">{fieldErrors.question}</p>}
            </label>

            <label className="space-y-1 sm:col-span-2">
              <span className="text-xs text-slate-500">Description</span>
              <TextArea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description (optional)" className="min-h-[50px]" />
            </label>

            <label className="space-y-1">
              <span className="text-xs text-slate-500">Topic</span>
              <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Aptitude" />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-slate-500">Difficulty</span>
              <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </Select>
            </label>
            <label className="space-y-1 sm:col-span-2">
              <span className="text-xs text-slate-500">Tags (comma separated)</span>
              <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="aptitude, quick-maths" />
            </label>

            <div className="grid sm:grid-cols-2 gap-3 sm:col-span-2">
              {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                <label key={opt} className="space-y-1">
                  <span className="text-xs text-slate-500">Option {opt} *</span>
                  <Input value={opt === 'A' ? optionA : opt === 'B' ? optionB : opt === 'C' ? optionC : optionD}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (opt === 'A') setOptionA(val); else if (opt === 'B') setOptionB(val); else if (opt === 'C') setOptionC(val); else setOptionD(val);
                      eraseFieldErr(`option${opt}`);
                    }}
                    placeholder={`Option ${opt}`} />
                  {fieldErrors[`option${opt}`] && <p className="text-xs text-red-500">{fieldErrors[`option${opt}`]}</p>}
                </label>
              ))}
            </div>

            <label className="space-y-1">
              <span className="text-xs text-slate-500">Correct Answer *</span>
              <Select value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)}>
                <option value="A">Option A</option>
                <option value="B">Option B</option>
                <option value="C">Option C</option>
                <option value="D">Option D</option>
              </Select>
            </label>
            <label className="space-y-1">
              <span className="text-xs text-slate-500">Explanation</span>
              <TextArea value={explanation} onChange={(e) => setExplanation(e.target.value)} placeholder="Explain the correct answer" className="min-h-[50px]" />
            </label>
          </div>

          <div className="flex gap-2">
            <Button onClick={submit} disabled={busy}>{busy ? 'Saving...' : editId ? 'Update' : 'Create Question'}</Button>
            <Button variant="secondary" onClick={resetForm}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search questions, topics..." className="pl-9" />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-44">
          <option value="ALL">All statuses</option>
          <option value="QUEUE">Queue</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </Select>
      </div>

      {loading ? <div className="text-center py-12 text-slate-400 animate-pulse">Loading...</div> : challenges.length === 0 ? (
        <div className="text-center py-16 text-slate-400">No questions found. Create your first one.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 text-left text-slate-600">
              <th className="whitespace-nowrap px-4 py-3 font-medium">Question</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Status</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium hidden md:table-cell">Difficulty</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium hidden sm:table-cell">Published</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium text-center">Actions</th>
            </tr></thead>
            <tbody>
              {challenges.map((c) => (
                <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900 max-w-[280px]">
                    <div className="truncate">{c.question}</div>
                    {c.topic && <div className="text-xs text-slate-400 truncate">{c.topic}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded font-medium ${statusBadge[c.status] || 'bg-slate-100 text-slate-600'}`}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {c.difficulty && <span className={`inline-block text-xs px-2 py-0.5 rounded font-medium ${difficultyBadge[c.difficulty] || 'bg-slate-100 text-slate-600'}`}>{c.difficulty}</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{fmtDate(c.publishedDate)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-center">
                      <IconBtn title="Preview" onClick={() => setPreview(c)}><Eye className="w-4 h-4" /></IconBtn>
                      <IconBtn title="Edit" onClick={() => openEdit(c)}><Edit3 className="w-4 h-4" /></IconBtn>
                      <IconBtn title="Duplicate" onClick={async () => { await runAction(c.id, 'duplicate', 'Duplicated to queue'); }}><Copy className="w-4 h-4" /></IconBtn>
                      {c.status !== 'ARCHIVED' && (
                        <IconBtn title="Archive" onClick={() => setConfirm({ id: c.id, action: 'archive' })}><Archive className="w-4 h-4" /></IconBtn>
                      )}
                      <IconBtn title="Delete" danger onClick={() => setConfirm({ id: c.id, action: 'delete' })}><Trash2 className="w-4 h-4" /></IconBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog open={!!confirm} title={confirm?.action === 'delete' ? 'Delete Question' : 'Archive Question'}
        message={confirm?.action === 'delete' ? 'Are you sure you want to delete this question?' : 'Move this question to archive?'}
        confirmLabel={confirm?.action === 'delete' ? 'Delete' : 'Archive'} variant="danger"
        onConfirm={handleConfirm} onCancel={() => setConfirm(null)} />

      {preview && <PreviewModal challenge={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number | string; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function IconBtn({ title, onClick, danger, children }: { title: string; onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={title}
      className={`p-1.5 rounded-lg hover:bg-slate-100 ${danger ? 'text-red-500' : 'text-slate-500'}`}>
      {children}
    </button>
  );
}

function PreviewModal({ challenge, onClose }: { challenge: Challenge; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-orange-50">
          <p className="text-sm font-semibold text-slate-800">Question Preview</p>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-200 text-slate-500"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          {(challenge.topic || challenge.difficulty) && (
            <div className="flex flex-wrap gap-2">
              {challenge.topic && <span className="text-xs px-2 py-0.5 rounded bg-brand-50 text-brand-600 font-medium">{challenge.topic}</span>}
              {challenge.difficulty && <span className={`text-xs px-2 py-0.5 rounded font-medium ${difficultyBadge[challenge.difficulty] || 'bg-slate-100 text-slate-600'}`}>{challenge.difficulty}</span>}
              {(challenge.tags || []).map((t) => (
                <span key={t} className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-500">{t}</span>
              ))}
            </div>
          )}
          <p className="text-base font-medium text-slate-900">{challenge.question}</p>
          {challenge.description && <p className="text-sm text-slate-500">{challenge.description}</p>}
          <div className="space-y-2">
            {(['A', 'B', 'C', 'D'] as const).map((opt) => {
              const val = challenge[`option${opt}`];
              const isCorrect = challenge.correctAnswer === opt;
              return (
                <div key={opt} className={`px-4 py-2.5 rounded-xl border text-sm ${isCorrect ? 'border-green-300 bg-green-50' : 'border-slate-200 bg-white'}`}>
                  <span className={`font-semibold mr-2 ${isCorrect ? 'text-green-700' : 'text-slate-600'}`}>{opt}.</span>
                  <span className="text-slate-800">{val}</span>
                  {isCorrect && <CheckCircle2 className="w-4 h-4 text-green-600 inline ml-2" />}
                </div>
              );
            })}
          </div>
          {challenge.explanation && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
              <p className="text-xs font-semibold text-slate-500 mb-1">EXPLANATION</p>
              <p className="text-sm text-slate-700">{challenge.explanation}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}