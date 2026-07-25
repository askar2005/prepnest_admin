import { useParams, Link } from 'react-router-dom';
import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../components/common/ToastHost';
import { useTopicWorkspace, type TopicDetail, type MockTestItem } from './useTopicWorkspace';
import McqBuilderSection from './McqBuilderSection';
import MockTestBuilderSection from './MockTestBuilderSection';
import NotesEditorSection from './NotesEditorSection';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { Select } from '../../components/ui/Select';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ArrowLeft, BarChart3, BookOpen, CheckSquare, Video, FileText, ClipboardList, Puzzle, Settings, ExternalLink, Trash2, Edit3, Plus, Upload, Download, RefreshCw } from 'lucide-react';

const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { key: 'notes', label: 'Notes', icon: BookOpen },
  { key: 'mcqs', label: 'MCQs', icon: CheckSquare },
  { key: 'videos', label: 'Videos', icon: Video },
  { key: 'pyqs', label: 'PYQs', icon: FileText },
  { key: 'mock-tests', label: 'Mock Tests', icon: ClipboardList },
  { key: 'resources', label: 'Resources', icon: Puzzle },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'settings', label: 'Settings', icon: Settings },
];

function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft"><p className="text-2xl font-bold text-slate-900">{value}</p><p className="text-xs text-slate-500 mt-0.5">{label}</p>{sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}</div>;
}

function EmptyState({ icon, title, desc, action, onAction }: { icon?: string; title: string; desc: string; action?: string; onAction?: () => void }) {
  return <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center"><div className="text-4xl mb-3">{icon || '📂'}</div><p className="text-lg font-medium text-slate-700">{title}</p><p className="text-sm text-slate-400 mt-1 mb-4">{desc}</p>{action && onAction && <Button onClick={onAction}>{action}</Button>}</div>;
}

