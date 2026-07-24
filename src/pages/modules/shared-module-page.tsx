import { useState, type Dispatch, type SetStateAction } from 'react';
import { apiClient } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { TextArea } from '../../components/ui/TextArea';
import { useToast } from '../../components/common/ToastHost';
import type { ModuleConfig } from './module-types';

type QuestionDraft = {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  explanation: string;
};

const EMPTY_QUESTION: QuestionDraft = {
  question: '', optionA: '', optionB: '', optionC: '', optionD: '',
  correctOption: 'optionA', explanation: '',
};

export function SharedModulePage({ config }: { config: ModuleConfig }) {
  const { pushToast } = useToast();
  const [topicName, setTopicName] = useState('');
  const [description, setDescription] = useState('');
  const [notesPdf, setNotesPdf] = useState('');
  const [pdfFileName, setPdfFileName] = useState('');
  const [mcqs, setMcqs] = useState<QuestionDraft[]>([{ ...EMPTY_QUESTION }]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!topicName.trim()) errs.topicName = 'Topic name is required';
    if (!description.trim()) errs.description = 'Description is required';
    if (!notesPdf) errs.notesPdf = 'Please upload a PDF file';
    const incompleteMcqs = mcqs.some((q) => !q.question.trim());
    if (mcqs.length > 0 && incompleteMcqs) errs.mcqs = 'All questions must have text';
    const noCorrect = mcqs.some((q) => !q.correctOption);
    if (mcqs.length > 0 && noCorrect) errs.correctOption = 'Select the correct answer for each question';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const resetForm = () => {
    setTopicName('');
    setDescription('');
    setNotesPdf('');
    setPdfFileName('');
    setMcqs([{ ...EMPTY_QUESTION }]);
    setErrors({});
  };

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const slug = config.title.toLowerCase().replace(/\s+/g, '-');
      const topicSlug = topicName.trim().toLowerCase().replace(/\s+/g, '-');

      const catRes = await apiClient.get('/preparation-categories', { params: { q: config.title, limit: 1 } });
      let category = catRes.data.items?.[0];
      if (!category) {
        const created = await apiClient.post('/preparation-categories', { name: config.title, slug, domain: config.title, description: config.title });
        category = created.data;
      }

      const topicRes = await apiClient.get('/topics', { params: { q: topicName.trim(), limit: 1 } });
      let topic = topicRes.data.items?.[0];
      if (topic) {
        await apiClient.put(`/topics/${topic.id}`, {
          preparationCategoryId: category.id,
          name: topicName.trim(),
          slug: topicSlug,
          description: description.trim(),
        });
      } else {
        const created = await apiClient.post('/topics', {
          preparationCategoryId: category.id,
          name: topicName.trim(),
          slug: topicSlug,
          description: description.trim(),
        });
        topic = created.data;
      }

      await apiClient.post('/study-materials', {
        preparationCategoryId: category.id,
        topicId: topic.id,
        title: topicName.trim(),
        type: 'NOTE',
        content: description.trim(),
        externalUrl: notesPdf || null,
        searchText: `${topicName} ${description}`,
      });

      for (const mcq of mcqs) {
        if (!mcq.question.trim()) continue;
        const correctOption = mcq.correctOption === 'optionB' ? 'B' : mcq.correctOption === 'optionC' ? 'C' : mcq.correctOption === 'optionD' ? 'D' : 'A';
        await apiClient.post('/mcq-questions', {
          preparationCategoryId: category.id,
          topicId: topic.id,
          question: mcq.question.trim(),
          optionA: mcq.optionA.trim(),
          optionB: mcq.optionB.trim(),
          optionC: mcq.optionC.trim(),
          optionD: mcq.optionD.trim(),
          correctOption,
          explanation: mcq.explanation.trim() || null,
        });
      }

      pushToast('Saved successfully', 'success');
      resetForm();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Save failed';
      pushToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const addQuestion = () => setMcqs((current) => [...current, { ...EMPTY_QUESTION }]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{config.title}</h1>
        <p className="mt-2 text-sm text-slate-500">{config.description}</p>
      </div>

      <div className="grid gap-6 rounded-[16px] border border-slate-200 bg-white p-5 shadow-soft">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Topic Name</span>
            <Input value={topicName} onChange={(e) => { setTopicName(e.target.value); setErrors((prev) => { const { ...rest } = prev; delete rest.topicName; return rest; }); }} placeholder="Enter topic name" />
            {errors.topicName ? <p className="text-xs text-red-500">{errors.topicName}</p> : null}
          </label>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Description</span>
            <TextArea value={description} onChange={(e) => { setDescription(e.target.value); setErrors((prev) => { const { ...rest } = prev; delete rest.description; return rest; }); }} placeholder="Topic description" />
            {errors.description ? <p className="text-xs text-red-500">{errors.description}</p> : null}
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Upload Notes PDF</span>
            <Input
              type="file"
              accept="application/pdf"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setNotesPdf(await fileToDataUrl(file));
                setPdfFileName(file.name);
                setErrors((prev) => { const { ...rest } = prev; delete rest.notesPdf; return rest; });
              }}
            />
            {pdfFileName ? <p className="text-xs text-slate-500">Selected: {pdfFileName}</p> : null}
            {errors.notesPdf ? <p className="text-xs text-red-500">{errors.notesPdf}</p> : null}
          </label>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">MCQ Section</h2>
            <Button variant="secondary" onClick={addQuestion}>+ Add Another Question</Button>
          </div>
          {errors.mcqs ? <p className="text-xs text-red-500">{errors.mcqs}</p> : null}
          {mcqs.map((question, index) => (
            <div key={index} className="grid gap-4 rounded-[16px] border border-slate-200 p-4 md:grid-cols-2">
              <label className="space-y-1 md:col-span-2">
                <span className="text-sm font-medium text-slate-700">Question {index + 1}</span>
                <TextArea value={question.question} onChange={(e) => updateQuestion(index, 'question', e.target.value, setMcqs)} placeholder="Enter question" />
              </label>
              <Input value={question.optionA} onChange={(e) => updateQuestion(index, 'optionA', e.target.value, setMcqs)} placeholder="Option A" />
              <Input value={question.optionB} onChange={(e) => updateQuestion(index, 'optionB', e.target.value, setMcqs)} placeholder="Option B" />
              <Input value={question.optionC} onChange={(e) => updateQuestion(index, 'optionC', e.target.value, setMcqs)} placeholder="Option C" />
              <Input value={question.optionD} onChange={(e) => updateQuestion(index, 'optionD', e.target.value, setMcqs)} placeholder="Option D" />
              <Select value={question.correctOption} onChange={(e) => updateQuestion(index, 'correctOption', e.target.value, setMcqs)}>
                <option value="optionA">Correct Answer - Option A</option>
                <option value="optionB">Correct Answer - Option B</option>
                <option value="optionC">Correct Answer - Option C</option>
                <option value="optionD">Correct Answer - Option D</option>
              </Select>
              <TextArea value={question.explanation} onChange={(e) => updateQuestion(index, 'explanation', e.target.value, setMcqs)} placeholder="Explanation (optional)" />
            </div>
          ))}
        </div>

        <div>
          <Button onClick={submit} disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</Button>
        </div>
      </div>
    </div>
  );
}

function updateQuestion(index: number, key: keyof QuestionDraft, value: string, setMcqs: Dispatch<SetStateAction<QuestionDraft[]>>) {
  setMcqs((current) => current.map((question, questionIndex) => (questionIndex === index ? { ...question, [key]: value } : question)));
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
