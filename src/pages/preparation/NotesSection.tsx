import { useState, useEffect, useRef } from 'react';
import { useTopicWorkspace, type NoteItem } from './useTopicWorkspace';
import { DeleteConfirmationModal } from '../../components/common/DeleteConfirmationModal';
import { SearchBar } from '../../components/common/SearchBar';
import { NoteCard } from '../../components/common/NoteCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Plus, FileText, Upload, X, Loader2 } from 'lucide-react';
import { apiClient } from '../../api/client';

export function NotesSection({ items, api, pushToast, onConfirm }: { items: any[]; api: ReturnType<typeof useTopicWorkspace>; pushToast: any; onConfirm: (c: { id: string; action: string }) => void }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [duplicateModal, setDuplicateModal] = useState<{ open: boolean; note: any | null }>({ open: false, note: null });
  const fileRef = useRef<HTMLInputElement>(null);

  const perPage = 10;
  const filtered = items.filter((n: any) => n.title?.toLowerCase().includes(search.toLowerCase()));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const resetForm = () => {
    setTitle(''); setPdfFile(null); setPdfUrl(null); setIsPublished(false);
    setEditId(null); setShowForm(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const uploadFile = async (file: File): Promise<string> => {
    console.log('[Upload] file:', { name: file.name, type: file.type, size: file.size });
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      console.log('[Upload] POST /files/upload');
      const { data } = await apiClient.post('/files/upload', form);
      console.log('[Upload] response:', data);
      return data.url;
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!title.trim()) return;
    setBusy(true);
    try {
      let finalPdfUrl = pdfUrl;
      if (pdfFile) {
        console.log('[Submit] Uploading file:', pdfFile.name, pdfFile.type, pdfFile.size);
        finalPdfUrl = await uploadFile(pdfFile);
      }
      const body: any = { title: title.trim(), pdfUrl: finalPdfUrl || null, isPublished };
      console.log('[Submit] Saving note:', body);
      if (editId) {
        await api.updateNewNote(editId, body);
        pushToast('Note updated', 'success');
      } else {
        await api.createNewNote(body);
        pushToast('Note created', 'success');
      }
      resetForm();
      refreshData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Save failed';
      console.error('[Submit] Error:', err?.response?.status, msg, err?.response?.data || err);
      pushToast(msg, 'error');
    } finally { setBusy(false); }
  };

  const refreshData = () => {
    (window as any).__topicWorkspaceRefresh?.();
  };

  const startEdit = (note: any) => {
    setTitle(note.title); setPdfUrl(note.pdfUrl || null); setIsPublished(note.isPublished ?? false);
    setPdfFile(null); setEditId(note.id); setShowForm(true);
  };

  const startDuplicate = (note: any) => {
    const dup = { ...note, id: undefined, title: `${note.title} (Copy)`, isPublished: false };
    setDuplicateModal({ open: true, note: dup });
  };

  const confirmDuplicate = async () => {
    if (!duplicateModal.note) return;
    setBusy(true);
    try {
      await api.createNewNote({ title: duplicateModal.note.title, pdfUrl: duplicateModal.note.pdfUrl || null, isPublished: false });
      pushToast('Note duplicated', 'success');
      refreshData();
      setDuplicateModal({ open: false, note: null });
    } catch (err: any) { pushToast(err?.response?.data?.message || err?.message || 'Duplicate failed', 'error'); }
    finally { setBusy(false); }
  };

  const startPreview = (id: string) => {
    const note = items.find((n: any) => n.id === id);
    if (note?.pdfUrl) setPreviewUrl(note.pdfUrl);
  };

  const startDelete = (id: string) => {
    setDeleteModal({ open: true, id });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    setBusy(true);
    try {
      await api.deleteNewNote(deleteModal.id);
      pushToast('Note deleted', 'success');
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
          <h1 className="text-2xl font-bold text-slate-900">Notes Management</h1>
          <p className="text-sm text-slate-500 mt-1">Upload and manage PDF study notes</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2"><Plus className="w-4 h-4" /> Add Note</Button>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search notes..." className="max-w-sm" />

      {paged.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="w-12 h-12 text-slate-400 mb-4" />
          <h2 className="text-lg font-semibold text-slate-700">No Notes Found</h2>
          <p className="text-sm text-slate-500 mt-1 mb-4">Upload your first PDF study note.</p>
          <Button onClick={() => { resetForm(); setShowForm(true); }}>Create Note</Button>
        </div>
      )}

      {paged.length > 0 && (
        <div className="space-y-4">
          {paged.map((n: any) => (
            <NoteCard
              key={n.id}
              note={n}
              onEdit={startEdit}
              onDelete={startDelete}
              onDuplicate={startDuplicate}
              onPreview={startPreview}
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
              <h2 className="text-xl font-semibold text-slate-900">{editId ? 'Edit Note' : 'Create Note'}</h2>
              <button onClick={resetForm} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note title" />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">PDF File</label>
                <div className="flex items-center gap-3">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      if (f) console.log('[FilePicker] selected:', { name: f.name, type: f.type, size: f.size });
                      setPdfFile(f);
                    }}
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
                <Button onClick={submit} disabled={busy || !title.trim() || uploading}>{busy ? 'Saving...' : 'Save'}</Button>
                <Button variant="secondary" onClick={resetForm}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setPreviewUrl(null)}>
          <div className="w-full max-w-4xl h-[90vh] rounded-xl overflow-hidden bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-slate-50">
              <span className="text-sm font-medium text-slate-700">PDF Preview</span>
              <button onClick={() => setPreviewUrl(null)} className="p-1 rounded-lg hover:bg-white text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <iframe src={previewUrl} className="w-full h-[calc(90vh-52px)]" title="PDF Preview" />
          </div>
        </div>
      )}

      <DeleteConfirmationModal open={deleteModal.open} title="Delete Note" message="Are you sure you want to delete this note?" onConfirm={confirmDelete} onCancel={() => setDeleteModal({ open: false, id: null })} />
      <DeleteConfirmationModal open={duplicateModal.open} title="Duplicate Note" message={`Create a copy of "${duplicateModal.note?.title}"?`} confirmLabel="Duplicate" onConfirm={confirmDuplicate} onCancel={() => setDuplicateModal({ open: false, note: null })} />
    </div>
  );
}