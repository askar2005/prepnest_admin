import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { Select } from '../../components/ui/Select';
import { Plus, Trash2, Copy, ChevronDown, ChevronRight, Save, List, CheckSquare, Loader2 } from 'lucide-react';
import { useToast } from '../../components/common/ToastHost';
import { useTopicWorkspace, type McqItem } from './useTopicWorkspace';
import { DeleteConfirmationModal } from '../../components/common/DeleteConfirmationModal';
import { MCQCard } from '../../components/common/MCQCard';

interface QuestionDraft {
  localId: string;
  id?: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  explanation: string;
  isPublished: boolean;
  expanded: boolean;
}

let nextLocalId = 1;
function freshQuestion(): QuestionDraft {
  return { localId: String(nextLocalId++), question: '', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'A', explanation: '', isPublished: false, expanded: true };
}

export function McqsSection({ items, api }: { items: McqItem[]; api: ReturnType<typeof useTopicWorkspace> }) {
  const { pushToast } = useToast();
  const [search] = useState('');
  const [page, setPage] = useState(1);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [duplicateModal, setDuplicateModal] = useState<{ open: boolean; mcq: McqItem | null }>({ open: false, mcq: null });

  const perPage = 10;
  const filtered = items.filter((m) => m.question.toLowerCase().includes(search.toLowerCase()));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const updateQ = (localId: string, patch: Partial<QuestionDraft>) => {
    setQuestions((prev) => prev.map((q) => (q.localId === localId ? { ...q, ...patch } : q)));
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, freshQuestion()]);
  };

  const duplicateQuestion = (localId: string) => {
    const q = questions.find((x) => x.localId === localId);
    if (!q) return;
    const copy = { ...freshQuestion(), question: q.question, optionA: q.optionA, optionB: q.optionB, optionC: q.optionC, optionD: q.optionD, correctOption: q.correctOption, explanation: q.explanation, isPublished: q.isPublished };
    const idx = questions.findIndex((x) => x.localId === localId);
    const next = [...questions];
    next.splice(idx + 1, 0, copy);
    setQuestions(next);
  };

  const deleteQuestion = (localId: string) => {
    setQuestions((prev) => prev.filter((q) => q.localId !== localId));
  };

  const startEdit = (mcq: McqItem) => {
    const q: QuestionDraft = {
      localId: String(nextLocalId++),
      id: mcq.id,
      question: mcq.question,
      optionA: mcq.optionA,
      optionB: mcq.optionB,
      optionC: mcq.optionC,
      optionD: mcq.optionD,
      correctOption: mcq.correctOption,
      explanation: mcq.explanation || '',
      isPublished: mcq.isPublished ?? false,
      expanded: true,
    };
    setQuestions([q]);
    setEditId(mcq.id);
    setShowBuilder(true);
  };

  const saveAll = async () => {
    const valid = questions.filter((q) => q.question.trim() && q.optionA.trim() && q.optionB.trim() && q.optionC.trim() && q.optionD.trim());
    if (valid.length === 0) { pushToast('No valid questions to save', 'error'); return; }
    setSaving(true);
    try {
      const newOnes = valid.filter((q) => !q.id);
      const existingOnes = valid.filter((q) => q.id);

      if (newOnes.length > 0) {
        const payload = newOnes.map((q) => ({
          question: q.question.trim(),
          optionA: q.optionA.trim(),
          optionB: q.optionB.trim(),
          optionC: q.optionC.trim(),
          optionD: q.optionD.trim(),
          correctOption: q.correctOption,
          explanation: q.explanation.trim() || '',
          isPublished: q.isPublished,
        }));
        await api.bulkCreateMcqs({ questions: payload });
      }

      for (const q of existingOnes) {
        await api.updateMcq(q.id!, {
          question: q.question.trim(),
          optionA: q.optionA.trim(),
          optionB: q.optionB.trim(),
          optionC: q.optionC.trim(),
          optionD: q.optionD.trim(),
          correctOption: q.correctOption,
          explanation: q.explanation.trim() || '',
          isPublished: q.isPublished,
        });
      }

      const count = newOnes.length + existingOnes.length;
      pushToast(`${count} MCQ(s) saved`, 'success');
      setQuestions([]);
      setShowBuilder(false);
      setEditId(null);
      refreshData();
    } catch (err: any) { pushToast(err?.response?.data?.message || err?.message || 'Save failed', 'error'); }
    finally { setSaving(false); }
  };

  const refreshData = () => {
    (window as any).__topicWorkspaceRefresh?.();
  };

  const startDuplicate = (mcq: McqItem) => {
    setDuplicateModal({ open: true, mcq });
  };

  const confirmDuplicate = async () => {
    if (!duplicateModal.mcq) return;
    try {
      const m = duplicateModal.mcq;
      await api.createMcq({ question: m.question, optionA: m.optionA, optionB: m.optionB, optionC: m.optionC, optionD: m.optionD, correctOption: m.correctOption, explanation: m.explanation || '', isPublished: false });
      pushToast('MCQ duplicated', 'success');
      refreshData();
      setDuplicateModal({ open: false, mcq: null });
    } catch (err: any) { pushToast(err?.response?.data?.message || err?.message || 'Duplicate failed', 'error'); }
  };

  const startDelete = (id: string) => {
    setDeleteModal({ open: true, id });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    try {
      await api.deleteMcq(deleteModal.id);
      pushToast('MCQ deleted', 'success');
      refreshData();
      setDeleteModal({ open: false, id: null });
    } catch (err: any) { pushToast(err?.response?.data?.message || err?.message || 'Delete failed', 'error'); }
  };

  useEffect(() => { setPage(1); }, [search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">MCQ Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">Create and manage practice questions</p>
        </div>
        <Button onClick={() => { setShowBuilder(!showBuilder); setQuestions([]); setEditId(null); }}><Plus className="w-4 h-4 mr-1" />{showBuilder ? 'Close Builder' : 'MCQ Builder'}</Button>
      </div>

      {showBuilder && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-soft">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2"><List className="w-4 h-4" />{editId ? 'Edit MCQ' : 'MCQ Builder'} ({questions.length})</h3>
            <div className="flex gap-2">
              <Button onClick={saveAll} disabled={saving || questions.length === 0} className="h-9 text-xs px-3">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}{saving ? 'Saving...' : 'Save All'}
              </Button>
              <Button variant="secondary" onClick={addQuestion} className="h-9 text-xs px-3"><Plus className="w-4 h-4 mr-1" />Add</Button>
            </div>
          </div>
          <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
            {questions.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">No questions yet. Click "Add" to create one.</p>
            )}
            {questions.map((q) => (
              <div key={q.localId} className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 cursor-pointer" onClick={() => updateQ(q.localId, { expanded: !q.expanded })}>
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {q.expanded ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
                    <span className="text-sm font-medium text-slate-700 truncate">{q.question || 'New Question'}</span>
                    {!q.isPublished && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 shrink-0">Draft</span>}
                    {q.isPublished && <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 shrink-0">Published</span>}
                  </div>
                  <div className="flex gap-1 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => duplicateQuestion(q.localId)} className="p-1 rounded hover:bg-white text-slate-400 hover:text-indigo-600" title="Duplicate"><Copy className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteQuestion(q.localId)} className="p-1 rounded hover:bg-white text-slate-400 hover:text-red-600" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                {q.expanded && (
                  <div className="p-4 space-y-3">
                    <TextArea placeholder="Question" value={q.question} onChange={(e) => updateQ(q.localId, { question: e.target.value })} className="min-h-[50px] text-sm" />
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-[10px] font-medium text-slate-500 mb-0.5 block">Option A</label><Input value={q.optionA} onChange={(e) => updateQ(q.localId, { optionA: e.target.value })} placeholder="Option A" className="text-sm" /></div>
                      <div><label className="text-[10px] font-medium text-slate-500 mb-0.5 block">Option B</label><Input value={q.optionB} onChange={(e) => updateQ(q.localId, { optionB: e.target.value })} placeholder="Option B" className="text-sm" /></div>
                      <div><label className="text-[10px] font-medium text-slate-500 mb-0.5 block">Option C</label><Input value={q.optionC} onChange={(e) => updateQ(q.localId, { optionC: e.target.value })} placeholder="Option C" className="text-sm" /></div>
                      <div><label className="text-[10px] font-medium text-slate-500 mb-0.5 block">Option D</label><Input value={q.optionD} onChange={(e) => updateQ(q.localId, { optionD: e.target.value })} placeholder="Option D" className="text-sm" /></div>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-slate-600">Correct Answer:</label>
                        <Select value={q.correctOption} onChange={(e) => updateQ(q.localId, { correctOption: e.target.value })} className="w-20 text-sm">
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </Select>
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={q.isPublished} onChange={(e) => updateQ(q.localId, { isPublished: e.target.checked })} className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                        <span className="text-xs font-medium text-slate-600">Published</span>
                      </label>
                    </div>
                    <TextArea placeholder="Explanation (optional)" value={q.explanation} onChange={(e) => updateQ(q.localId, { explanation: e.target.value })} className="min-h-[40px] text-sm" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {paged.length === 0 && !showBuilder && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckSquare className="w-12 h-12 text-slate-400 mb-3" />
            <p className="text-lg font-semibold text-slate-700">No MCQs Yet</p>
            <p className="text-sm text-slate-500 mt-1 mb-4">Use the MCQ Builder to create questions.</p>
            <Button onClick={() => setShowBuilder(true)}>Create MCQs</Button>
          </div>
        )}
        {paged.map((m) => (
          <MCQCard
            key={m.id}
            mcq={m}
            onEdit={startEdit}
            onDelete={startDelete}
            onDuplicate={startDuplicate}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${page === p ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}>{p}</button>
          ))}
        </div>
      )}

      <DeleteConfirmationModal open={deleteModal.open} title="Delete MCQ" message="Are you sure you want to delete this MCQ?" onConfirm={confirmDelete} onCancel={() => setDeleteModal({ open: false, id: null })} />
      <DeleteConfirmationModal open={duplicateModal.open} title="Duplicate MCQ" message={`Create a copy of "${duplicateModal.mcq?.question}"?`} confirmLabel="Duplicate" onConfirm={confirmDuplicate} onCancel={() => setDuplicateModal({ open: false, mcq: null })} />
    </div>
  );
}