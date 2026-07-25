import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/common/ToastHost';
import { useTopicWorkspace, type MockTestItem } from './useTopicWorkspace';
import { Plus, Trash2, Copy, ChevronUp, ChevronDown, Eye, Send, Save, Calendar } from 'lucide-react';

interface QForm {
  id: string; question: string; questionType: string; optionA: string; optionB: string; optionC: string; optionD: string;
  correctOption: string; explanation: string; marks: number; negativeMarks: number; answer: string; keywords: string;
  correctAnswer: boolean; alternatives: string;
}

let qc = 0;
const nq = (): QForm => ({ id: `mq_${++qc}`, question: '', questionType: 'MCQ', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'A', explanation: '', marks: 1, negativeMarks: 0, answer: '', keywords: '', correctAnswer: false, alternatives: '' });

export default function MockTestBuilderSection({ items, api }: { items: MockTestItem[]; api: ReturnType<typeof useTopicWorkspace> }) {
  const { pushToast } = useToast();
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState(''); const [desc, setDesc] = useState(''); const [duration, setDuration] = useState(60); const [passingMarks, setPassingMarks] = useState(40); const [negMarking, setNegMarking] = useState(0); const [publishStatus, setPublishStatus] = useState('DRAFT'); const [scheduledAt, setScheduledAt] = useState('');
  const [questions, setQuestions] = useState<QForm[]>([nq()]);
  const [busy, setBusy] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [tab, setTab] = useState<'mcq' | 'short'>('mcq');

  const updateQ = (id: string, f: string, v: any) => setQuestions((prev) => prev.map((q) => q.id === id ? { ...q, [f]: v } : q));
  const addQ = () => setQuestions((prev) => [...prev, nq()]);
  const removeQ = (id: string) => setQuestions((prev) => prev.length > 1 ? prev.filter((q) => q.id !== id) : prev);
  const dupQ = (id: string) => { const idx = questions.findIndex((q) => q.id === id); if (idx === -1) return; const d = { ...questions[idx], id: `mq_${++qc}` }; setQuestions((prev) => [...prev.slice(0, idx + 1), d, ...prev.slice(idx + 1)]); };
  const moveQ = (id: string, dir: 'up' | 'down') => { const idx = questions.findIndex((q) => q.id === id); if (idx === -1) return; const ni = dir === 'up' ? idx - 1 : idx + 1; if (ni < 0 || ni >= questions.length) return; const arr = [...questions]; [arr[idx], arr[ni]] = [arr[ni], arr[idx]]; setQuestions(arr); };

  const totalMarks = questions.reduce((s, q) => s + (q.marks || 0), 0);
  const steps = ['Basic Details', 'Questions', 'Preview', 'Publish'];

  const submit = async () => {
    if (!title.trim()) { pushToast('Test name required', 'error'); return; }
    const valid = questions.filter((q) => q.question.trim());
    if (valid.length === 0) { pushToast('At least one question required', 'error'); return; }
    setBusy(true);
    try {
      const body = {
        title: title.trim(), description: desc.trim(), durationMinutes: duration, passingMarks, negativeMarking: negMarking,
        publishStatus: publishStatus as any, scheduledAt: scheduledAt || null,
        questions: valid.map((q) => ({
          question: q.question, questionType: q.questionType,
          optionA: q.optionA, optionB: q.optionB, optionC: q.optionC, optionD: q.optionD,
          correctOption: q.correctOption, explanation: q.explanation, marks: q.marks, negativeMarks: q.negativeMarks,
          answer: q.answer, keywords: q.keywords, correctAnswer: q.correctAnswer, alternatives: q.alternatives,
        })),
      };
      await api.createMockTestWithQuestions(body);
      pushToast('Mock test created', 'success');
      resetForm();
    } catch (err: any) { pushToast(err?.response?.data?.message || err?.message || 'Failed', 'error'); }
    finally { setBusy(false); }
  };

  const resetForm = () => { setStep(0); setTitle(''); setDesc(''); setDuration(60); setPassingMarks(40); setNegMarking(0); setPublishStatus('DRAFT'); setScheduledAt(''); setQuestions([nq()]); setShowBuilder(false); };

  const filtered = tab === 'mcq' ? questions.filter((q) => q.questionType === 'MCQ') : questions.filter((q) => q.questionType !== 'MCQ');

  return (
    <div className="space-y-4">
      <Button onClick={() => setShowBuilder(!showBuilder)}><Plus className="w-4 h-4 mr-1" />{showBuilder ? 'Cancel' : 'Create Mock Test'}</Button>

      {showBuilder && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-soft">
          <div className="flex border-b border-slate-200">
            {steps.map((s, i) => (
              <button key={i} onClick={() => setStep(i)} className={`flex-1 px-4 py-3 text-sm font-medium ${step === i ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-700'}`}>
                {i + 1}. {s}
              </button>
            ))}
          </div>

          <div className="p-5 space-y-4">
            {/* Step 1: Basic Details */}
            {step === 0 && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-slate-700">Basic Details</p>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Test Name" />
                <TextArea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description" />
                <div className="grid grid-cols-2 gap-4">
                  <label className="space-y-1"><span className="text-xs text-slate-500">Duration (minutes)</span><Input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} /></label>
                  <label className="space-y-1"><span className="text-xs text-slate-500">Passing %</span><Input type="number" value={passingMarks} onChange={(e) => setPassingMarks(Number(e.target.value))} /></label>
                  <label className="space-y-1"><span className="text-xs text-slate-500">Negative Marking</span><Input type="number" step="0.5" value={negMarking} onChange={(e) => setNegMarking(Number(e.target.value))} /></label>
                  <label className="space-y-1"><span className="text-xs text-slate-500">Status</span><Select value={publishStatus} onChange={(e) => setPublishStatus(e.target.value)}><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option></Select></label>
                </div>
                <label className="space-y-1"><span className="text-xs text-slate-500">Schedule Publish (optional)</span><Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} /></label>
                <div className="flex justify-end"><Button onClick={() => setStep(1)}>Next: Questions</Button></div>
              </div>
            )}

            {/* Step 2: Questions */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                    <button onClick={() => setTab('mcq')} className={`px-3 py-1.5 text-sm rounded-md ${tab === 'mcq' ? 'bg-white shadow-sm' : ''}`}>MCQs ({questions.filter(q => q.questionType === 'MCQ').length})</button>
                    <button onClick={() => setTab('short')} className={`px-3 py-1.5 text-sm rounded-md ${tab !== 'mcq' ? 'bg-white shadow-sm' : ''}`}>Short Answers ({questions.filter(q => q.questionType !== 'MCQ').length})</button>
                  </div>
                  <Button onClick={addQ} className="!h-8 !px-3 text-xs"><Plus className="w-3.5 h-3.5 mr-1" />Add {tab === 'mcq' ? 'MCQ' : 'Question'}</Button>
                </div>

                {filtered.map((q, idx) => (
                  <div key={q.id} className="border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-slate-500">Question {idx + 1}</p>
                      <div className="flex gap-1">
                        <button onClick={() => moveQ(q.id, 'up')} disabled={idx === 0} className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5" /></button>
                        <button onClick={() => moveQ(q.id, 'down')} disabled={idx === questions.length - 1} className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5" /></button>
                        <button onClick={() => dupQ(q.id)} className="p-1 text-slate-400 hover:text-indigo-600"><Copy className="w-3.5 h-3.5" /></button>
                        <button onClick={() => removeQ(q.id)} className="p-1 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>

                    {q.questionType === 'MCQ' ? (
                      <>
                        <div className="flex gap-3">
                          <TextArea value={q.question} onChange={(e) => updateQ(q.id, 'question', e.target.value)} placeholder="Question" className="min-h-[50px] flex-1" />
                          <label className="space-y-1 shrink-0"><span className="text-xs text-slate-500">Type</span><Select value={q.questionType} onChange={(e) => updateQ(q.id, 'questionType', e.target.value)} className="max-w-[140px]"><option value="MCQ">MCQ</option><option value="SHORT_ANSWER">Short Answer</option><option value="TRUE_FALSE">True/False</option><option value="FILL_BLANK">Fill Blank</option></Select></label>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Input value={q.optionA} onChange={(e) => updateQ(q.id, 'optionA', e.target.value)} placeholder="Option A" className={q.correctOption === 'A' ? 'border-green-400' : ''} />
                          <Input value={q.optionB} onChange={(e) => updateQ(q.id, 'optionB', e.target.value)} placeholder="Option B" className={q.correctOption === 'B' ? 'border-green-400' : ''} />
                          <Input value={q.optionC} onChange={(e) => updateQ(q.id, 'optionC', e.target.value)} placeholder="Option C" className={q.correctOption === 'C' ? 'border-green-400' : ''} />
                          <Input value={q.optionD} onChange={(e) => updateQ(q.id, 'optionD', e.target.value)} placeholder="Option D" className={q.correctOption === 'D' ? 'border-green-400' : ''} />
                        </div>
                        <div className="flex gap-3">
                          <Select value={q.correctOption} onChange={(e) => updateQ(q.id, 'correctOption', e.target.value)} className="max-w-[160px]"><option value="A">Correct: A</option><option value="B">Correct: B</option><option value="C">Correct: C</option><option value="D">Correct: D</option></Select>
                          <label className="space-y-1"><span className="text-xs text-slate-500">Marks</span><Input type="number" value={q.marks} onChange={(e) => updateQ(q.id, 'marks', Number(e.target.value))} className="max-w-[80px]" /></label>
                          <label className="space-y-1"><span className="text-xs text-slate-500">Neg.</span><Input type="number" step="0.5" value={q.negativeMarks} onChange={(e) => updateQ(q.id, 'negativeMarks', Number(e.target.value))} className="max-w-[80px]" /></label>
                        </div>
                      </>
                    ) : (
                      <>
                        <TextArea value={q.question} onChange={(e) => updateQ(q.id, 'question', e.target.value)} placeholder="Question" className="min-h-[50px]" />
                        <div className="flex gap-3">
                          <label className="space-y-1 flex-1"><span className="text-xs text-slate-500">Type</span><Select value={q.questionType} onChange={(e) => updateQ(q.id, 'questionType', e.target.value)} className="max-w-[140px]"><option value="MCQ">MCQ</option><option value="SHORT_ANSWER">Short Answer</option><option value="TRUE_FALSE">True/False</option><option value="FILL_BLANK">Fill Blank</option></Select></label>
                          <label className="space-y-1"><span className="text-xs text-slate-500">Marks</span><Input type="number" value={q.marks} onChange={(e) => updateQ(q.id, 'marks', Number(e.target.value))} className="max-w-[80px]" /></label>
                        </div>
                        {q.questionType === 'SHORT_ANSWER' && <><Input value={q.answer} onChange={(e) => updateQ(q.id, 'answer', e.target.value)} placeholder="Answer" /><Input value={q.keywords} onChange={(e) => updateQ(q.id, 'keywords', e.target.value)} placeholder="Keywords (comma-separated)" /></>}
                        {q.questionType === 'TRUE_FALSE' && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={q.correctAnswer} onChange={(e) => updateQ(q.id, 'correctAnswer', e.target.checked)} className="rounded" /> Correct Answer is True</label>}
                        {q.questionType === 'FILL_BLANK' && <><Input value={q.answer} onChange={(e) => updateQ(q.id, 'answer', e.target.value)} placeholder="Correct Answer" /><Input value={q.alternatives} onChange={(e) => updateQ(q.id, 'alternatives', e.target.value)} placeholder="Alternative answers (comma-separated)" /></>}
                        <TextArea value={q.explanation} onChange={(e) => updateQ(q.id, 'explanation', e.target.value)} placeholder="Explanation" className="min-h-[40px]" />
                      </>
                    )}
                  </div>
                ))}
                <div className="flex justify-between pt-2"><Button variant="secondary" onClick={() => setStep(0)}>Back</Button><Button onClick={() => setStep(2)}>Next: Preview</Button></div>
              </div>
            )}

            {/* Step 3: Preview */}
            {step === 2 && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-slate-700">Preview</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Test Name</p><p className="text-sm font-medium text-slate-900">{title || '—'}</p></div>
                  <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Duration</p><p className="text-sm font-medium text-slate-900">{duration} min</p></div>
                  <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Total Questions</p><p className="text-sm font-medium text-slate-900">{questions.filter(q => q.question.trim()).length}</p></div>
                  <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Total Marks</p><p className="text-sm font-medium text-slate-900">{totalMarks}</p></div>
                  <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Passing %</p><p className="text-sm font-medium text-slate-900">{passingMarks}%</p></div>
                  <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Negative Marking</p><p className="text-sm font-medium text-slate-900">{negMarking}</p></div>
                </div>
                <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Question Distribution</p>
                  {['MCQ', 'SHORT_ANSWER', 'TRUE_FALSE', 'FILL_BLANK'].map((t) => { const c = questions.filter(q => q.questionType === t && q.question.trim()).length; return c > 0 ? <p key={t} className="text-sm text-slate-700 mt-1">{t.replace(/_/g, ' ')}: {c}</p> : null; })}
                </div>
                <div className="flex justify-between pt-2"><Button variant="secondary" onClick={() => setStep(1)}>Back</Button><Button onClick={() => setStep(3)}>Next: Publish</Button></div>
              </div>
            )}

            {/* Step 4: Publish */}
            {step === 3 && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-slate-700">Ready to Publish</p>
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                  {title ? `"${title}" — ${questions.filter(q => q.question.trim()).length} questions, ${totalMarks} total marks, ${duration} minutes` : 'Complete all steps to publish'}
                </div>
                <div className="flex gap-3">
                  <Button onClick={async () => { setPublishStatus('DRAFT'); await submit(); }} disabled={busy || !title.trim()}><Save className="w-4 h-4 mr-1" />{busy ? 'Saving...' : 'Save Draft'}</Button>
                  <Button onClick={async () => { setPublishStatus('PUBLISHED'); await submit(); }} disabled={busy || !title.trim()} variant="primary"><Send className="w-4 h-4 mr-1" />{busy ? 'Publishing...' : 'Publish'}</Button>
                  {scheduledAt && <Button variant="secondary" disabled><Calendar className="w-4 h-4 mr-1" />Scheduled</Button>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {items.length === 0 && !showBuilder && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium text-slate-700">No Mock Tests</p>
          <p className="text-sm text-slate-400 mt-1 mb-4">Create a mock test with the builder.</p>
        </div>
      )}
    </div>
  );
}