export default function TopicWorkspacePage() {
  const { category, topicId } = useParams<{ category: string; topicId: string }>();
  const api = useTopicWorkspace(category!, topicId!);
  const { pushToast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState('dashboard');
  const [confirm, setConfirm] = useState<{ id: string; action: string } | null>(null);

  const { data: topic } = useQuery({ queryKey: ['topic', topicId], queryFn: () => api.getTopic(), staleTime: 60000 });
  const { data: dashboard, isLoading: dLoading } = useQuery({ queryKey: ['topic-dash', topicId], queryFn: () => api.getDashboard(), enabled: tab === 'dashboard' });
  const { data: notes, refetch: refetchNotes } = useQuery({ queryKey: ['topic-notes', topicId], queryFn: () => api.getNewNotes(), enabled: tab === 'notes' });
  const { data: mcqs, refetch: refetchMcqs } = useQuery({ queryKey: ['topic-mcqs', topicId], queryFn: () => api.getMcqs().then(d => d.items), enabled: tab === 'mcqs' });
  const { data: videos, refetch: refetchVideos } = useQuery({ queryKey: ['topic-videos', topicId], queryFn: () => api.getVideos().then(d => d.items), enabled: tab === 'videos' });
  const { data: pyqs, refetch: refetchPyqs } = useQuery({ queryKey: ['topic-pyqs', topicId], queryFn: () => api.getPyqs().then(d => d.items), enabled: tab === 'pyqs' });
  const { data: mockTests, refetch: refetchMT } = useQuery({ queryKey: ['topic-mocktests', topicId], queryFn: () => api.getMockTests().then(d => d.items), enabled: tab === 'mock-tests' });
  const { data: resources, refetch: refetchResources } = useQuery({ queryKey: ['topic-resources', topicId], queryFn: () => api.getResources().then(d => d.items), enabled: tab === 'resources' });
  const { data: analytics, isLoading: aLoading } = useQuery({ queryKey: ['topic-analytics', topicId], queryFn: () => api.getAnalytics(), enabled: tab === 'analytics' });

  const deleteItem = useCallback(async (id: string, action: string) => {
    const map: Record<string, (id: string) => Promise<any>> = { note: (id) => api.deleteNewNote(id), mcq: api.deleteMcq, video: api.deleteVideo, pyq: api.deletePyq, mockTest: api.deleteMockTest, resource: (id) => api.deleteNewNote(id) };
    await map[action](id);
    pushToast('Deleted', 'success');
    qc.invalidateQueries({ queryKey: ['topic'] });
  }, [api, pushToast, qc]);

  const CATEGORY_LABELS: Record<string, string> = { gate: 'GATE', aptitude: 'Aptitude', interview: 'Interview', technical: 'Technical' };
  const catName = CATEGORY_LABELS[category || ''] || category?.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || '';

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Link to={`/preparation/${category}`} className="text-slate-400 hover:text-slate-600 transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
          <div><h1 className="text-xl sm:text-2xl font-semibold text-slate-900">{topic?.name || 'Topic'}</h1><p className="text-xs text-slate-400">{catName} Preparation</p></div>
        </div>
      </div>

      <div className="flex gap-1 border-b border-slate-200 pb-2 overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          return <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-1.5 whitespace-nowrap px-2.5 sm:px-3 py-1.5 text-sm rounded-lg transition-colors ${tab === t.key ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}><Icon className="w-4 h-4" />{t.label}</button>;
        })}
      </div>

      {tab === 'dashboard' && <DashboardSection data={dashboard} loading={dLoading} />}
      {tab === 'notes' && notes && <NotesEditorSection items={notes} api={api} />}
      {tab === 'mcqs' && mcqs && <McqBuilderSection items={mcqs} api={api} />}
      {tab === 'videos' && <VideosSection items={videos || []} api={api} pushToast={pushToast} onConfirm={setConfirm} />}
      {tab === 'pyqs' && <PyqsSection items={pyqs || []} api={api} pushToast={pushToast} onConfirm={setConfirm} />}
      {tab === 'mock-tests' && <MockTestBuilderSection items={mockTests || []} api={api} />}
      {tab === 'resources' && <ResourcesSection items={resources || []} />}
      {tab === 'analytics' && <AnalyticsSection data={analytics} loading={aLoading} />}
      {tab === 'settings' && topic && <SettingsSection topic={topic} api={api} pushToast={pushToast} />}

      <ConfirmDialog open={!!confirm} title="Confirm Delete" message="Are you sure? This cannot be undone." confirmLabel="Delete" variant="danger"
        onConfirm={async () => { if (!confirm) return; try { await deleteItem(confirm.id, confirm.action); } catch (err: any) { pushToast(err?.message || 'Delete failed', 'error'); } setConfirm(null); }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}

/* ===== DASHBOARD ===== */
function DashboardSection({ data, loading }: { data: any; loading: boolean }) {
  if (loading && !data) return <EmptyState icon="⏳" title="Loading..." desc="Fetching stats" />;
  if (!data) return <EmptyState icon="📊" title="No Data" desc="Add content to see stats." />;
  return <div className="space-y-6">
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard label="Notes" value={data.notes} /><StatCard label="PDFs" value={data.pdfs} /><StatCard label="MCQs" value={data.mcqs} />
      <StatCard label="Videos" value={data.videos} /><StatCard label="PYQs" value={data.pyqs} /><StatCard label="Mock Tests" value={data.mockTests} />
      <StatCard label="Bookmarks" value={data.bookmarks} /><StatCard label="Student Attempts" value={data.totalAttempts} />
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <StatCard label="Avg Score" value={data.averageScore?.toFixed(1) || '0'} /><StatCard label="Highest Score" value={data.highestScore || 0} /><StatCard label="Completion Rate" value={`${data.completionRate || 0}%`} />
    </div>
    {data.recentUploads?.length > 0 && <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft"><p className="text-sm font-semibold text-slate-700 mb-2">Recent Uploads</p><div className="space-y-1.5">{data.recentUploads.map((r: any, i: number) => <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-sm"><span className="text-slate-700">{r.title}</span><span className="text-xs text-slate-400">{r.type} · {fmtDate(r.createdAt)}</span></div>)}</div></div>}
  </div>;
}

