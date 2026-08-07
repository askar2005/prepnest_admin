import { useParams, Link } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../components/common/ToastHost';
import { usePreparation, type TopicItem, type DashboardData, type AnalyticsData, type CategorySettings } from './usePreparation';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { resolveImageUrl } from '../../api/client';

const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'topics', label: 'Topics' },
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

export default function PreparationModulePage() {
  const { category } = useParams<{ category: string }>();
  const api = usePreparation(category!);
  const { pushToast } = useToast();
  const [tab, setTab] = useState('dashboard');
  const [localLoading, setLocalLoading] = useState(false);

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [topics, setTopics] = useState<TopicItem[]>([]);
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
    analytics: () => load(api.getAnalytics, setAnalytics),
    settings: () => load(api.getSettings, setSettings),
  };

  useEffect(() => {
    loaders[tab]?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, category]);

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
      {tab === 'analytics' && <AnalyticsSection data={analytics} loading={localLoading} />}
      {tab === 'settings' && settings && <SettingsSection data={settings} api={api} pushToast={pushToast} />}

      <ConfirmDialog open={!!confirm} title="Confirm Delete" message="Are you sure you want to delete this topic? This action cannot be undone." confirmLabel="Delete" variant="danger"
        onConfirm={async () => {
          if (!confirm) return;
          try {
            await api.deleteTopic(confirm.id);
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
function SettingsSection({ data, api, pushToast }: { data: CategorySettings; api: ReturnType<typeof usePreparation>; pushToast: any }) {
  const [name, setName] = useState(data.name);
  const [coverImage, setCoverImage] = useState(data.coverImage || '');
  const [imageUploading, setImageUploading] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setName(data.name);
    setCoverImage(data.coverImage || '');
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
      await api.deleteCategoryImage();
      setCoverImage('');
      pushToast('Cover image removed', 'success');
    } catch (err: any) { pushToast(err?.response?.data?.message || 'Failed', 'error'); }
  };

  const getPreviewUrl = (url: string) => resolveImageUrl(url) || '';

  return <div className="max-w-2xl space-y-5">
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft space-y-4">
      <p className="text-sm font-semibold text-slate-700">Module Name</p>
      <label className="space-y-1">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter module name" />
      </label>
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

    <Button onClick={async () => { setBusy(true); try { await api.updateSettings({ name: name.trim() }); pushToast('Settings saved', 'success'); } catch (err: any) { pushToast(err?.response?.data?.message || err?.message || 'Failed', 'error'); } finally { setBusy(false); } }} disabled={busy || !name.trim()}>{busy ? 'Saving...' : 'Save'}</Button>
  </div>;
}
