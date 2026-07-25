import { useParams, Link } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../components/common/ToastHost';
import { usePreparation, type TopicItem, type NoteItem, type McqItem, type VideoItem, type PyqItem, type MockTestItem, type DashboardData, type AnalyticsData, type CategorySettings } from './usePreparation';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { Select } from '../../components/ui/Select';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'topics', label: 'Topics' },
  { key: 'notes', label: 'Notes' },
  { key: 'mcqs', label: 'MCQs' },
  { key: 'videos', label: 'Videos' },
  { key: 'pyqs', label: 'PYQs' },
  { key: 'mock-tests', label: 'Mock Tests' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'settings', label: 'Settings' },
];

const CATEGORY_LABELS: Record<string, string> = {
  gate: 'GATE', aptitude: 'Aptitude', interview: 'Interview', technical: 'Technical',
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft"><p className="text-2xl font-bold text-slate-900">{value}</p><p className="text-xs text-slate-500 mt-0.5">{label}</p>{sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}</div>;
}

function EmptyState({ icon, title, desc, action, onAction }: { icon?: string; title: string; desc: string; action?: string; onAction?: () => void }) {
  return <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center"><div className="text-4xl mb-3">{icon || '📂'}</div><p className="text-lg font-medium text-slate-700">{title}</p><p className="text-sm text-slate-400 mt-1 mb-4">{desc}</p>{action && onAction && <Button onClick={onAction}>{action}</Button>}</div>;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = () => reject(r.error); r.readAsDataURL(file); });
}

