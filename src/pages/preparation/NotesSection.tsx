import { useState, useEffect } from 'react';
import { useToast } from '../../components/common/ToastHost';
import { useTopicWorkspace, type NoteItem } from './useTopicWorkspace';
import { DeleteConfirmationModal } from '../../components/common/DeleteConfirmationModal';
import { SearchBar } from '../../components/common/SearchBar';
import { NoteCard } from '../../components/common/NoteCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { Plus, FileText, Edit3, Trash2, Copy, Eye } from 'lucide-react';

export function NotesSection({ items, api, pushToast, onConfirm }: { items: any[]; api: ReturnType<typeof useTopicWorkspace>; pushToast: any; onConfirm: (c: { id: string; action: string }) => void }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('notes');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [duplicateModal, setDuplicateModal] = useState<{ open: boolean; note: any | null }>({ open: false, note: null });
  const [previewModal, setPreviewModal] = useState<{ open: boolean; note: any | null }>({ open: false, note: null });

  const perPage = 10;
  const filtered = items.filter((n) => n.title.toLowerCase().includes(search.toLowerCase()));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const resetForm = () => {
    setTitle(''); setDescription(''); setCategory('notes'); setTags(''); setContent(''); setPdfFile(null);
    setEditId(null); setShowForm(false);
  };

  const submit = async () => {
    if (!title.trim()) return;
    setBusy(true);
    try {
      const body: any = {
        title: title.trim(),
        content: content.trim() || null,
        description: description.trim() || null,
        tags: tags.trim() || null,
      };
      if (pdfFile) {
        const form = new FormData();
        form.append('file', pdfFile);
        form.append('noteId', editId || '');
        const { data } = await (api as any).uploadNoteAttachment(editId || '', form);
        body.pdfUrl = data.fileUrl;
      }

      if (editId) {
        await api.updateNewNote(editId, body);
        pushToast('Note updated', 'success');
      } else {
        await api.createNewNote(body);
        pushToast('Note created', 'success');
      }
      resetForm();
      refreshData();
    } catch (err: any) { pushToast(err?.response?.data?.message || err?.message || 'Save failed', 'error'); }
    finally { setBusy(false); }
  };

  const refreshData = () => {
    (window as any).__topicWorkspaceRefresh?.();
  };

  const startEdit = (note: any) => {
    setTitle(note.title); setDescription(note.description || ''); setCategory(note.type?.toLowerCase() || 'notes'); setTags(note.tags || note.tagsString || '');
    setContent(note.content || ''); setEditId(note.id); setShowForm(true);
  };

  const startDuplicate = (note: any) => {
    const dup = { ...note, id: undefined, title: `${note.title} (Copy)`, status: 'DRAFT' as const };
    setDuplicateModal({ open: true, note: dup });
  };

  const confirmDuplicate = async () => {
    if (!duplicateModal.note) return;
    setBusy(true);
    try {
      await api.createNewNote({
        title: duplicateModal.note.title,
        content: duplicateModal.note.content || null,
        description: duplicateModal.note.description || null,
        tags: duplicateModal.note.tags || null,
      });
      pushToast('Note duplicated', 'success');
      refreshData();
      setDuplicateModal({ open: false, note: null });
    } catch (err: any) { pushToast(err?.response?.data?.message || err?.message || 'Duplicate failed', 'error'); }
    finally { setBusy(false); }
  };

  const startPreview = (id: string) => {
    const note = items.find((n) => n.id === id);
    if (note) setPreviewModal({ open: true, note });
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
          <p className="text-sm text-slate-500 mt-1">Manage notes and study materials</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2"><Plus className="w-4 h-4" /> Add Note</Button>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search notes..." className="max-w-sm" />

      {paged.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="w-12 h-12 text-slate-400 mb-4" />
          <h2 className="text-lg font-semibold text-slate-700">No Notes Found</h2>
          <p className="text-sm text-slate-500 mt-1 mb-4">Create your first note.</p>
          <Button onClick={() => { resetForm(); setShowForm(true); }}>Create Note</Button>
        </div>
      )}

      {paged.length > 0 && (
        <div className="space-y-4">
          {paged.map((n) => (
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

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => resetForm()}>
          <div className="w-full max-w-2xl rounded-[16px] border border-slate-200 bg-white shadow-soft mx-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 rounded-t-[16px]">
              <h2 className="text-xl font-semibold text-slate-900">Create Note</h2>
            </div>
            <div className="p-6 space-y-4">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
              <TextArea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Content" />
              <div className="flex gap-3 pt-4">
                <Button onClick={submit} disabled={busy || !title.trim()}>{busy ? 'Saving...' : 'Save'}</Button>
                <Button variant="secondary" onClick={() => resetForm()}>Cancel</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmationModal open={deleteModal.open} title="Delete Note" message="Are you sure you want to delete this note?" onConfirm={confirmDelete} onCancel={() => setDeleteModal({ open: false, id: null })} />
      <DeleteConfirmationModal open={duplicateModal.open} title="Duplicate Note" message={`Create a copy of "${duplicateModal.note?.title}"?`} confirmLabel="Duplicate" onConfirm={confirmDuplicate} onCancel={() => setDuplicateModal({ open: false, note: null })} />
    </div>
  );
}