/* ===== VIDEOS ===== */
function VideosSection({ items, api, pushToast, onConfirm }: { items: any[]; api: any; pushToast: any; onConfirm: (c: any) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState(''); const [ytUrl, setYtUrl] = useState(''); const [desc, setDesc] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async () => { if (!title.trim() || !ytUrl.trim()) return; setBusy(true); try { await api.createVideo({ title: title.trim(), youtubeUrl: ytUrl.trim(), description: desc.trim() || null }); pushToast('Video added', 'success'); setTitle(''); setYtUrl(''); setDesc(''); setShowForm(false); } catch (err: any) { pushToast(err?.response?.data?.message || 'Failed', 'error'); } finally { setBusy(false); } };
  const getYtId = (u: string) => { const m = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/); return m ? m[1] : null; };
  return <div className="space-y-4">
    <Button onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-1" />{showForm ? 'Cancel' : 'Add Video'}</Button>
    {showForm && <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft space-y-3"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Video title" /><Input value={ytUrl} onChange={(e) => setYtUrl(e.target.value)} placeholder="YouTube URL" /><TextArea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description (optional)" /><Button onClick={submit} disabled={busy}>{busy ? 'Adding...' : 'Add'}</Button></div>}
    {items.length === 0 && !showForm && <EmptyState icon="🎬" title="No Videos" desc="Add YouTube videos." />}
    {items.length > 0 && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{items.map((v: any) => { const ytId = getYtId(v.youtubeUrl); return <div key={v.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-soft">{ytId ? <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="" className="w-full h-40 object-cover" /> : <div className="w-full h-40 bg-slate-100 flex items-center justify-center text-slate-400">No thumbnail</div>}<div className="p-3"><p className="text-sm font-medium text-slate-900 truncate">{v.title}</p><div className="flex gap-2 mt-2"><button onClick={() => onConfirm({ id: v.id, action: 'video' })} className="text-xs text-red-500 hover:underline">Delete</button></div></div></div>; })}</div>}
  </div>;
}

/* ===== PYQs ===== */
function PyqsSection({ items, api, pushToast, onConfirm }: { items: any[]; api: any; pushToast: any; onConfirm: (c: any) => void }) {
  const [showForm, setShowForm] = useState(false); const [year, setYear] = useState(new Date().getFullYear()); const [title, setTitle] = useState(''); const [desc, setDesc] = useState(''); const [pdfFile, setPdfFile] = useState<File | null>(null); const [busy, setBusy] = useState(false);
  const fileToDataUrl = (f: File): Promise<string> => new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = reject; r.readAsDataURL(f); });
  const submit = async () => { if (!title.trim() || !year) return; setBusy(true); try { const body: any = { year: Number(year), title: title.trim(), description: desc.trim() || null }; if (pdfFile) body.pdfUrl = await fileToDataUrl(pdfFile); await api.createPyq(body); pushToast('PYQ added', 'success'); setTitle(''); setYear(new Date().getFullYear()); setPdfFile(null); setShowForm(false); } catch (err: any) { pushToast(err?.response?.data?.message || 'Failed', 'error'); } finally { setBusy(false); } };
  const [page, setPage] = useState(1); const perPage = 10; const paged = items.slice((page - 1) * perPage, page * perPage); const totalPages = Math.ceil(items.length / perPage);
  return <div className="space-y-4">
    <Button onClick={() => setShowForm(!showForm)}><Plus className="w-4 h-4 mr-1" />{showForm ? 'Cancel' : 'Add PYQ'}</Button>
    {showForm && <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft space-y-3"><div className="flex flex-col sm:flex-row gap-3"><Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-full sm:max-w-[120px]" placeholder="Year" /><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="flex-1" /></div><TextArea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description (optional)" /><Input type="file" accept=".pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} /><Button onClick={submit} disabled={busy}>{busy ? 'Adding...' : 'Add'}</Button></div>}
    {items.length === 0 && !showForm && <EmptyState icon="📄" title="No PYQs" desc="Upload previous year papers." />}
    {items.length > 0 && <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full text-sm"><thead><tr className="bg-slate-50 text-left text-slate-600"><th className="whitespace-nowrap px-4 py-3 font-medium">Year</th><th className="whitespace-nowrap px-4 py-3 font-medium">Title</th><th className="whitespace-nowrap px-4 py-3 font-medium hidden sm:table-cell">Actions</th></tr></thead><tbody>{paged.map((p: any) => <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50"><td className="px-4 py-3 font-semibold">{p.year}</td><td className="px-4 py-3">{p.title}</td><td className="px-4 py-3 hidden sm:table-cell"><button onClick={() => onConfirm({ id: p.id, action: 'pyq' })} className="text-xs text-red-500 hover:underline">Delete</button></td></tr>)}</tbody></table></div>}
    {totalPages > 1 && <div className="flex justify-center gap-2">{Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => <button key={p} onClick={() => setPage(p)} className={`px-3 py-1 text-sm rounded ${page === p ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}>{p}</button>)}</div>}
  </div>;
}

/* ===== RESOURCES ===== */
function ResourcesSection({ items }: { items: any[] }) {
  if (items.length === 0) return <EmptyState icon="🧩" title="No Resources" desc="No additional resources." />;
  return <div className="overflow-x-auto rounded-xl border border-slate-200"><table className="w-full text-sm"><thead><tr className="bg-slate-50 text-left text-slate-600"><th className="whitespace-nowrap px-4 py-3 font-medium">Title</th><th className="whitespace-nowrap px-4 py-3 font-medium hidden sm:table-cell">Type</th><th className="whitespace-nowrap px-4 py-3 font-medium hidden sm:table-cell">Date</th></tr></thead><tbody>{items.map((r: any) => <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50"><td className="px-4 py-3 font-medium">{r.title}</td><td className="px-4 py-3 hidden sm:table-cell"><span className="text-xs px-2 py-0.5 rounded bg-purple-50 text-purple-700">{r.type}</span></td><td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{fmtDate(r.createdAt)}</td></tr>)}</tbody></table></div>;
}

/* ===== ANALYTICS ===== */
function AnalyticsSection({ data, loading }: { data: any; loading: boolean }) {
  if (loading && !data) return <EmptyState icon="⏳" title="Loading..." desc="Fetching analytics" />;
  if (!data) return <EmptyState icon="📈" title="No Analytics" desc="Data will appear once students engage." />;
  return <div className="space-y-6"><div className="grid grid-cols-2 sm:grid-cols-3 gap-3"><StatCard label="Total Attempts" value={data.totalAttempts} /><StatCard label="Avg Score" value={data.averageScore?.toFixed(1) || '0'} /><StatCard label="Highest Score" value={data.highestScore || 0} /></div></div>;
}

/* ===== SETTINGS ===== */
function SettingsSection({ topic, api, pushToast }: { topic: TopicDetail; api: any; pushToast: any }) {
  const [name, setName] = useState(topic.name); const [desc, setDesc] = useState(topic.description || ''); const [busy, setBusy] = useState(false);
  return <div className="max-w-lg space-y-5"><div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft space-y-4"><p className="text-sm font-semibold text-slate-700">Topic Settings</p><label className="space-y-1"><span className="text-xs text-slate-500">Topic Name</span><Input value={name} onChange={(e) => setName(e.target.value)} /></label><label className="space-y-1"><span className="text-xs text-slate-500">Description</span><TextArea value={desc} onChange={(e) => setDesc(e.target.value)} /></label><Button onClick={async () => { setBusy(true); try { await api.updateTopic({ name: name.trim(), description: desc.trim() || null }); pushToast('Topic updated', 'success'); } catch (err: any) { pushToast(err?.message || 'Failed', 'error'); } finally { setBusy(false); } }} disabled={busy || !name.trim()}>{busy ? 'Saving...' : 'Save'}</Button></div></div>;
}
