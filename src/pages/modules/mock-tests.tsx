import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { TextArea } from '../../components/ui/TextArea';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useToast } from '../../components/common/ToastHost';
import {
  Plus, Edit3, Trash2, Copy, Archive, RotateCcw, Eye, Search, X, Send, FileQuestion, Timer, CheckCircle2,
  Clock, BarChart3, GripVertical, ChevronUp, ChevronDown, BookOpen,
} from 'lucide-react';

export type QuestionDraft = {
  localId: string;
  questionType: string;
  question: string;
  optionA: string; optionB: string; optionC: string; optionD: string;
  correctOption: string;
  correctOptions: string[];
  correctBoolean: boolean | null;
  answerText: string;
  alternatives: string;
  keywords: string;
  caseSensitive: boolean;
  explanation: string;
  marks: number;
  negativeMarks: number;
};

export type MockTestItem = {
  id: string; title: string; description: string; durationMinutes: number; difficulty: string | null;
  negativeMarking: number; preparationCategoryId: string; publishStatus: string; passingMarks: number;
  totalMarks: number | null; scheduledAt: string | null; topicId: string | null; featured: boolean;
  shuffleOptions: boolean; shuffleQuestions: boolean; createdAt: string;
  preparationCategory?: { id: string; name: string; slug: string };
  topic?: { id: string; name: string } | null;
  _count?: { questions: number; results: number };
  questions?: QuestionDraft[];
};

export type Counts = { total: number; drafts: number; published: number; archived: number };

const QUESTION_TYPES = ['MCQ', 'MULTIPLE_SELECT', 'TRUE_FALSE', 'SHORT_ANSWER', 'NUMERICAL', 'FILL_BLANK', 'PARAGRAPH', 'CODING'];
const TYPE_LABEL: Record<string, string> = {
  MCQ: 'Single Choice (MCQ)', MULTIPLE_SELECT: 'Multiple Select', TRUE_FALSE: 'True / False', SHORT_ANSWER: 'Short Answer',
  NUMERICAL: 'Numerical', FILL_BLANK: 'Fill in the Blank', PARAGRAPH: 'Paragraph (manual)', CODING: 'Coding',
};

const statusBadge: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  PUBLISHED: 'bg-emerald-100 text-emerald-700',
  ARCHIVED: 'bg-amber-100 text-amber-700',
};
const difficultyBadge: Record<string, string> = {
  EASY: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HARD: 'bg-red-100 text-red-600',
};

function fmtDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

let localSeq = 0;
const newLocalId = () => `q_${Date.now()}_${localSeq++}`;

export function emptyQuestion(): QuestionDraft {
  return {
    localId: newLocalId(), questionType: 'MCQ', question: '',
    optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'A', correctOptions: [],
    correctBoolean: null, answerText: '', alternatives: '', keywords: '', caseSensitive: false,
    explanation: '', marks: 1, negativeMarks: 0,
  };
}

export function questionFromServer(q: any): QuestionDraft {
  return {
    localId: newLocalId(),
    questionType: q.questionType || 'MCQ',
    question: q.question || '',
    optionA: q.optionA || '', optionB: q.optionB || '', optionC: q.optionC || '', optionD: q.optionD || '',
    correctOption: q.correctOption || 'A',
    correctOptions: q.correctOptions || [],
    correctBoolean: q.correctBoolean ?? q.trueFalse?.correctAnswer ?? null,
    answerText: q.answerText ?? q.shortAnswer?.answer ?? q.fillBlank?.correctAnswer ?? '',
    alternatives: q.alternatives ?? q.fillBlank?.alternatives ?? '',
    keywords: q.keywords ?? q.shortAnswer?.keywords ?? '',
    caseSensitive: !!q.caseSensitive,
    explanation: q.explanation || '',
    marks: q.marks ?? 1,
    negativeMarks: q.negativeMarks ?? 0,
  };
}