export default function PreparationModulePage() {
  const { category } = useParams<{ category: string }>();
  const api = usePreparation(category!);
  const { pushToast } = useToast();
  const [tab, setTab] = useState('dashboard');
  const [localLoading, setLocalLoading] = useState(false);

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [mcqs, setMcqs] = useState<McqItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [pyqs, setPyqs] = useState<PyqItem[]>([]);
  const [mockTests, setMockTests] = useState<MockTestItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [settings, setSettings] = useState<CategorySettings | null>(null);

  const [confirm, setConfirm] = useState<{ id: string; action: string } | null>(null);

  const name = CATEGORY_LABELS[category || ''] || category?.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || '';

  const load = useCallback(async <T,>(fn: () => Promise<T>, setter: (v: T) => void) => {
    setLocalLoading(true);
    try { setter(await fn()); } catch { /* silent */ }
    finally { setLocalLoading(false); }
  }, []);

  const loaders: Record<string, () => void> = {
    dashboard: () => load(api.getDashboard, setDashboard),
    topics: () => load(api.getTopics, (d) => setTopics(d.items)),
    notes: () => load(api.getNotes, (d) => setNotes(d.items)),
    mcqs: () => load(api.getMcqs, (d) => setMcqs(d.items)),
    videos: () => load(api.getVideos, (d) => setVideos(d.items)),
    pyqs: () => load(api.getPyqs, (d) => setPyqs(d.items)),
    'mock-tests': () => load(api.getMockTests, (d) => setMockTests(d.items)),
    analytics: () => load(api.getAnalytics, setAnalytics),
    settings: () => load(api.getSettings, setSettings),
  };

  useEffect(() => { loaders[tab]?.(); }, [tab]);

  const onTabChange = (k: string) => setTab(k);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">{name} Preparation</h1>
        {localLoading && <span className="text-xs text-slate-400 animate-pulse">Loading...</span>}
      </div>

      <div className="flex gap-1 border-b border-slate-200 pb-2 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => onTabChange(t.key)}
            className={`whitespace-nowrap px-2.5 sm:px-3 py-1.5 text-sm rounded-lg transition-colors ${tab === t.key ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >{t.label}</button>
        ))}
      </div>

      {tab === 'dashboard' && <DashboardSection data={dashboard} loading={localLoading} />}
      {tab === 'topics' && <TopicsSection items={topics} api={api} pushToast={pushToast} onConfirm={setConfirm} category={category} />}
      {tab === 'notes' && <NotesSection items={notes} api={api} pushToast={pushToast} onConfirm={setConfirm} />}
      {tab === 'mcqs' && <McqsSection items={mcqs} api={api} pushToast={pushToast} onConfirm={setConfirm} />}
      {tab === 'videos' && <VideosSection items={videos} api={api} pushToast={pushToast} onConfirm={setConfirm} />}
      {tab === 'pyqs' && <PyqsSection items={pyqs} api={api} pushToast={pushToast} onConfirm={setConfirm} />}
      {tab === 'mock-tests' && <MockTestsSection items={mockTests} api={api} pushToast={pushToast} onConfirm={setConfirm} />}
      {tab === 'analytics' && <AnalyticsSection data={analytics} loading={localLoading} />}
      {tab === 'settings' && settings && <SettingsSection data={settings} api={api} pushToast={pushToast} />}

      <ConfirmDialog open={!!confirm} title="Confirm Delete" message="Are you sure you want to delete this item? This action cannot be undone." confirmLabel="Delete" variant="danger"
        onConfirm={async () => {
          if (!confirm) return;
          try {
            const map: Record<string, (id: string) => Promise<any>> = { topic: api.deleteTopic, note: api.deleteNote, mcq: api.deleteMcq, video: api.deleteVideo, pyq: api.deletePyq, mockTest: api.deleteMockTest };
            await map[confirm.action](confirm.id);
            pushToast('Deleted successfully', 'success');
            loaders[tab]?.();
          } catch (err: any) { pushToast(err?.response?.data?.message || err?.message || 'Delete failed', 'error'); }
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

/* ===== DASHBOARD ===== */
function DashboardSection({ data, loading }: { data: DashboardData | null; loading: boolean }) {
  if (loading && !data) return <EmptyState icon="⏳" title="Loading..." desc="Fetching dashboard data" />;
  if (!data) return <EmptyState icon="📊" title="No Data Yet" desc="Data will appear here once you add content." />;
  return <div className="space-y-6">
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard label="Total Topics" value={data.topics} />
      <StatCard label="Total Notes" value={data.notes} />
      <StatCard label="Total PDFs" value={data.pdfs} />
      <StatCard label="Total MCQs" value={data.mcqs} />
      <StatCard label="Total Videos" value={data.videos} />
      <StatCard label="Total PYQs" value={data.pyqs} />
      <StatCard label="Mock Tests" value={data.mockTests} />
      <StatCard label="User Attempts" value={data.totalAttempts} />
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <StatCard label="Average Score" value={data.averageScore.toFixed(1)} />
      <StatCard label="Highest Score" value={data.highestScore} />
      <StatCard label="Lowest Score" value={data.lowestScore} />
    </div>
    {data.topTopic && <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft"><p className="text-sm font-semibold text-slate-700">Most Popular Topic</p><p className="text-lg font-bold text-slate-900 mt-1">{data.topTopic.name}</p><p className="text-xs text-slate-400">{data.topTopic._count.studyMaterials} notes · {data.topTopic._count.mcqQuestions} MCQs</p></div>}
    {data.recentUploads.length > 0 && <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft"><p className="text-sm font-semibold text-slate-700 mb-2">Recent Uploads</p><div className="space-y-1.5">{data.recentUploads.map((r, i) => <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-sm"><span className="text-slate-700">{r.title}</span><span className="text-xs text-slate-400">{r.type} · {fmtDate(r.createdAt)}</span></div>)}</div></div>}
  </div>;
}

/* ===== TOPICS ===== */
function TopicsSection({ items, api, pushToast, onConfirm, category }: { items: TopicItem[]; api: ReturnType<typeof usePreparation>; pushToast: any; onConfirm: (c: { id: string; action: string }) => void; category?: string }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [busy, setBusy] = useState(false);

  const filtered = items.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const resetForm = () => { setName(''); setDesc(''); setEditId(null); setShowForm(false); };

  const submit = async () => {
    if (!name.trim()) return;
    setBusy(true);
      try {
        if (editId) { await api.updateTopic(editId, { name: name.trim(), description: desc.trim() || null }); pushToast('Topic updated', 'success'); }
        else { await api.createTopic({ name: name.trim(), description: desc.trim() || null }); pushToast('Topic created', 'success'); }
        resetForm(); const { getTopics } = api; const d = await getTopics(); (window as any).__topicRefresh?.(d.items);
      } catch (err: any) { pushToast(err?.response?.data?.message || err?.message || 'Failed', 'error'); }
    finally { setBusy(false); }
  };

  const startEdit = (t: TopicItem) => { setName(t.name); setDesc(t.description || ''); setEditId(t.id); setShowForm(true); };

  return <div className="space-y-4">
    <div className="flex flex-col sm:flex-row items-start gap-3">
      <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search topics..." className="w-full sm:max-w-xs" />
      <Button onClick={() => { resetForm(); setShowForm(true); }}>+ Create Topic</Button>
    </div>

    {showForm && <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft space-y-3">
      <p className="text-sm font-semibold text-slate-700">{editId ? 'Edit Topic' : 'Create Topic'}</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Topic name" className="w-full sm:max-w-xs" />
        <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description (optional)" className="w-full sm:max-w-sm" />
      </div>
      <div className="flex gap-2">
        <Button onClick={submit} disabled={busy || !name.trim()}>{busy ? 'Saving...' : editId ? 'Update' : 'Create'}</Button>
        <Button variant="secondary" onClick={resetForm}>Cancel</Button>
      </div>
    </div>}

    {paged.length === 0 && !showForm && <EmptyState icon="📚" title="No Topics Found" desc="Create your first topic to get started." action="Create Topic" onAction={() => { resetForm(); setShowForm(true); }} />}

    {paged.length > 0 && <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm"><thead><tr className="bg-slate-50 text-left text-slate-600">
        <th className="whitespace-nowrap px-4 py-3 font-medium">Topic Name</th><th className="whitespace-nowrap px-4 py-3 font-medium hidden md:table-cell">Description</th>
        <th className="whitespace-nowrap px-4 py-3 font-medium text-center">Notes</th><th className="whitespace-nowrap px-4 py-3 font-medium text-center">MCQs</th>
        <th className="whitespace-nowrap px-4 py-3 font-medium text-center hidden sm:table-cell">Videos</th><th className="whitespace-nowrap px-4 py-3 font-medium text-center">Actions</th>
      </tr></thead><tbody>
        {paged.map((t) => <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50">
          <td className="px-4 py-3 font-medium text-slate-900"><Link to={`/preparation/${category}/topics/${t.id}`} className="text-indigo-600 hover:underline">{t.name}</Link></td>
          <td className="px-4 py-3 text-slate-500 max-w-[160px] truncate hidden md:table-cell">{t.description || '—'}</td>
          <td className="px-4 py-3 text-center">{t._count.studyMaterials}</td>
          <td className="px-4 py-3 text-center">{t._count.mcqQuestions}</td>
          <td className="px-4 py-3 text-center hidden sm:table-cell">{t._count.videos}</td>
          <td className="px-4 py-3 text-center"><div className="flex gap-2 justify-center flex-wrap">
            <button onClick={() => startEdit(t)} className="text-xs text-indigo-600 hover:underline">Edit</button>
            <button onClick={() => onConfirm({ id: t.id, action: 'topic' })} className="text-xs text-red-500 hover:underline">Delete</button>
          </div></td>
        </tr>)}
      </tbody></table>
    </div>}

    {totalPages > 1 && <div className="flex justify-center gap-2 mt-4">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button key={p} onClick={() => setPage(p)} className={`px-3 py-1 text-sm rounded ${page === p ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}>{p}</button>
      ))}
    </div>}
  </div>;
}

