import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { TextArea } from '../../components/ui/TextArea';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useToast } from '../../components/common/ToastHost';
import { Plus, Edit3, Trash2 } from 'lucide-react';

type Challenge = {
  id: string; question: string; optionA: string; optionB: string; optionC: string; optionD: string;
  correctAnswer: string; explanation: string | null; status: string; publishedAt: string | null; createdAt: string;
};

const statusBadge: Record<string, string> = {
  QUEUE: 'bg-slate-100 text-slate-600',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  ARCHIVED: 'bg-amber-100 text-amber-700',
};

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function DailyChallengeManagementPage() {
  const { pushToast } = useToast();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('A');
  const [explanation, setExplanation] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data, status } = await apiClient.get('/daily-challenges');
      if (status === 200) {
        setChallenges(data?.items || []);
      } else {
        pushToast('Failed to load challenges', 'error');
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        // interceptor handles redirect
        return;
      }
      if (err?.response?.status >= 500) {
        pushToast('Server error. Please try again.', 'error');
      } else {
        pushToast('Failed to load challenges', 'error');
      }
    }
    finally { setLoading(false); }
  }, [pushToast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const resetForm = () => {
    setQuestion(''); setOptionA(''); setOptionB(''); setOptionC(''); setOptionD('');
    setCorrectAnswer('A'); setExplanation(''); setEditId(null); setShowForm(false); setFieldErrors({});
  };

  const openEdit = (c: Challenge) => {
    setQuestion(c.question); setOptionA(c.optionA); setOptionB(c.optionB); setOptionC(c.optionC); setOptionD(c.optionD);
    setCorrectAnswer(c.correctAnswer); setExplanation(c.explanation || ''); setEditId(c.id); setShowForm(true); setFieldErrors({});
  };

  const eraseFieldErr = (field: string) => setFieldErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });

  const submit = async () => {
    const payload = {
      question: question.trim(),
      optionA: optionA.trim(),
      optionB: optionB.trim(),
      optionC: optionC.trim(),
      optionD: optionD.trim(),
      correctAnswer,
      explanation: explanation.trim() || null,
    };

    const missing: Record<string, string> = {};
    if (!payload.question) missing.question = 'Question is required';
    if (!payload.optionA) missing.optionA = 'Option A is required';
    if (!payload.optionB) missing.optionB = 'Option B is required';
    if (!payload.optionC) missing.optionC = 'Option C is required';
    if (!payload.optionD) missing.optionD = 'Option D is required';
    if (Object.keys(missing).length > 0) { setFieldErrors(missing); return; }
    setFieldErrors({});
    setBusy(true);
    try {
      if (editId) { await apiClient.put(`/daily-challenges/${editId}`, payload); pushToast('Question updated', 'success'); }
      else { await apiClient.post('/daily-challenges', payload); pushToast('Question created', 'success'); }
      resetForm(); fetchData();
    } catch (err: any) {
      const details = err?.response?.data?.details;
      let msg = err?.response?.data?.message || err?.message || 'Failed';
      if (details && typeof details === 'object') {
        const fieldErrs: Record<string, string> = {};
        for (const [key, value] of Object.entries(details as Record<string, unknown>)) {
          if (Array.isArray(value)) fieldErrs[key] = value[0];
          else if (typeof value === 'string') fieldErrs[key] = value;
        }
        if (Object.keys(fieldErrs).length > 0) {
          setFieldErrors(fieldErrs);
          msg = Object.values(fieldErrs)[0];
        }
      }
      pushToast(msg, 'error');
    } finally { setBusy(false); }
  };

  const handleDelete = async () => {
    if (!confirm) return;
    try { await apiClient.delete(`/daily-challenges/${confirm}`); pushToast('Deleted', 'success'); fetchData(); }
    catch (err: any) { pushToast(err?.response?.data?.message || 'Delete failed', 'error'); }
    setConfirm(null);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Daily Challenges</h1>
          <p className="text-sm text-slate-500 mt-1">One question is auto-published every day from the queue.</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}><Plus className="w-4 h-4 mr-1" /> Create Question</Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-soft space-y-4">
          <p className="text-sm font-semibold text-slate-700">{editId ? 'Edit Question' : 'New Question'}</p>

          <label className="space-y-1">
            <span className="text-xs text-slate-500">Question *</span>
            <TextArea value={question} onChange={(e) => { setQuestion(e.target.value); eraseFieldErr('question'); }} placeholder="Enter the question" className="min-h-[60px]" />
            {fieldErrors.question && <p className="text-xs text-red-500">{fieldErrors.question}</p>}
          </label>

          <div className="grid sm:grid-cols-2 gap-3">
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

          <div className="grid sm:grid-cols-2 gap-3">
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

      {loading ? <div className="text-center py-12 text-slate-400 animate-pulse">Loading...</div> : challenges.length === 0 ? (
        <div className="text-center py-16 text-slate-400">No questions yet. Create your first one.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead><tr className="bg-slate-50 text-left text-slate-600">
              <th className="whitespace-nowrap px-4 py-3 font-medium">Question</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Status</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium hidden sm:table-cell">Published</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium text-center">Actions</th>
            </tr></thead>
            <tbody>
              {challenges.map((c) => (
                <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900 max-w-[280px] truncate">{c.question}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded font-medium ${statusBadge[c.status] || 'bg-slate-100 text-slate-600'}`}>{c.status}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{fmtDate(c.publishedAt)}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-2 justify-center">
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" title="Edit"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => setConfirm(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog open={!!confirm} title="Delete Question" message="Are you sure you want to delete this question?" confirmLabel="Delete" variant="danger"
        onConfirm={handleDelete} onCancel={() => setConfirm(null)} />
    </div>
  );
}