export function questionPayload(q: QuestionDraft) {
  const base: Record<string, unknown> = {
    question: q.question.trim(),
    questionType: q.questionType,
    marks: Math.max(1, Number(q.marks) || 1),
    negativeMarks: Math.max(0, Number(q.negativeMarks) || 0),
    explanation: q.explanation.trim() || null,
  };
  if (q.questionType === 'MCQ' || q.questionType === 'MULTIPLE_SELECT') {
    base.optionA = q.optionA.trim() || null;
    base.optionB = q.optionB.trim() || null;
    base.optionC = q.optionC.trim() || null;
    base.optionD = q.optionD.trim() || null;
    if (q.questionType === 'MCQ') base.correctOption = q.correctOption;
    else base.correctOptions = q.correctOptions;
  }
  if (q.questionType === 'TRUE_FALSE') base.correctBoolean = q.correctBoolean;
  if (q.questionType === 'SHORT_ANSWER') {
    base.answerText = q.answerText.trim() || null;
    base.alternatives = q.alternatives.trim() || null;
    base.keywords = q.keywords.trim() || null;
    base.caseSensitive = q.caseSensitive;
  }
  if (q.questionType === 'NUMERICAL') base.answerText = q.answerText.trim() || null;
  if (q.questionType === 'FILL_BLANK') {
    base.answerText = q.answerText.trim() || null;
    base.alternatives = q.alternatives.trim() || null;
  }
  if (q.questionType === 'CODING') base.answerText = q.answerText.trim() || null;
  return base;
}

export function validateQuestions(questions: QuestionDraft[]): string[] {
  const errors: string[] = [];
  if (questions.length === 0) return ['Add at least one question'];
  questions.forEach((q, i) => {
    const label = `Q${i + 1}`;
    if (!q.question.trim()) errors.push(`${label}: question text is required`);
    if (!q.marks || q.marks <= 0) errors.push(`${label}: marks must be greater than 0`);
    if (q.questionType === 'MCQ' || q.questionType === 'MULTIPLE_SELECT') {
      const opts = ['A', 'B', 'C', 'D'].map((k) => ({ k, v: (q as any)[`option${k}`].trim() })).filter((o) => o.v);
      if (opts.length < 2) errors.push(`${label}: provide at least two options`);
      const texts = opts.map((o) => o.v.toLowerCase());
      if (new Set(texts).size !== texts.length) errors.push(`${label}: duplicate option texts`);
      if (q.questionType === 'MCQ' && !opts.some((o) => o.k === q.correctOption)) errors.push(`${label}: correct answer must be one of the provided options`);
      if (q.questionType === 'MULTIPLE_SELECT' && (q.correctOptions.length === 0 || q.correctOptions.some((c) => !opts.some((o) => o.k === c)))) errors.push(`${label}: select at least one correct option from the list`);
    }
    if (q.questionType === 'TRUE_FALSE' && q.correctBoolean === null) errors.push(`${label}: select True or False as the answer`);
    if ((q.questionType === 'SHORT_ANSWER' || q.questionType === 'FILL_BLANK') && !q.answerText.trim() && !q.alternatives.trim() && !q.keywords.trim()) errors.push(`${label}: provide the correct answer`);
    if (q.questionType === 'NUMERICAL' && !(Number.isFinite(parseFloat(q.answerText)))) errors.push(`${label}: provide a numeric answer`);
  });
  return errors;
}