/* ===== NOTES ===== */
function NotesSection({ items, api, pushToast, onConfirm }: { items: NoteItem[]; api: ReturnType<typeof usePreparation>; pushToast: any; onConfirm: (c: { id: string; action: string }) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [tags, setTags] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!title.trim()) return;
    setBusy(true);
    try {
      const body: any = { title: title.trim(), content: content.trim() || null, tags: tags.trim() || null, type: pdfFile ? 'PDF' : 'NOTE' };
      if (pdfFile) body.externalUrl = await fileToDataUrl(pdfFile);
      await api.createNote(body);
      pushToast('Note created', 'success');
      setTitle(''); setContent(''); setPdfFile(null); setTags(''); setShowForm(false);
      const d = await api.getNotes(); (window as any).__noteRefresh?.(d.items);
    } catch (err: any) { pushToast(err?.response?.data?.message || err?.message || 'Failed', 'error'); }
    finally { setBusy(false); }
  };

  return <div className="space-y-4">
    <div className="flex gap-3"><Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ Add Note/PDF'}</Button></div>

    {showForm && <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft space-y-3">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
      <TextArea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Description (optional)" />
      <div><label className="text-xs text-slate-500 block mb-1">Upload PDF (optional)</label><Input type="file" accept=".pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} /></div>
      <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags (comma separated)" />
      <Button onClick={submit} disabled={busy || !title.trim()}>{busy ? 'Uploading...' : 'Save'}</Button>
    </div>}

    {items.length === 0 && !showForm && <EmptyState icon="📝" title="No Notes Yet" desc="Add notes or upload PDFs for this module." action="Add Note" onAction={() => setShowForm(true)} />}

    {items.length > 0 && <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm"><thead><tr className="bg-slate-50 text-left text-slate-600">
        <th className="whitespace-nowrap px-4 py-3 font-medium">Title</th><th className="whitespace-nowrap px-4 py-3 font-medium hidden sm:table-cell">Topic</th>
        <th className="whitespace-nowrap px-4 py-3 font-medium">Type</th><th className="whitespace-nowrap px-4 py-3 font-medium hidden sm:table-cell">Date</th><th className="whitespace-nowrap px-4 py-3 font-medium text-center">Actions</th>
      </tr></thead><tbody>
        {items.map((n) => <tr key={n.id} className="border-t border-slate-100 hover:bg-slate-50">
          <td className="px-4 py-3 font-medium text-slate-900 max-w-[200px] truncate">{n.title}</td>
          <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{n.topic?.name || '—'}</td>
          <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded ${n.type === 'PDF' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>{n.type}</span></td>
          <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{fmtDate(n.createdAt)}</td>
          <td className="px-4 py-3 text-center"><div className="flex gap-2 justify-center">
            {n.externalUrl && <a href={n.externalUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline">Preview</a>}
            <button onClick={() => onConfirm({ id: n.id, action: 'note' })} className="text-xs text-red-500 hover:underline">Delete</button>
          </div></td>
        </tr>)}
      </tbody></table>
    </div>}
  </div>;
}

/* ===== MCQs ===== */
function McqsSection({ items, api, pushToast, onConfirm }: { items: McqItem[]; api: ReturnType<typeof usePreparation>; pushToast: any; onConfirm: (c: { id: string; action: string }) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [question, setQuestion] = useState(''); const [a, setA] = useState(''); const [b, setB] = useState(''); const [c, setC] = useState(''); const [d, setD] = useState('');
  const [correct, setCorrect] = useState('A'); const [explanation, setExplanation] = useState(''); const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD' | ''>('');
  const [busy, setBusy] = useState(false);

  const resetForm = () => { setQuestion(''); setA(''); setB(''); setC(''); setD(''); setCorrect('A'); setExplanation(''); setDifficulty(''); setEditId(null); setShowForm(false); };

  const submit = async () => {
    if (!question.trim() || !a.trim() || !b.trim() || !c.trim() || !d.trim()) return;
    setBusy(true);
    try {
      const body = { question: question.trim(), optionA: a.trim(), optionB: b.trim(), optionC: c.trim(), optionD: d.trim(), correctOption: correct, explanation: explanation.trim() || null, difficulty: difficulty || null };
      if (editId) { await api.updateMcq(editId, body); pushToast('MCQ updated', 'success'); }
      else { await api.createMcq(body); pushToast('MCQ created', 'success'); }
      resetForm(); const data = await api.getMcqs(); (window as any).__mcqRefresh?.(data.items);
    } catch (err: any) { pushToast(err?.response?.data?.message || err?.message || 'Failed', 'error'); }
    finally { setBusy(false); }
  };

  const startEdit = (m: McqItem) => { setQuestion(m.question); setA(m.optionA); setB(m.optionB); setC(m.optionC); setD(m.optionD); setCorrect(m.correctOption || 'A'); setExplanation(m.explanation || ''); setDifficulty((m.difficulty as any) || ''); setEditId(m.id); setShowForm(true); };

  return <div className="space-y-4">
    <div className="flex gap-3"><Button onClick={() => { resetForm(); setShowForm(true); }}>+ Add MCQ</Button></div>

    {showForm && <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft space-y-3">
      <p className="text-sm font-semibold text-slate-700">{editId ? 'Edit MCQ' : 'Add MCQ'}</p>
      <TextArea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Question" className="min-h-[60px]" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><Input value={a} onChange={(e) => setA(e.target.value)} placeholder="Option A" /><Input value={b} onChange={(e) => setB(e.target.value)} placeholder="Option B" /><Input value={c} onChange={(e) => setC(e.target.value)} placeholder="Option C" /><Input value={d} onChange={(e) => setD(e.target.value)} placeholder="Option D" /></div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={correct} onChange={(e) => setCorrect(e.target.value)} className="w-full sm:max-w-[200px]"><option value="A">Correct: A</option><option value="B">Correct: B</option><option value="C">Correct: C</option><option value="D">Correct: D</option></Select>
        <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)} className="w-full sm:max-w-[150px]"><option value="">Any Difficulty</option><option value="EASY">Easy</option><option value="MEDIUM">Medium</option><option value="HARD">Hard</option></Select>
      </div>
      <TextArea value={explanation} onChange={(e) => setExplanation(e.target.value)} placeholder="Explanation (optional)" className="min-h-[50px]" />
      <div className="flex gap-2"><Button onClick={submit} disabled={busy || !question.trim()}>{busy ? 'Saving...' : editId ? 'Update' : 'Create'}</Button><Button variant="secondary" onClick={resetForm}>Cancel</Button></div>
    </div>}

    {items.length === 0 && !showForm && <EmptyState icon="❓" title="No MCQs Yet" desc="Add multiple-choice questions for this module." action="Add MCQ" onAction={() => { resetForm(); setShowForm(true); }} />}

    {items.length > 0 && <div className="space-y-2">
      {items.map((m) => <div key={m.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4"><div className="flex-1"><p className="text-sm font-medium text-slate-900">{m.question}</p>
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500"><span className={m.correctOption === 'A' ? 'font-bold text-green-600' : ''}>A: {m.optionA}</span><span className={m.correctOption === 'B' ? 'font-bold text-green-600' : ''}>B: {m.optionB}</span><span className={m.correctOption === 'C' ? 'font-bold text-green-600' : ''}>C: {m.optionC}</span><span className={m.correctOption === 'D' ? 'font-bold text-green-600' : ''}>D: {m.optionD}</span></div>
          {m.difficulty && <span className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded ${m.difficulty === 'EASY' ? 'bg-green-50 text-green-600' : m.difficulty === 'HARD' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>{m.difficulty}</span>}
        </div>
        <div className="flex gap-2 shrink-0 mt-2 sm:mt-0"><button onClick={() => startEdit(m)} className="text-xs text-indigo-600 hover:underline">Edit</button><button onClick={() => onConfirm({ id: m.id, action: 'mcq' })} className="text-xs text-red-500 hover:underline">Delete</button></div></div>
      </div>)}
    </div>}
  </div>;
}

/* ===== VIDEOS ===== */
function VideosSection({ items, api, pushToast, onConfirm }: { items: VideoItem[]; api: ReturnType<typeof usePreparation>; pushToast: any; onConfirm: (c: { id: string; action: string }) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState(''); const [url, setUrl] = useState(''); const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!title.trim() || !url.trim()) return;
    setBusy(true);
    try { await api.createVideo({ title: title.trim(), youtubeUrl: url.trim() }); pushToast('Video added', 'success'); setTitle(''); setUrl(''); setShowForm(false); } catch (err: any) { pushToast(err?.response?.data?.message || err?.message || 'Failed', 'error'); }
    finally { setBusy(false); }
  };

  const getYtId = (u: string) => { const m = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/); return m ? m[1] : null; };

  return <div className="space-y-4">
    <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ Add Video'}</Button>
    {showForm && <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft space-y-3">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Video title" />
      <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="YouTube URL" />
      <Button onClick={submit} disabled={busy || !title.trim() || !url.trim()}>{busy ? 'Adding...' : 'Add Video'}</Button>
    </div>}
    {items.length === 0 && !showForm && <EmptyState icon="🎬" title="No Videos Yet" desc="Add YouTube videos for this module." action="Add Video" onAction={() => setShowForm(true)} />}
    {items.length > 0 && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map((v) => { const ytId = getYtId(v.youtubeUrl); return <div key={v.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-soft">
        {ytId ? <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="" className="w-full h-40 object-cover" /> : <div className="w-full h-40 bg-slate-100 flex items-center justify-center text-slate-400 text-sm">No thumbnail</div>}
        <div className="p-3"><p className="text-sm font-medium text-slate-900 truncate">{v.title}</p><p className="text-xs text-slate-400 mt-1">{v.topic?.name || '—'}</p><div className="flex gap-2 mt-2"><button onClick={() => onConfirm({ id: v.id, action: 'video' })} className="text-xs text-red-500 hover:underline">Delete</button></div></div>
      </div>;})}
    </div>}
  </div>;
}

/* ===== PYQs ===== */
function PyqsSection({ items, api, pushToast, onConfirm }: { items: PyqItem[]; api: ReturnType<typeof usePreparation>; pushToast: any; onConfirm: (c: { id: string; action: string }) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear()); const [title, setTitle] = useState(''); const [pdfFile, setPdfFile] = useState<File | null>(null); const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!title.trim() || !year) return;
    setBusy(true);
    try {
      const body: any = { year: Number(year), title: title.trim() };
      if (pdfFile) body.pdfUrl = await fileToDataUrl(pdfFile);
      await api.createPyq(body); pushToast('PYQ added', 'success'); setTitle(''); setYear(new Date().getFullYear()); setPdfFile(null); setShowForm(false);
    } catch (err: any) { pushToast(err?.response?.data?.message || err?.message || 'Failed', 'error'); }
    finally { setBusy(false); }
  };

  return <div className="space-y-4">
    <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ Add PYQ'}</Button>
    {showForm && <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft space-y-3">
      <div className="flex flex-col sm:flex-row gap-3"><Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} placeholder="Year" className="w-full sm:max-w-[120px]" /><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title / Subject" className="flex-1" /></div>
      <Input type="file" accept=".pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} />
      <Button onClick={submit} disabled={busy || !title.trim()}>{busy ? 'Adding...' : 'Add'}</Button>
    </div>}
    {items.length === 0 && !showForm && <EmptyState icon="📄" title="No PYQs Yet" desc="Upload previous year question papers." action="Add PYQ" onAction={() => setShowForm(true)} />}
    {items.length > 0 && <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm"><thead><tr className="bg-slate-50 text-left text-slate-600">
        <th className="whitespace-nowrap px-4 py-3 font-medium">Year</th><th className="whitespace-nowrap px-4 py-3 font-medium">Title</th><th className="whitespace-nowrap px-4 py-3 font-medium hidden sm:table-cell">PDF</th><th className="whitespace-nowrap px-4 py-3 font-medium text-center">Actions</th>
      </tr></thead><tbody>
        {items.map((p) => <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
          <td className="px-4 py-3 font-semibold text-slate-900">{p.year}</td>
          <td className="px-4 py-3 text-slate-700">{p.title}</td>
          <td className="px-4 py-3 hidden sm:table-cell">{p.pdfUrl ? <a href={p.pdfUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline">Preview</a> : <span className="text-xs text-slate-400">No file</span>}</td>
          <td className="px-4 py-3 text-center"><button onClick={() => onConfirm({ id: p.id, action: 'pyq' })} className="text-xs text-red-500 hover:underline">Delete</button></td>
        </tr>)}
      </tbody></table>
    </div>}
  </div>;
}

/* ===== MOCK TESTS ===== */
function MockTestsSection({ items, api, pushToast, onConfirm }: { items: MockTestItem[]; api: ReturnType<typeof usePreparation>; pushToast: any; onConfirm: (c: { id: string; action: string }) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState(''); const [desc, setDesc] = useState(''); const [duration, setDuration] = useState(60); const [negMarking, setNegMarking] = useState(0); const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!title.trim()) return;
    setBusy(true);
    try { await api.createMockTest({ title: title.trim(), description: desc.trim(), durationMinutes: duration, negativeMarking: negMarking }); pushToast('Mock test created', 'success'); setTitle(''); setDesc(''); setDuration(60); setNegMarking(0); setShowForm(false); } catch (err: any) { pushToast(err?.response?.data?.message || err?.message || 'Failed', 'error'); }
    finally { setBusy(false); }
  };

  return <div className="space-y-4">
    <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ Create Mock Test'}</Button>
    {showForm && <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft space-y-3">
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Test name" />
      <TextArea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description" />
      <div className="flex flex-col sm:flex-row gap-3"><label className="space-y-1"><span className="text-xs text-slate-500">Duration (min)</span><Input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full sm:max-w-[140px]" /></label><label className="space-y-1"><span className="text-xs text-slate-500">Negative Marking</span><Input type="number" step="0.5" value={negMarking} onChange={(e) => setNegMarking(Number(e.target.value))} className="w-full sm:max-w-[140px]" /></label></div>
      <Button onClick={submit} disabled={busy || !title.trim()}>{busy ? 'Creating...' : 'Create'}</Button>
    </div>}
    {items.length === 0 && !showForm && <EmptyState icon="📝" title="No Mock Tests Yet" desc="Create timed mock tests for students." action="Create Test" onAction={() => setShowForm(true)} />}
    {items.length > 0 && <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm"><thead><tr className="bg-slate-50 text-left text-slate-600">
        <th className="whitespace-nowrap px-4 py-3 font-medium">Test Name</th><th className="whitespace-nowrap px-4 py-3 font-medium hidden sm:table-cell">Duration</th>
        <th className="whitespace-nowrap px-4 py-3 font-medium text-center hidden sm:table-cell">Questions</th><th className="whitespace-nowrap px-4 py-3 font-medium text-center">Status</th><th className="whitespace-nowrap px-4 py-3 font-medium text-center">Actions</th>
      </tr></thead><tbody>
        {items.map((m) => <tr key={m.id} className="border-t border-slate-100 hover:bg-slate-50">
          <td className="px-4 py-3 font-medium text-slate-900">{m.title}</td>
          <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{m.durationMinutes} min</td>
          <td className="px-4 py-3 text-center hidden sm:table-cell">{m._count.questions}</td>
          <td className="px-4 py-3 text-center"><span className={`text-xs px-2 py-0.5 rounded ${m.publishStatus === 'PUBLISHED' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{m.publishStatus}</span></td>
          <td className="px-4 py-3 text-center"><button onClick={() => onConfirm({ id: m.id, action: 'mockTest' })} className="text-xs text-red-500 hover:underline">Delete</button></td>
        </tr>)}
      </tbody></table>
    </div>}
  </div>;
}

/* ===== ANALYTICS ===== */
function AnalyticsSection({ data, loading }: { data: AnalyticsData | null; loading: boolean }) {
  if (loading && !data) return <EmptyState icon="⏳" title="Loading..." desc="Fetching analytics" />;
  if (!data) return <EmptyState icon="📈" title="No Analytics Yet" desc="Data will appear once students start attempting tests." />;
  return <div className="space-y-6">
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard label="Total Attempts" value={data.totalAttempts} />
      <StatCard label="Average Score" value={data.averageScore.toFixed(1)} />
      <StatCard label="Highest Score" value={data.highestScore} />
      <StatCard label="Lowest Score" value={data.lowestScore} />
      <StatCard label="Completion Rate" value={`${data.completionRate}%`} />
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      {data.topTopic && <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft"><p className="text-sm font-semibold text-slate-700">Top Topic</p><p className="text-lg font-bold text-slate-900 mt-1">{data.topTopic.name}</p><p className="text-xs text-slate-400">{data.topTopic._count.studyMaterials} notes · {data.topTopic._count.mcqQuestions} MCQs</p></div>}
      {data.mostAttemptedTest && <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft"><p className="text-sm font-semibold text-slate-700">Most Attempted Test</p><p className="text-lg font-bold text-slate-900 mt-1">{data.mostAttemptedTest.title}</p><p className="text-xs text-slate-400">{data.mostAttemptedTest._count.results} attempts</p></div>}
      {!data.topTopic && <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-400">No topic data available</div>}
      {!data.mostAttemptedTest && <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-400">No test data available</div>}
    </div>
    {data.popularNotes.length > 0 && <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft"><p className="text-sm font-semibold text-slate-700 mb-2">Popular Notes</p><div className="space-y-1.5">{data.popularNotes.map((n, i) => <div key={i} className="flex flex-col sm:flex-row sm:justify-between text-sm"><span className="text-slate-700">{n.title}</span><span className="text-xs text-slate-400">{n.type}</span></div>)}</div></div>}
  </div>;
}

/* ===== SETTINGS ===== */
const GRADIENT_OPTIONS = [
  { label: 'Purple', value: 'from-violet-500 to-purple-700' },
  { label: 'Blue', value: 'from-blue-500 to-indigo-700' },
  { label: 'Green', value: 'from-emerald-400 to-teal-600' },
  { label: 'Orange', value: 'from-orange-400 to-amber-600' },
  { label: 'Teal', value: 'from-teal-400 to-cyan-600' },
  { label: 'Pink', value: 'from-pink-400 to-rose-600' },
  { label: 'Cyan', value: 'from-cyan-400 to-blue-600' },
  { label: 'Indigo', value: 'from-indigo-500 to-violet-600' },
];

const ICON_OPTIONS = ['Brain', 'Laptop', 'Book', 'Database', 'Terminal', 'Code', 'Globe', 'Calculator', 'Microscope', 'Cloud', 'Cpu', 'Server', 'Network', 'Shield', 'Lock', 'Key', 'Award', 'Star', 'Heart', 'Zap'];

function SettingsSection({ data, api, pushToast }: { data: CategorySettings; api: ReturnType<typeof usePreparation>; pushToast: any }) {
  const [name, setName] = useState(data.name);
  const [description, setDescription] = useState(data.description || '');
  const [isEnabled, setIsEnabled] = useState(data.isEnabled);
  const [featured, setFeatured] = useState(data.featured);
  const [displayOrder, setDisplayOrder] = useState(data.displayOrder);
  const [themeColor, setThemeColor] = useState(data.themeColor || '');
  const [gradientColor, setGradientColor] = useState(data.gradientColor || 'from-violet-500 to-purple-700');
  const [icon, setIcon] = useState(data.icon || 'Book');
  const [coverImage, setCoverImage] = useState(data.coverImage || '');
  const [imageUploading, setImageUploading] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(data.name); setDescription(data.description || ''); setIsEnabled(data.isEnabled);
    setFeatured(data.featured); setDisplayOrder(data.displayOrder);
    setThemeColor(data.themeColor || ''); setGradientColor(data.gradientColor || 'from-violet-500 to-purple-700');
    setIcon(data.icon || 'Book'); setCoverImage(data.coverImage || '');
  }, [data]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { pushToast('Image must be under 5MB', 'error'); return; }
    setImageUploading(true);
    try {
      const updated = await api.uploadCategoryImage(file);
      setCoverImage(updated.coverImage || '');
      pushToast('Cover image uploaded', 'success');
    } catch (err: any) { pushToast(err?.response?.data?.message || 'Upload failed', 'error'); }
    finally { setImageUploading(false); }
  };

  const handleRemoveImage = async () => {
    try {
      const updated = await api.deleteCategoryImage();
      setCoverImage('');
      pushToast('Cover image removed', 'success');
    } catch (err: any) { pushToast(err?.response?.data?.message || 'Failed', 'error'); }
  };

  const getPreviewUrl = (url: string) => url.startsWith('http') ? url : window.location.origin + url;

  return <div className="grid lg:grid-cols-[1fr_400px] gap-6">
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft space-y-4">
        <p className="text-sm font-semibold text-slate-700">Basic Information</p>
        <label className="space-y-1"><span className="text-xs text-slate-500">Category Name</span><Input value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="space-y-1"><span className="text-xs text-slate-500">Description</span><TextArea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></label>
        <div className="flex flex-wrap gap-4"><label className="flex items-center gap-2"><input type="checkbox" checked={isEnabled} onChange={(e) => setIsEnabled(e.target.checked)} className="rounded border-slate-300" /><span className="text-sm text-slate-700">Enabled</span></label><label className="flex items-center gap-2"><input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="rounded border-slate-300" /><span className="text-sm text-slate-700">Featured</span></label></div>
        <label className="space-y-1"><span className="text-xs text-slate-500">Display Order</span><Input type="number" value={displayOrder} onChange={(e) => setDisplayOrder(Number(e.target.value))} className="max-w-[120px]" /></label>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft space-y-4">
        <p className="text-sm font-semibold text-slate-700">Cover Image</p>
        {coverImage ? (
          <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden bg-slate-100 aspect-video max-w-md">
              <img src={getPreviewUrl(coverImage)} alt="Cover" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                {imageUploading ? 'Uploading...' : 'Replace Image'}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} className="hidden" disabled={imageUploading} />
              </label>
              <button onClick={handleRemoveImage} disabled={imageUploading} className="px-4 py-2 rounded-xl border border-red-200 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">Remove</button>
            </div>
            <p className="text-[10px] text-slate-400">Recommended: 1600 × 900px · Max 5MB · JPEG, PNG, WebP</p>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-8 cursor-pointer hover:border-brand-300 hover:bg-slate-50 transition-colors">
            {imageUploading ? <><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /><p className="text-sm text-slate-500 mt-2">Uploading...</p></> : <><div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2"><svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div><p className="text-sm font-medium text-slate-600">Upload Cover Image</p><p className="text-xs text-slate-400 mt-1">JPEG, PNG, WebP · Max 5MB</p></>}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} className="hidden" disabled={imageUploading} />
          </label>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft space-y-4">
        <p className="text-sm font-semibold text-slate-700">Theme</p>
        <label className="space-y-1"><span className="text-xs text-slate-500">Custom HEX Color</span><div className="flex items-center gap-2"><input type="color" value={themeColor || '#6366f1'} onChange={(e) => setThemeColor(e.target.value)} className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer shrink-0" /><Input value={themeColor} onChange={(e) => setThemeColor(e.target.value)} placeholder="#6366f1" className="flex-1" /></div></label>
        <div className="space-y-2"><span className="text-xs text-slate-500">Gradient Color</span>
          <div className="flex flex-wrap gap-2">
            {GRADIENT_OPTIONS.map((g) => (
              <button key={g.value} onClick={() => setGradientColor(g.value)}
                className={`w-8 h-8 rounded-lg bg-gradient-to-br ${g.value} ${gradientColor === g.value ? 'ring-2 ring-offset-2 ring-brand-500' : ''}`} title={g.label}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft space-y-3">
        <p className="text-sm font-semibold text-slate-700">Icon</p>
        <div className="flex flex-wrap gap-2">
          {ICON_OPTIONS.map((ic) => (
            <button key={ic} onClick={() => setIcon(ic)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${icon === ic ? 'bg-brand-50 text-brand-700 border-brand-300' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
            >{ic}</button>
          ))}
        </div>
      </div>

      <Button onClick={async () => { setBusy(true); try { await api.updateSettings({ name, description: description || null, isEnabled, featured, displayOrder, themeColor: themeColor || null, gradientColor, icon }); pushToast('Settings saved', 'success'); } catch (err: any) { pushToast(err?.response?.data?.message || err?.message || 'Failed', 'error'); } finally { setBusy(false); } }} disabled={busy}>{busy ? 'Saving...' : 'Save All Settings'}</Button>
    </div>

    <div className="space-y-5">
      <p className="text-sm font-semibold text-slate-700">Live Preview</p>
      <div className="rounded-xl border border-slate-200 bg-white shadow-soft overflow-hidden">
        <div className={`relative h-40 bg-gradient-to-br p-5 ${gradientColor}`} style={{ backgroundImage: coverImage ? `url(${getPreviewUrl(coverImage)})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>
          {coverImage && <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />}
          <div className="relative z-10"><h3 className="text-xl font-bold text-white">{name}</h3></div>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-xs text-slate-500 line-clamp-2">{description || 'No description'}</p>
          <div className="grid grid-cols-4 gap-2 text-center"><div><p className="text-xs font-bold text-slate-900">0</p><p className="text-[10px] text-slate-400">Notes</p></div><div><p className="text-xs font-bold text-slate-900">0</p><p className="text-[10px] text-slate-400">MCQs</p></div><div><p className="text-xs font-bold text-slate-900">0</p><p className="text-[10px] text-slate-400">Videos</p></div><div><p className="text-xs font-bold text-slate-900">0</p><p className="text-[10px] text-slate-400">Tests</p></div></div>
          <div className="flex items-center justify-between"><span className="text-sm font-medium text-brand-600">Continue</span></div>
        </div>
      </div>
      <p className="text-[10px] text-slate-400 text-center">Desktop preview · 16:9 aspect ratio</p>
    </div>
  </div>;
}
