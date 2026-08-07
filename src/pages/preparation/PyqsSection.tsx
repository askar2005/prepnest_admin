import { useState, useEffect, useRef } from 'react';
import { useTopicWorkspace, type PyqItem } from './useTopicWorkspace';
import { DeleteConfirmationModal } from '../../components/common/DeleteConfirmationModal';
import { SearchBar } from '../../components/common/SearchBar';
import { PYQCard } from '../../components/common/PYQCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { Plus, FileText, X, Loader2 } from 'lucide-react';
import { apiClient } from '../../api/client';
import { downloadPdf } from '../../lib/downloadPdf';

export function PyqsSection({ items, api, pushToast, onConfirm: _onConfirm }: { items: PyqItem[]; api: ReturnType<typeof useTopicWorkspace>; pushToast: any; onConfirm: (c: { id: string; action: string }) => void }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfPublicId, setPdfPublicId] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const fileRef = useRef<HTMLInputElement>(null);

  const perPage = 10;
  const filtered = items.filter((p) => p.title?.toLowerCase().includes(search.toLowerCase()) || p.year.toString().includes(search.toLowerCase()));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const resetForm = () => {
    setYear(new Date().getFullYear()); setTitle(''); setDesc(''); setPdfFile(null); setPdfUrl(null); setPdfPublicId(null); setIsPublished(false);
    setEditId(null); setShowForm(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const uploadPdf = async (file: File): Promise<{ url: string; publicId: string }> => {
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    try {
      const response = await apiClient.post('/files/upload', form, { timeout: 120000 });
      const secureUrl = response.data.secureUrl || response.data.url;
      return { url: secureUrl, publicId: response.data.publicId };
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!title.trim() || !year) return;
    setBusy(true);
    try {
      let finalPdfUrl = pdfUrl;
      let finalPdfPublicId = pdfPublicId;
      if (pdfFile) {
        const res = await uploadPdf(pdfFile);
        finalPdfUrl = res.url;
        finalPdfPublicId = res.publicId;
      }
      const body: any = { year: Number(year), title: title.trim(), description: desc.trim() || null, pdfUrl: finalPdfUrl || null, pdfPublicId: finalPdfPublicId, isPublished };
      if (editId) {
        await api.updatePyq(editId, body);
        pushToast('PYQ updated', 'success');
      } else {
        await api.createPyq(body);
        pushToast('PYQ created', 'success');
      }
      resetForm();
      refreshData();
    } catch (err: any) {
      pushToast(err?.response?.data?.message || err?.message || 'Save failed', 'error');
    } finally { setBusy(false); }
  };

  const refreshData = () => {
    (window as any).__topicWorkspaceRefresh?.();
  };

  const startEdit = (pyq: any) => {
    setYear(pyq.year || new Date().getFullYear());
    setTitle(pyq.title || '');
    setDesc(pyq.description || '');
    setPdfUrl(pyq.pdfUrl || null);
    setPdfPublicId(pyq.pdfPublicId || null);
    setIsPublished(pyq.isPublished ?? false);
    setPdfFile(null);
    setEditId(pyq.id);
    setShowForm(true);
  };

  const startDelete = (id: string) => {
    setDeleteModal({ open: true, id });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    setBusy(true);
    try {
      await api.deletePyq(deleteModal.id);
      pushToast('PYQ deleted', 'success');
      refreshData();
      setDeleteModal({ open: false, id: null });
    } catch (err: any) { pushToast(err?.response?.data?.message || err?.message || 'Delete failed', 'error'); }
    finally { setBusy(false); }
  };

  useEffect(() => { setPage(1); }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">PYQ Management</h1>
          <p className="text-sm text-slate-500 mt-1">Upload and manage Previous Year Question papers</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2"><Plus className="w-4 h-4" /> Add PYQ</Button>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search by title or year..." className="max-w-sm" />

      {paged.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="w-12 h-12 text-slate-400 mb-4" />
          <h2 className="text-lg font-semibold text-slate-700">No PYQs Found</h2>
          <p className="text-sm text-slate-500 mt-1 mb-4">Upload your first previous year paper.</p>
          <Button onClick={() => { resetForm(); setShowForm(true); }}>Add PYQ</Button>
        </div>
      )}

      {paged.length > 0 && (
        <div className="space-y-4">
          {paged.map((p: any) => (
            <PYQCard
              key={p.id}
              pyq={p}
              onEdit={startEdit}
              onDelete={startDelete}
              onDownload={(pyq) => { try { downloadPdf(pyq.pdfUrl, `${pyq.year}_${pyq.title}.pdf`); } catch { /* intentionally ignored */ } }}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${page === p ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}>{p}</button>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => resetForm()}>
          <div className="w-full max-w-lg rounded-[16px] border border-slate-200 bg-white shadow-soft mx-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 rounded-t-[16px] flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">{editId ? 'Edit PYQ' : 'Create PYQ'}</h2>
              <button onClick={resetForm} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex gap-3">
                <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} placeholder="Year" className="w-full sm:max-w-[120px]" />
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="flex-1" />
              </div>
              <TextArea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description (optional)" />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">PDF File</label>
                <div className="flex items-center gap-3">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                  {uploading && <Loader2 className="w-5 h-5 animate-spin text-indigo-600 shrink-0" />}
                </div>
                {(pdfUrl && !pdfFile) && <p className="text-xs text-slate-400 mt-1">Current: {pdfUrl.split('/').pop()}</p>}
                {pdfFile && <p className="text-xs text-slate-500 mt-1">{pdfFile.name} ({(pdfFile.size / 1024).toFixed(0)} KB)</p>}
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                <span className="text-sm font-medium text-slate-700">Published</span>
              </label>

              <div className="flex gap-3 pt-2">
                <Button onClick={submit} disabled={busy || !title.trim() || !year || uploading}>{busy ? 'Saving...' : 'Save'}</Button>
                <Button variant="secondary" onClick={resetForm}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmationModal open={deleteModal.open} title="Delete PYQ" message="Are you sure you want to delete this PYQ?" onConfirm={confirmDelete} onCancel={() => setDeleteModal({ open: false, id: null })} />
    </div>
  );
}