export default function MockTestsPage() {
  const { pushToast } = useToast();
  const [tests, setTests] = useState<MockTestItem[]>([]);
  const [, setTotal] = useState(0);
  const [counts, setCounts] = useState<Counts>({ total: 0, drafts: 0, published: 0, archived: 0 });
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const [builder, setBuilder] = useState<{ open: boolean; editId: string | null }>({ open: false, editId: null });
  const [preview, setPreview] = useState<MockTestItem | null>(null);
  const [confirm, setConfirm] = useState<{ id: string; title: string; action: 'delete' | 'archive' } | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (categoryFilter !== 'ALL') params.set('categoryId', categoryFilter);
      const { data, status } = await apiClient.get(`/mock-tests?${params.toString()}`);
      if (status === 200) {
        setTests(data?.items || []);
        setTotal(data?.total || 0);
      } else {
        pushToast('Failed to load mock tests', 'error');
      }
    } catch (err: any) {
      if (err?.response?.status === 401) return;
      pushToast(err?.response?.status >= 500 ? 'Server error. Please try again.' : 'Failed to load mock tests', 'error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, categoryFilter, pushToast]);

  const fetchCounts = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/mock-tests/counts');
      setCounts(data || { total: 0, drafts: 0, published: 0, archived: 0 });
    } catch { /* ignore */ }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/preparation-categories');
      setCategories(data?.items || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchCounts(); fetchCategories(); }, [fetchCounts, fetchCategories]);
  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const openBuilder = (edit?: MockTestItem) => {
    setBuilder({ open: true, editId: edit?.id || null });
    if (edit) setPreview(null);
  };

  const runAction = async (id: string, fn: () => Promise<void>, successMsg: string, failMsg: string, key: string) => {
    setBusyAction(key);
    try {
      await fn();
      pushToast(successMsg, 'success');
      fetchData(); fetchCounts();
    } catch (err: any) {
      pushToast(err?.response?.data?.message || failMsg, 'error');
    } finally {
      setBusyAction(null);
    }
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    if (confirm.action === 'delete') {
      await runAction(confirm.id, () => apiClient.delete(`/mock-tests/${confirm.id}`), 'Test deleted', 'Delete failed', `del-${confirm.id}`);
    } else {
      await runAction(confirm.id, () => apiClient.post(`/mock-tests/${confirm.id}/archive/archive`), 'Test archived', 'Archive failed', `arc-${confirm.id}`);
    }
    setConfirm(null);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Mock Tests</h1>
          <p className="text-sm text-slate-500 mt-1">Full-length practice tests with timed questions, negative marking and attempt history.</p>
        </div>
        <Button onClick={() => openBuilder()}><Plus className="w-4 h-4 mr-1" /> Create Mock Test</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={<FileQuestion className="w-5 h-5 text-brand-600" />} label="Total Tests" value={counts.total} />
        <StatCard icon={<Clock className="w-5 h-5 text-slate-500" />} label="Drafts" value={counts.drafts} />
        <StatCard icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />} label="Published" value={counts.published} sub="Live for students" />
        <StatCard icon={<Archive className="w-5 h-5 text-amber-600" />} label="Archived" value={counts.archived} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tests..." className="pl-9" />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
          <option value="ALL">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
          <option value="ARCHIVED">Archived</option>
        </Select>
        <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-48">
          <option value="ALL">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 animate-pulse">Loading...</div>
      ) : tests.length === 0 ? (
        <div className="text-center py-16 text-slate-400">No mock tests found. Create your first one.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 text-left text-slate-600">
              <th className="whitespace-nowrap px-4 py-3 font-medium">Exam Name</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Duration</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Questions</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Marks</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Attempts</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Status</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium hidden md:table-cell">Created</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium text-center">Actions</th>
            </tr></thead>
            <tbody>
              {tests.map((t) => (
                <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900 max-w-[260px]">
                    <div className="truncate">{t.title}</div>
                    <div className="text-xs text-slate-400 truncate">
                      {t.preparationCategory?.name || ''}{t.topic?.name ? ` / ${t.topic.name}` : ''}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{t.durationMinutes} min</td>
                  <td className="px-4 py-3 text-slate-600">{t._count?.questions ?? 0}</td>
                  <td className="px-4 py-3 text-slate-600">{t.totalMarks ?? 0}</td>
                  <td className="px-4 py-3 text-slate-600">{t._count?.results ?? 0}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded font-medium ${statusBadge[t.publishStatus] || 'bg-slate-100 text-slate-600'}`}>{t.publishStatus}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 hidden md:table-cell">{fmtDate(t.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-center">
                      <IconBtn title="Preview" onClick={() => setPreview(t)}><Eye className="w-4 h-4" /></IconBtn>
                      <IconBtn title="Edit" onClick={() => openBuilder(t)}><Edit3 className="w-4 h-4" /></IconBtn>
                      <IconBtn title="Duplicate" disabled={busyAction === `dup-${t.id}`} onClick={() => runAction(t.id, () => apiClient.post(`/mock-tests/${t.id}/duplicate`), 'Duplicated as draft', 'Duplicate failed', `dup-${t.id}`)}><Copy className="w-4 h-4" /></IconBtn>
                      {t.publishStatus === 'PUBLISHED' ? (
                        <IconBtn title="Unpublish" onClick={() => runAction(t.id, () => apiClient.post(`/mock-tests/${t.id}/publish`, { status: 'DRAFT' }), 'Unpublished', 'Unpublish failed', `pub-${t.id}`)}><Send className="w-4 h-4 text-amber-500" /></IconBtn>
                      ) : t.publishStatus === 'DRAFT' ? (
                        <IconBtn title="Publish" onClick={() => runAction(t.id, () => apiClient.post(`/mock-tests/${t.id}/publish`, { status: 'PUBLISHED' }), 'Published', 'Publish failed', `pub-${t.id}`)}><Send className="w-4 h-4 text-emerald-600" /></IconBtn>
                      ) : (
                        <IconBtn title="Restore to draft" onClick={() => runAction(t.id, () => apiClient.post(`/mock-tests/${t.id}/archive/restore`), 'Restored to draft', 'Restore failed', `pub-${t.id}`)}><RotateCcw className="w-4 h-4" /></IconBtn>
                      )}
                      {t.publishStatus !== 'ARCHIVED' && (
                        <IconBtn title="Archive" onClick={() => setConfirm({ id: t.id, title: t.title, action: 'archive' })}><Archive className="w-4 h-4" /></IconBtn>
                      )}
                      <IconBtn title="Delete" danger onClick={() => setConfirm({ id: t.id, title: t.title, action: 'delete' })}><Trash2 className="w-4 h-4" /></IconBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog open={!!confirm} title={confirm?.action === 'delete' ? 'Delete Mock Test' : 'Archive Mock Test'}
        message={confirm?.action === 'delete'
          ? `Delete "${confirm?.title}"? All questions, results and attempt history will be permanently removed.`
          : `Move "${confirm?.title}" to archive? Students will no longer see it.`}
        confirmLabel={confirm?.action === 'delete' ? 'Delete' : 'Archive'} variant="danger"
        onConfirm={handleConfirm} onCancel={() => setConfirm(null)} />

      {builder.open && <MockTestBuilder editId={builder.editId} categories={categories} onClose={() => setBuilder({ open: false, editId: null })} onSaved={() => { setBuilder({ open: false, editId: null }); fetchData(); fetchCounts(); }} />}
      {preview && <PreviewModal testId={preview.id} onClose={() => setPreview(null)} />}
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

export function IconBtn({ title, onClick, danger, disabled, children }: { title: string; onClick?: () => void; danger?: boolean; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={title} disabled={disabled}
      className={`p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed ${danger ? 'text-red-500' : 'text-slate-500'}`}>
      {children}
    </button>
  );
}

function MockTestBuilder({ editId, categories, onClose, onSaved }: { editId: string | null; categories: Array<{ id: string; name: string }>; onClose: () => void; onSaved: () => void }) {
  const { pushToast } = useToast();
  const [loading, setLoading] = useState(!!editId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [passingMarks, setPassingMarks] = useState(0);
  const [negativeMarking, setNegativeMarking] = useState(0);
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!editId) {
      if (categories.length > 0 && !categoryId) setCategoryId(categories[0].id);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await apiClient.get(`/mock-tests/${editId}`);
        if (cancelled) return;
        setTitle(data.title || '');
        setDescription(data.description || '');
        setCategoryId(data.preparationCategoryId || categories[0]?.id || '');
        setDurationMinutes(data.durationMinutes || 60);
        setPassingMarks(data.passingMarks ?? 0);
        setNegativeMarking(data.negativeMarking ?? 0);
        setDifficulty(data.difficulty || 'MEDIUM');
        setShuffleOptions(data.shuffleOptions !== false);
        setShuffleQuestions(data.shuffleQuestions !== false);
        setQuestions((data.questions || []).map((q: any) => questionFromServer(q)));
      } catch (err: any) {
        if (!cancelled) {
          pushToast(err?.response?.data?.message || 'Failed to load test', 'error');
          onClose();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [editId, categories, categoryId, onClose, pushToast]);

  const updateQuestion = (localId: string, patch: Partial<QuestionDraft>) => {
    setQuestions((prev) => prev.map((q) => (q.localId === localId ? { ...q, ...patch } : q)));
  };

  const removeQuestion = (localId: string) => setQuestions((prev) => prev.filter((q) => q.localId !== localId));

  const moveQuestion = (index: number, dir: -1 | 1) => {
    setQuestions((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const totalMarks = questions.reduce((s, q) => s + (Math.max(1, Number(q.marks) || 1)), 0);

  const submit = async () => {
    if (!title.trim()) { setError('Title is required'); return; }
    if (!categoryId) { setError('Select a category'); return; }
    const qErrors = validateQuestions(questions);
    if (qErrors.length > 0) { setError(qErrors[0]); return; }
    setError('');
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      preparationCategoryId: categoryId,
      durationMinutes: Math.max(1, Number(durationMinutes) || 60),
      passingMarks: Math.max(0, Number(passingMarks) || 0),
      negativeMarking: Math.max(0, Number(negativeMarking) || 0),
      difficulty,
      shuffleOptions,
      shuffleQuestions,
      questions: questions.map(questionPayload),
    };
    setBusy(true);
    try {
      if (editId) {
        await apiClient.put(`/mock-tests/${editId}`, payload);
        pushToast('Mock test updated', 'success');
      } else {
        await apiClient.post('/mock-tests', payload);
        pushToast('Mock test created', 'success');
      }
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 p-3 sm:p-6" onClick={onClose}>
      <div className="mx-auto max-w-3xl rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-white rounded-t-2xl z-10">
          <p className="text-sm font-semibold text-slate-800">{editId ? 'Edit Mock Test' : 'Create Mock Test'}</p>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-200 text-slate-500"><X className="w-4 h-4" /></button>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-400 animate-pulse">Loading test...</div>
        ) : (
          <div className="p-4 sm:p-5 space-y-5">
            {error && <div className="rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5">{error}</div>}

            <div className="grid sm:grid-cols-2 gap-3">
              <label className="space-y-1 sm:col-span-2">
                <span className="text-xs text-slate-500">Title *</span>
                <Input value={title} onChange={(e) => { setTitle(e.target.value); setError(''); }} placeholder="e.g. GATE CS Full Mock 1" />
              </label>
              <label className="space-y-1 sm:col-span-2">
                <span className="text-xs text-slate-500">Description</span>
                <TextArea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this test cover?" className="min-h-[48px]" />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-slate-500">Category *</span>
                <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  {categories.length === 0 && <option value="">No categories found</option>}
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </label>
              <label className="space-y-1">
                <span className="text-xs text-slate-500">Difficulty</span>
                <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </Select>
              </label>
              <label className="space-y-1">
                <span className="text-xs text-slate-500">Duration (minutes) *</span>
                <Input type="number" min={1} value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-slate-500">Passing marks</span>
                <Input type="number" min={0} value={passingMarks} onChange={(e) => setPassingMarks(Number(e.target.value))} />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-slate-500">Default negative marking (per wrong answer)</span>
                <Input type="number" min={0} step={0.25} value={negativeMarking} onChange={(e) => setNegativeMarking(Number(e.target.value))} />
              </label>
              <div className="space-y-1">
                <span className="text-xs text-slate-500">Options</span>
                <div className="flex flex-wrap gap-4 h-11 items-center">
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input type="checkbox" checked={shuffleQuestions} onChange={(e) => setShuffleQuestions(e.target.checked)} className="accent-brand-500" />
                    Shuffle questions
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input type="checkbox" checked={shuffleOptions} onChange={(e) => setShuffleOptions(e.target.checked)} className="accent-brand-500" />
                    Shuffle options
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">
                Questions <span className="text-slate-400 font-normal">({questions.length})</span>
                <span className="ml-2 text-xs font-normal text-slate-500">Total marks: <b className="text-slate-700">{totalMarks}</b></span>
              </p>
              <Button variant="secondary" onClick={() => setQuestions((prev) => [...prev, emptyQuestion()])}><Plus className="w-4 h-4 mr-1" /> Add Question</Button>
            </div>

            {questions.length === 0 && <div className="text-center py-8 text-slate-400 text-sm">No questions yet. Add one to get started.</div>}

            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={q.localId} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 sm:p-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-lg px-2 py-1.5">
                      <GripVertical className="w-3.5 h-3.5" /> Q{idx + 1}
                    </span>
                    <Select className="h-9 w-44 text-sm" value={q.questionType} onChange={(e) => updateQuestion(q.localId, { questionType: e.target.value })}>
                      {QUESTION_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
                    </Select>
                    <div className="flex items-center gap-1 ml-auto">
                      <IconBtn title="Move up" onClick={() => moveQuestion(idx, -1)}><ChevronUp className="w-4 h-4" /></IconBtn>
                      <IconBtn title="Move down" onClick={() => moveQuestion(idx, 1)}><ChevronDown className="w-4 h-4" /></IconBtn>
                      <IconBtn title="Remove question" danger onClick={() => removeQuestion(q.localId)}><Trash2 className="w-4 h-4" /></IconBtn>
                    </div>
                  </div>

                  <TextArea value={q.question} onChange={(e) => updateQuestion(q.localId, { question: e.target.value })} placeholder="Question text" className="min-h-[54px] bg-white" />

                  {(q.questionType === 'MCQ' || q.questionType === 'MULTIPLE_SELECT') && (
                    <div className="grid sm:grid-cols-2 gap-2">
                      {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                        const val = q[`option${opt}`];
                        const selected = q.questionType === 'MCQ' ? q.correctOption === opt : q.correctOptions.includes(opt);
                        return (
                          <div key={opt} className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 px-3">
                            <span className="text-xs font-semibold text-slate-500 w-4">{opt}.</span>
                            <Input value={val} onChange={(e) => updateQuestion(q.localId, { [`option${opt}`]: e.target.value })} placeholder={`Option ${opt}`} className="border-0 focus:border-0 px-1 h-9" />
                            <input
                              type={q.questionType === 'MCQ' ? 'radio' : 'checkbox'}
                              checked={selected}
                              onChange={() => {
                                if (q.questionType === 'MCQ') updateQuestion(q.localId, { correctOption: opt });
                                else {
                                  const next = selected ? q.correctOptions.filter((c) => c !== opt) : [...q.correctOptions, opt];
                                  updateQuestion(q.localId, { correctOptions: next });
                                }
                              }}
                              className="accent-brand-500"
                              title={q.questionType === 'MCQ' ? 'Correct answer' : 'Correct answer'}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {q.questionType === 'TRUE_FALSE' && (
                    <div className="flex gap-2">
                      {[true, false].map((v) => (
                        <button key={String(v)} type="button" onClick={() => updateQuestion(q.localId, { correctBoolean: v })}
                          className={`h-10 flex-1 rounded-xl border text-sm font-medium ${q.correctBoolean === v ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-600'}`}>
                          {v ? 'True' : 'False'}
                        </button>
                      ))}
                    </div>
                  )}

                  {q.questionType === 'SHORT_ANSWER' && (
                    <div className="grid sm:grid-cols-2 gap-2">
                      <label className="space-y-1">
                        <span className="text-xs text-slate-500">Correct answer *</span>
                        <Input value={q.answerText} onChange={(e) => updateQuestion(q.localId, { answerText: e.target.value })} placeholder="e.g. FIFO" className="bg-white" />
                      </label>
                      <label className="space-y-1">
                        <span className="text-xs text-slate-500">Alternative answers (comma separated)</span>
                        <Input value={q.alternatives} onChange={(e) => updateQuestion(q.localId, { alternatives: e.target.value })} placeholder="e.g. First In First Out" className="bg-white" />
                      </label>
                      <label className="space-y-1">
                        <span className="text-xs text-slate-500">Keywords (comma separated)</span>
                        <Input value={q.keywords} onChange={(e) => updateQuestion(q.localId, { keywords: e.target.value })} placeholder="e.g. fifo, queue" className="bg-white" />
                      </label>
                      <label className="flex items-center gap-2 text-sm text-slate-600 h-11">
                        <input type="checkbox" checked={q.caseSensitive} onChange={(e) => updateQuestion(q.localId, { caseSensitive: e.target.checked })} className="accent-brand-500" />
                        Case sensitive match
                      </label>
                    </div>
                  )}

                  {q.questionType === 'NUMERICAL' && (
                    <label className="space-y-1 block max-w-xs">
                      <span className="text-xs text-slate-500">Correct numeric answer *</span>
                      <Input value={q.answerText} onChange={(e) => updateQuestion(q.localId, { answerText: e.target.value })} placeholder="e.g. 3.14" className="bg-white" />
                    </label>
                  )}

                  {q.questionType === 'FILL_BLANK' && (
                    <div className="grid sm:grid-cols-2 gap-2">
                      <label className="space-y-1">
                        <span className="text-xs text-slate-500">Correct answer *</span>
                        <Input value={q.answerText} onChange={(e) => updateQuestion(q.localId, { answerText: e.target.value })} placeholder="e.g. RAM" className="bg-white" />
                      </label>
                      <label className="space-y-1">
                        <span className="text-xs text-slate-500">Alternatives (comma separated)</span>
                        <Input value={q.alternatives} onChange={(e) => updateQuestion(q.localId, { alternatives: e.target.value })} placeholder="e.g. random access memory" className="bg-white" />
                      </label>
                    </div>
                  )}

                  {q.questionType === 'CODING' && (
                    <label className="space-y-1 block">
                      <span className="text-xs text-slate-500">Reference solution (optional)</span>
                      <TextArea value={q.answerText} onChange={(e) => updateQuestion(q.localId, { answerText: e.target.value })} placeholder="Paste reference solution" className="min-h-[60px] bg-white font-mono text-xs" />
                    </label>
                  )}

                  {q.questionType === 'PARAGRAPH' && (
                    <p className="text-xs text-slate-400 bg-white border border-dashed border-slate-200 rounded-lg px-3 py-2">
                      Paragraph questions are answered in free text and marked for manual review — no auto-scoring.
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 items-end">
                    <label className="space-y-1">
                      <span className="text-xs text-slate-500">Marks</span>
                      <Input type="number" min={1} value={q.marks} onChange={(e) => updateQuestion(q.localId, { marks: Number(e.target.value) })} className="w-24 bg-white" />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs text-slate-500">Negative</span>
                      <Input type="number" min={0} step={0.25} value={q.negativeMarks} onChange={(e) => updateQuestion(q.localId, { negativeMarks: Number(e.target.value) })} className="w-24 bg-white" />
                    </label>
                    <label className="space-y-1 flex-1 min-w-[160px]">
                      <span className="text-xs text-slate-500">Explanation (shown after submission)</span>
                      <Input value={q.explanation} onChange={(e) => updateQuestion(q.localId, { explanation: e.target.value })} placeholder="Why is this the answer?" className="bg-white" />
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 sticky bottom-0 bg-white pt-3 pb-1">
              <Button onClick={submit} disabled={busy}>{busy ? 'Saving...' : editId ? 'Save Changes' : 'Create Mock Test'}</Button>
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewModal({ testId, onClose }: { testId: string; onClose: () => void }) {
  const [test, setTest] = useState<MockTestItem | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await apiClient.get(`/mock-tests/${testId}`);
        if (!cancelled) setTest(data);
      } catch (err: any) {
        if (!cancelled) setError(err?.response?.data?.message || 'Failed to load preview');
      }
    })();
    return () => { cancelled = true; };
  }, [testId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-gradient-to-r from-brand-50 to-indigo-50 sticky top-0 bg-white">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-brand-600" />
            <p className="text-sm font-semibold text-slate-800">Preview — {test?.title || 'Loading...'}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-200 text-slate-500"><X className="w-4 h-4" /></button>
        </div>
        {error ? (
          <div className="p-8 text-center text-red-500 text-sm">{error}</div>
        ) : !test ? (
          <div className="p-10 text-center text-slate-400 animate-pulse">Loading...</div>
        ) : (
          <div className="p-5 space-y-5">
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 inline-flex items-center gap-1"><Timer className="w-3 h-3" />{test.durationMinutes} min</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 inline-flex items-center gap-1"><FileQuestion className="w-3 h-3" />{test.questions?.length || 0} questions</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 inline-flex items-center gap-1"><BarChart3 className="w-3 h-3" />{test.totalMarks ?? 0} marks</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">Pass: {test.passingMarks}</span>
              {test.difficulty && <span className={`px-2 py-0.5 rounded font-medium ${difficultyBadge[test.difficulty] || 'bg-slate-100 text-slate-600'}`}>{test.difficulty}</span>}
              <span className={`px-2 py-0.5 rounded font-medium ${statusBadge[test.publishStatus] || 'bg-slate-100 text-slate-600'}`}>{test.publishStatus}</span>
            </div>
            {test.description && <p className="text-sm text-slate-500">{test.description}</p>}

            <div className="space-y-4">
              {(test.questions || []).map((q, idx) => {
                return (
                  <div key={q.localId || idx} className="rounded-xl border border-slate-200 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-slate-900"><span className="text-slate-400 mr-1">Q{idx + 1}.</span>{q.question}</p>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-brand-50 text-brand-600 whitespace-nowrap">{TYPE_LABEL[q.questionType]}</span>
                    </div>
                    {(q.questionType === 'MCQ' || q.questionType === 'MULTIPLE_SELECT') && (
                      <div className="space-y-1.5">
                        {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                          const val = (q as any)[`option${opt}`];
                          if (!val) return null;
                          const isCorrect = q.questionType === 'MCQ' ? q.correctOption === opt : q.correctOptions.includes(opt);
                          return (
                            <div key={opt} className={`px-3 py-2 rounded-lg border text-sm flex items-center gap-2 ${isCorrect ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
                              <span className={`font-semibold ${isCorrect ? 'text-emerald-700' : 'text-slate-500'}`}>{opt}.</span>
                              <span className="text-slate-800">{val}</span>
                              {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 ml-auto" />}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {q.questionType === 'TRUE_FALSE' && (
                      <div className="flex gap-2">
                        <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${q.correctBoolean === true ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' : 'border border-slate-200 bg-white text-slate-500'}`}>True</span>
                        <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${q.correctBoolean === false ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' : 'border border-slate-200 bg-white text-slate-500'}`}>False</span>
                      </div>
                    )}
                    {['SHORT_ANSWER', 'NUMERICAL', 'FILL_BLANK'].includes(q.questionType) && (
                      <p className="text-sm text-slate-700"><span className="text-xs font-semibold text-emerald-600 mr-1">ANSWER:</span>{q.answerText}{q.alternatives ? ` (also: ${q.alternatives})` : ''}</p>
                    )}
                    {q.questionType === 'PARAGRAPH' && <p className="text-xs text-slate-400 italic">Manual review question.</p>}
                    <div className="flex gap-3 text-[11px] text-slate-500">
                      <span>Marks: <b>{q.marks}</b></span>
                      {Number(q.negativeMarks) > 0 && <span>Negative: <b>{q.negativeMarks}</b></span>}
                      {q.caseSensitive && <span>Case sensitive</span>}
                    </div>
                    {q.explanation && <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">{q.explanation}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
