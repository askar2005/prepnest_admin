import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../components/common/ToastHost';
import { apiClient } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { TextArea } from '../../components/ui/TextArea';
import { Plus, Search, Edit3, Trash2, Eye, Copy, Archive, Send, ChevronLeft, ChevronRight, Megaphone, FileText, Link2, Image, Paperclip, Calendar, Clock, Pin, Flag, Users, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const CATEGORIES = ['PLACEMENT_DRIVES', 'INTERNSHIPS', 'HACKATHONS', 'WORKSHOP', 'EXAM_UPDATES', 'SCHOLARSHIPS', 'COLLEGE_ANNOUNCEMENTS', 'COMPANY_HIRING', 'GENERAL'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];
const AUDIENCES = ['ALL_STUDENTS', 'GATE', 'APTITUDE', 'INTERVIEW', 'TECHNICAL', 'FINAL_YEAR', 'THIRD_YEAR'];

const CATEGORY_LABELS: Record<string, string> = {
  PLACEMENT_DRIVES: 'Placement Drive', INTERNSHIPS: 'Internship', HACKATHONS: 'Hackathon',
  WORKSHOP: 'Workshop', EXAM_UPDATES: 'Exam', SCHOLARSHIPS: 'Scholarship',
  COLLEGE_ANNOUNCEMENTS: 'College Announcement', COMPANY_HIRING: 'Company Hiring', GENERAL: 'General',
};

const PRIORITY_STYLES: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-600', MEDIUM: 'bg-blue-50 text-blue-700',
  HIGH: 'bg-amber-50 text-amber-700', URGENT: 'bg-red-50 text-red-700',
};

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-500', PUBLISHED: 'bg-green-50 text-green-700', ARCHIVED: 'bg-orange-50 text-orange-600',
};

interface Notification {
  id: string; title: string; summary: string | null; description: string | null;
  category: string; priority: string; thumbnailUrl: string | null; bannerUrl: string | null;
  attachmentUrl: string | null; externalLink: string | null;
  publishDate: string | null; expiryDate: string | null;
  isPinned: boolean; isFeatured: boolean; status: string;
  targetAudience: string | null; views: number; createdBy: string | null;
  createdAt: string; updatedAt: string;
}

const EMPTY_FORM: any = {
  title: '', summary: '', description: '', category: 'GENERAL', priority: 'MEDIUM',
  thumbnailUrl: '', bannerUrl: '', attachmentUrl: '', externalLink: '',
  publishDate: '', expiryDate: '', isPinned: false, isFeatured: false,
  status: 'DRAFT', targetAudience: 'ALL_STUDENTS', createdBy: '',
};

