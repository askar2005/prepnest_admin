import { useState, useCallback } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { Select } from '../../components/ui/Select';
import { Plus, Trash2, Copy, ChevronUp, ChevronDown, ChevronRight, ChevronDown as ChevronDownIcon, Upload, Download } from 'lucide-react';
import { useToast } from '../../components/common/ToastHost';
import { useTopicWorkspace, type McqItem } from './useTopicWorkspace';

interface QuestionForm {
  id: string;
  collapsed: boolean;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  explanation: string;
  difficulty: string;
  marks: number;
  negativeMarks: number;
}

let qIdCounter = 0;
function newQForm(): QuestionForm {
  return { id: `q_${++qIdCounter}`, collapsed: false, question: '', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'A', explanation: '', difficulty: '', marks: 1, negativeMarks: 0 };
}

export default function McqBuilderSection({ items, api }: { items: McqItem[]; api: ReturnType<typeof useTopicWorkspace> }) {
  const { pushToast } = useToast();
  const [questions, setQuestions] = useState<QuestionForm[]>([newQForm()]);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showBuilder, setShowBuilder] = useState(false);
  const perPage = 10;

  const filtered = items.filter((m) => m.question.toLowerCase().includes(search.toLowerCase()));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const updateQ = useCallback((id: string, field: keyof QuestionForm, value: any) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, [field]: value } : q)));
  }, []);

  const addQuestion = useCallback(() => setQuestions((prev) => [...prev, newQForm()]), []);

  const removeQuestion = useCallback((id: string) => {
    setQuestions((prev) => (prev.length > 1 ? prev.filter((q) => q.id !== id) : prev));
  }, []);

  const duplicateQuestion = useCallback((id: string) => {
    setQuestions((prev) => {
      const idx = prev.findIndex((q) => q.id === id);
      if (idx === -1) return prev;
      const dup = { ...prev[idx], id: `q_${++qIdCounter}`, collapsed: false };
      return [...prev.slice(0, idx + 1), dup, ...prev.slice(idx + 1)];
    });
  }, []);

  const moveQ = useCallback((id: string, dir: 'up' | 'down') => {
    setQuestions((prev) => {
      const idx = prev.findIndex((q) => q.id === id);
      if (idx === -1) return prev;
      const newIdx = dir === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return arr;
    });
  }, []);

  const toggleCollapse = useCallback((id: string) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, collapsed: !q.collapsed } : q)));
  }, []);

  const submitAll = async () => {
    const valid = questions.filter((q) => q.question.trim() && q.optionA.trim() && q.optionB.trim());
    if (valid.length === 0) { pushToast('No valid questions to save', 'error'); return; }
    setBusy(true);
    try {
      const created = [];
      for (const q of valid) {
        await api.createMcq({ question: q.question, optionA: q.optionA, optionB: q.optionB, optionC: q.optionC, optionD: q.optionD, correctOption: q.correctOption, explanation: q.explanation || null, difficulty: q.difficulty || null });
        created.push(q);
      }
      pushToast(`${created.length} MCQs created`, 'success');
      setQuestions([newQForm()]);
    } catch (err: any) { pushToast(err?.response?.data?.message || err?.message || 'Failed to create MCQs', 'error'); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search MCQs..." className="max-w-xs" />
        <Button onClick={() => { setShowBuilder(!showBuilder); }}><Plus className="w-4 h-4 mr-1" />{showBuilder ? 'Cancel' : 'MCQ Builder'}</Button>
        <Button variant="secondary" onClick={() => pushToast('Import feature coming soon', 'success')}><Upload className="w-4 h-4 mr-1" />Import</Button>
        <Button variant="secondary" onClick={() => window.open(`/api/preparation/${api}/mcqs/export/json`, '_blank')}><Download className="w-4 h-4 mr-1" />Export</Button>
      </div>

      {showBuilder && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">MCQ Builder — {questions.length} Question{questions.length !== 1 ? 's' : ''}</p>
            <Button onClick={addQuestion} className="!h-8 !px-3 text-xs"><Plus className="w-3.5 h-3.5 mr-1" />Add Question</Button>
          </div>

          {questions.map((q, idx) => (
            <div key={q.id} className="border border-slate-200 rounded-xl">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-50 rounded-t-xl cursor-pointer" onClick={() => toggleCollapse(q.id)}>
                <p className="text-sm font-medium text-slate-700">Question {idx + 1}{q.question ? `: ${q.question.substring(0, 50)}${q.question.length > 50 ? '...' : ''}` : ''}</p>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={(e) => { e.stopPropagation(); moveQ(q.id, 'up'); }} disabled={idx === 0} className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); moveQ(q.id, 'down'); }} disabled={idx === questions.length - 1} className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); duplicateQuestion(q.id); }} className="p-1 text-slate-400 hover:text-indigo-600"><Copy className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); removeQuestion(q.id); }} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  {q.collapsed ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronDownIcon className="w-4 h-4 text-slate-400" />}
                </div>
              </div>
              {!q.collapsed && (
                <div className="p-4 space-y-3">
                  <TextArea value={q.question} onChange={(e) => updateQ(q.id, 'question', e.target.value)} placeholder="Enter question" className="min-h-[60px]" />
                  <div className="grid grid-cols-2 gap-3">
                    {(['optionA', 'optionB', 'optionC', 'optionD'] as const).map((opt, oi) => (
                      <Input key={opt} value={q[opt]} onChange={(e) => updateQ(q.id, opt, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + oi)}`} className={q.correctOption === String.fromCharCode(65 + oi) ? 'border-green-400' : ''} />
                    ))}
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <Select value={q.correctOption} onChange={(e) => updateQ(q.id, 'correctOption', e.target.value)} className="max-w-[200px]">
                      <option value="A">Correct: A</option><option value="B">Correct: B</option><option value="C">Correct: C</option><option value="D">Correct: D</option>
                    </Select>
                    <Select value={q.difficulty} onChange={(e) => updateQ(q.id, 'difficulty', e.target.value)} className="max-w-[150px]">
                      <option value="">Any Difficulty</option><option value="EASY">Easy</option><option value="MEDIUM">Medium</option><option value="HARD">Hard</option>
                    </Select>
                    <label className="space-y-1"><span className="text-xs text-slate-500">Marks</span><Input type="number" value={q.marks} onChange={(e) => updateQ(q.id, 'marks', Number(e.target.value))} className="max-w-[80px]" /></label>
                    <label className="space-y-1"><span className="text-xs text-slate-500">Neg. Marks</span><Input type="number" step="0.5" value={q.negativeMarks} onChange={(e) => updateQ(q.id, 'negativeMarks', Number(e.target.value))} className="max-w-[80px]" /></label>
                  </div>
                  <TextArea value={q.explanation} onChange={(e) => updateQ(q.id, 'explanation', e.target.value)} placeholder="Explanation (optional)" className="min-h-[50px]" />
                </div>
              )}
            </div>
          ))}

          <div className="flex gap-2 pt-2">
            <Button onClick={submitAll} disabled={busy}>{busy ? 'Creating...' : `Save ${questions.filter(q => q.question.trim()).length} Question${questions.filter(q => q.question.trim()).length !== 1 ? 's' : ''}`}</Button>
            <Button variant="secondary" onClick={() => setQuestions([newQForm()])}>Clear All</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {paged.map((m) => (
          <div key={m.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
            <p className="text-sm font-medium text-slate-900">{m.question}</p>
            <div className="flex gap-4 mt-2 text-xs text-slate-500">
              <span className={m.correctOption === 'A' ? 'font-bold text-green-600' : ''}>A: {m.optionA}</span>
              <span className={m.correctOption === 'B' ? 'font-bold text-green-600' : ''}>B: {m.optionB}</span>
              <span className={m.correctOption === 'C' ? 'font-bold text-green-600' : ''}>C: {m.optionC}</span>
              <span className={m.correctOption === 'D' ? 'font-bold text-green-600' : ''}>D: {m.optionD}</span>
            </div>
            {m.difficulty && <span className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded ${m.difficulty === 'EASY' ? 'bg-green-50 text-green-600' : m.difficulty === 'HARD' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>{m.difficulty}</span>}
          </div>
        ))}
        {paged.length === 0 && !showBuilder && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-lg font-medium text-slate-700">No MCQs Yet</p>
            <p className="text-sm text-slate-400 mt-1 mb-4">Use the MCQ Builder to create questions.</p>
            <Button onClick={() => setShowBuilder(true)}>Create MCQs</Button>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} className={`px-3 py-1 text-sm rounded ${page === p ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}>{p}</button>
          ))}
        </div>
      )}
    </div>
  );
}