export default function NotificationsPage() {
  const { pushToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Notification | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (search) params.q = search;
      if (filterCat) params.category = filterCat;
      if (filterStatus) params.status = filterStatus;
      if (filterPriority) params.priority = filterPriority;
      const { data } = await apiClient.get('/admin/notifications', { params });
      setNotifications(data.items || []);
      setTotal(data.total || 0);
    } catch (err: any) { pushToast(err?.response?.data?.message || 'Failed to load', 'error'); }
    finally { setLoading(false); }
  }, [page, search, filterCat, filterStatus, filterPriority, pushToast]);

  useEffect(() => { fetchList(); }, [fetchList]);
  useEffect(() => { setPage(1); }, [search, filterCat, filterStatus, filterPriority]);

  const openCreate = () => { setEditing(null); setForm({ ...EMPTY_FORM }); setShowModal(true); };
  const openEdit = (n: Notification) => {
    setEditing(n);
    setForm({
      title: n.title, summary: n.summary || '', description: n.description || '',
      category: n.category, priority: n.priority,
      thumbnailUrl: n.thumbnailUrl || '', bannerUrl: n.bannerUrl || '',
      attachmentUrl: n.attachmentUrl || '', externalLink: n.externalLink || '',
      publishDate: n.publishDate ? n.publishDate.slice(0, 16) : '',
      expiryDate: n.expiryDate ? n.expiryDate.slice(0, 16) : '',
      isPinned: n.isPinned, isFeatured: n.isFeatured,
      status: n.status, targetAudience: n.targetAudience || 'ALL_STUDENTS',
      createdBy: n.createdBy || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { pushToast('Title is required', 'error'); return; }
    setSaving(true);
    try {
      const payload: any = { ...form };
      if (!payload.publishDate) delete payload.publishDate;
      if (!payload.expiryDate) delete payload.expiryDate;
      if (!payload.thumbnailUrl) payload.thumbnailUrl = null;
      if (!payload.bannerUrl) payload.bannerUrl = null;
      if (!payload.attachmentUrl) payload.attachmentUrl = null;
      if (!payload.externalLink) payload.externalLink = null;
      if (!payload.summary) payload.summary = null;
      if (!payload.description) payload.description = null;

      if (editing) {
        await apiClient.put(`/admin/notifications/${editing.id}`, payload);
        pushToast('Notification updated', 'success');
      } else {
        await apiClient.post('/admin/notifications', payload);
        pushToast('Notification created', 'success');
      }
      setShowModal(false);
      fetchList();
    } catch (err: any) { pushToast(err?.response?.data?.message || 'Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this notification?')) return;
    try { await apiClient.delete(`/admin/notifications/${id}`); pushToast('Deleted', 'success'); fetchList(); }
    catch (err: any) { pushToast(err?.response?.data?.message || 'Failed', 'error'); }
  };

  const handlePublish = async (id: string) => {
    try { await apiClient.patch(`/admin/notifications/${id}/publish`); pushToast('Published', 'success'); fetchList(); }
    catch (err: any) { pushToast(err?.response?.data?.message || 'Failed', 'error'); }
  };

  const handleArchive = async (id: string) => {
    try { await apiClient.patch(`/admin/notifications/${id}/archive`); pushToast('Archived', 'success'); fetchList(); }
    catch (err: any) { pushToast(err?.response?.data?.message || 'Failed', 'error'); }
  };

  const handleDuplicate = async (n: Notification) => {
    try {
      await apiClient.post('/admin/notifications', {
        title: `${n.title} (Copy)`, summary: n.summary, description: n.description,
        category: n.category, priority: n.priority, status: 'DRAFT',
        targetAudience: n.targetAudience,
      });
      pushToast('Duplicated', 'success'); fetchList();
    } catch (err: any) { pushToast(err?.response?.data?.message || 'Failed', 'error'); }
  };

  const totalPages = Math.ceil(total / 20);

  const previewUrl = (url: string) => url.startsWith('http') ? url : (window.location.origin + url);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Important Notifications</h1>
          <p className="text-sm text-slate-500">Manage announcements for all students.</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4" /> Create Notification</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notifications..." className="w-full h-10 pl-10 pr-4 text-sm bg-white border border-slate-200 rounded-xl outline-none focus:border-brand-300 focus:ring-2 focus:ring-brand-100" />
        </div>
        <Select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="w-44">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>)}
        </Select>
        <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-36">
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="w-36">
          <option value="">All Priority</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase">Title</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase">Category</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase">Priority</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase">Status</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600 text-xs uppercase">Views</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase">Published</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-sm text-slate-400">Loading...</td></tr>
              ) : notifications.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-sm text-slate-400">No notifications found.</td></tr>
              ) : notifications.map((n) => (
                <tr key={n.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {n.thumbnailUrl ? (
                        <img src={previewUrl(n.thumbnailUrl)} alt="" className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          <Megaphone className="w-4 h-4 text-slate-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate max-w-[250px]">{n.title}</p>
                        {n.summary && <p className="text-xs text-slate-400 truncate max-w-[250px]">{n.summary}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="text-xs text-slate-600">{CATEGORY_LABELS[n.category] || n.category}</span></td>
                  <td className="px-4 py-3"><span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full ${PRIORITY_STYLES[n.priority] || ''}`}>{n.priority}</span></td>
                  <td className="px-4 py-3"><span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full ${STATUS_STYLES[n.status] || ''}`}>{n.status}</span></td>
                  <td className="px-4 py-3 text-center text-sm text-slate-600">{n.views}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{n.publishDate ? new Date(n.publishDate).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(n)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDuplicate(n)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="Duplicate"><Copy className="w-3.5 h-3.5" /></button>
                      {n.status !== 'PUBLISHED' && <button onClick={() => handlePublish(n.id)} className="p-1.5 rounded-lg hover:bg-green-50 text-slate-400 hover:text-green-600 transition-colors" title="Publish"><Send className="w-3.5 h-3.5" /></button>}
                      {n.status !== 'ARCHIVED' && <button onClick={() => handleArchive(n.id)} className="p-1.5 rounded-lg hover:bg-orange-50 text-slate-400 hover:text-orange-600 transition-colors" title="Archive"><Archive className="w-3.5 h-3.5" /></button>}
                      <button onClick={() => handleDelete(n.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
            <p className="text-xs text-slate-500">{total} notification{total !== 1 ? 's' : ''}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 bg-black/40 backdrop-blur-sm overflow-y-auto" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">{editing ? 'Edit Notification' : 'Create Notification'}</h2>
            </div>
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="grid md:grid-cols-2 gap-4">
                <label className="space-y-1 md:col-span-2"><span className="text-xs text-slate-500">Title *</span><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Notification title" /></label>
                <label className="space-y-1 md:col-span-2"><span className="text-xs text-slate-500">Short Summary</span><Input value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="Brief summary for cards" /></label>
                <label className="space-y-1 md:col-span-2"><span className="text-xs text-slate-500">Description (Rich Text)</span><TextArea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={5} placeholder="Full notification content with HTML support" /></label>
                <label className="space-y-1"><span className="text-xs text-slate-500">Category</span><Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>)}</Select></label>
                <label className="space-y-1"><span className="text-xs text-slate-500">Priority</span><Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>{PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}</Select></label>
                <label className="space-y-1"><span className="text-xs text-slate-500">Target Audience</span><Select value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}>{AUDIENCES.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}</Select></label>
                <label className="space-y-1"><span className="text-xs text-slate-500">Status</span><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</Select></label>
                <label className="space-y-1"><span className="text-xs text-slate-500">Thumbnail URL</span><Input value={form.thumbnailUrl} onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })} placeholder="https://..." /></label>
                <label className="space-y-1"><span className="text-xs text-slate-500">Banner URL</span><Input value={form.bannerUrl} onChange={(e) => setForm({ ...form, bannerUrl: e.target.value })} placeholder="https://..." /></label>
                <label className="space-y-1"><span className="text-xs text-slate-500">Attachment URL (PDF/DOC/ZIP)</span><Input value={form.attachmentUrl} onChange={(e) => setForm({ ...form, attachmentUrl: e.target.value })} placeholder="https://..." /></label>
                <label className="space-y-1"><span className="text-xs text-slate-500">External Link</span><Input value={form.externalLink} onChange={(e) => setForm({ ...form, externalLink: e.target.value })} placeholder="https://..." /></label>
                <label className="space-y-1"><span className="text-xs text-slate-500">Publish Date</span><Input type="datetime-local" value={form.publishDate} onChange={(e) => setForm({ ...form, publishDate: e.target.value })} /></label>
                <label className="space-y-1"><span className="text-xs text-slate-500">Expiry Date</span><Input type="datetime-local" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} /></label>
                <label className="space-y-1"><span className="text-xs text-slate-500">Created By</span><Input value={form.createdBy} onChange={(e) => setForm({ ...form, createdBy: e.target.value })} placeholder="Admin name" /></label>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={form.isPinned} onChange={(e) => setForm({ ...form, isPinned: e.target.checked })} className="rounded border-slate-300" /> Pinned</label>
                <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="rounded border-slate-300" /> Featured</label>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
