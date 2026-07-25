import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { useTopicWorkspace, type NoteItem, type NoteAttachment } from './useTopicWorkspace';
import { useToast } from '../../components/common/ToastHost';
import { Bold, Italic, Underline, Heading1, Heading2, List, ListOrdered, Quote, Code, Link, Undo2, Redo2, Image, Upload, Save, Eye, Trash2, Edit3, Download, ZoomIn, FileText, Loader2 } from 'lucide-react';
import { apiClient } from '../../api/client';

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const MAX_SIZE = 50 * 1024 * 1024;

function formatSize(bytes: number) { if (!bytes) return '—'; const u = ['B', 'KB', 'MB', 'GB']; let i = 0; let s = bytes; while (s >= 1024 && i < u.length - 1) { s /= 1024; i++; } return `${s.toFixed(1)} ${u[i]}`; }

function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }

function FileCard({ att, noteId, api, pushToast, onDeleted }: { att: NoteAttachment; noteId: string; api: ReturnType<typeof useTopicWorkspace>; pushToast: any; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false);
  const isPdf = att.fileType === 'application/pdf';
  return <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:shadow-sm transition-shadow">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isPdf ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
      <FileText className="w-5 h-5" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-slate-900 truncate">{att.originalName || att.fileName}</p>
      <p className="text-xs text-slate-400">{formatSize(att.fileSize || 0)} · {fmtDate(att.createdAt)}</p>
    </div>
    <div className="flex items-center gap-1">
      <a href={`/${att.fileUrl.replace(/^\//, '')}`} target="_blank" rel="noreferrer" className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600" title="Preview">
        <ZoomIn className="w-4 h-4" />
      </a>
      <a href={`/${att.fileUrl.replace(/^\//, '')}`} download className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600" title="Download">
        <Download className="w-4 h-4" />
      </a>
      <button type="button" disabled={deleting} onClick={async () => { setDeleting(true); try { await api.deleteNoteAttachment(att.id); pushToast('Attachment deleted', 'success'); onDeleted(); } catch (e: any) { pushToast(e?.response?.data?.message || 'Delete failed', 'error'); } finally { setDeleting(false); } }} className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600" title="Delete">
        {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      </button>
    </div>
  </div>;
}

export default function NotesEditorSection({ items, api }: { items: NoteItem[]; api: ReturnType<typeof useTopicWorkspace> }) {
  const { pushToast } = useToast();
  const editorRef = useRef<HTMLDivElement>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Attachments
  const [attachments, setAttachments] = useState<NoteAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const perPage = 10;
  const filtered = items.filter((n) => n.title.toLowerCase().includes(search.toLowerCase()));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const execCmd = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    setHasUnsaved(true);
  };

  const getContent = () => editorRef.current?.innerHTML || '';
  const setContent = (html: string) => { if (editorRef.current) editorRef.current.innerHTML = html; };

  const uploadFile = async (file: File): Promise<string> => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await apiClient.post('/files/upload', form);
    return `/api/files/${data.id}`;
  };

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try { const url = await uploadFile(file); execCmd('insertImage', url); } catch { pushToast('Image upload failed', 'error'); }
    };
    input.click();
  };

  const insertLink = () => { const url = prompt('Enter URL:'); if (url) execCmd('createLink', url); };

  const resetForm = () => {
    setTitle(''); setDescription(''); setTags(''); setEditId(null); setShowEditor(false); setAttachments([]);
    setContent(''); setHasUnsaved(false); setUploadProgress(0);
  };

  const startEdit = (n: NoteItem) => {
    setTitle(n.title); setDescription(n.description || ''); setTags(n.tags || n.tagsString || '');
    setEditId(n.id); setContent(n.content || '');
    setAttachments(n.attachments || []);
    setShowEditor(true); setHasUnsaved(false);
  };

  const submit = async () => {
    if (!title.trim()) return;
    setBusy(true);
    try {
      const content = getContent();
      const body: any = { title: title.trim(), content: content || null, description: description.trim() || null, tags: tags.trim() || null };
      if (editId) { await api.updateNewNote(editId, body); pushToast('Note updated', 'success'); }
      else {
        const created = await api.createNewNote(body) as any;
        setEditId(created.id);
        pushToast('Note created — you can now upload attachments', 'success');
      }
      setHasUnsaved(false);
    } catch (err: any) { pushToast(err?.response?.data?.message || err?.message || 'Failed', 'error'); }
    finally { setBusy(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this note? Attachments will also be removed.')) return;
    try { await api.deleteNewNote(id); pushToast('Note deleted', 'success'); } catch (err: any) { pushToast(err?.response?.data?.message || 'Delete failed', 'error'); }
  };

  // Drag-drop upload
  const uploadAttachment = async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) { pushToast('Only PDF, images, and Word docs allowed', 'error'); return; }
    if (file.size > MAX_SIZE) { pushToast('File exceeds 50MB limit', 'error'); return; }
    if (!editId) { pushToast('Save the note first before uploading files', 'error'); return; }
    setUploading(true); setUploadProgress(0);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('noteId', editId);
      const { data } = await apiClient.post('/api/notes/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e: any) => { if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100)); },
      });
      setAttachments((prev) => [...prev, data]);
      pushToast('File uploaded', 'success');
    } catch (err: any) { pushToast(err?.response?.data?.message || 'Upload failed', 'error'); }
    finally { setUploading(false); setUploadProgress(0); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(f => uploadAttachment(f));
  };

  const handleFileSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp';
    input.multiple = true;
    input.onchange = () => { const files = Array.from(input.files || []); files.forEach(f => uploadAttachment(f)); };
    input.click();
  };

  // Auto-save every 30s
  useEffect(() => {
    if (!showEditor || !editId || !hasUnsaved) return;
    autoSaveRef.current = setInterval(async () => {
      if (!hasUnsaved) return;
      setSaving(true);
      try { await api.updateNewNote(editId, { content: getContent() }); setHasUnsaved(false); } catch { }
      finally { setSaving(false); }
    }, 30000);
    return () => { if (autoSaveRef.current) clearInterval(autoSaveRef.current); };
  }, [showEditor, editId, hasUnsaved]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { if (hasUnsaved) e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsaved]);

  const ToolBtn = ({ onClick, icon: Icon, title: t }: { onClick: () => void; icon: any; title: string }) => (
    <button type="button" onClick={onClick} title={t} className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-slate-900"><Icon className="w-4 h-4" /></button>
  );

  const toolbar = (
    <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-slate-200 bg-slate-50 rounded-t-xl">
      <ToolBtn onClick={() => execCmd('bold')} icon={Bold} title="Bold" />
      <ToolBtn onClick={() => execCmd('italic')} icon={Italic} title="Italic" />
      <ToolBtn onClick={() => execCmd('underline')} icon={Underline} title="Underline" />
      <span className="w-px h-5 bg-slate-200 mx-1" />
      <ToolBtn onClick={() => execCmd('formatBlock', '<h1>')} icon={Heading1} title="Heading 1" />
      <ToolBtn onClick={() => execCmd('formatBlock', '<h2>')} icon={Heading2} title="Heading 2" />
      <span className="w-px h-5 bg-slate-200 mx-1" />
      <ToolBtn onClick={() => execCmd('insertUnorderedList')} icon={List} title="Bullet List" />
      <ToolBtn onClick={() => execCmd('insertOrderedList')} icon={ListOrdered} title="Numbered List" />
      <ToolBtn onClick={() => execCmd('formatBlock', '<blockquote>')} icon={Quote} title="Blockquote" />
      <ToolBtn onClick={() => execCmd('formatBlock', '<pre>')} icon={Code} title="Code Block" />
      <span className="w-px h-5 bg-slate-200 mx-1" />
      <ToolBtn onClick={insertLink} icon={Link} title="Insert Link" />
      <ToolBtn onClick={handleImageUpload} icon={Image} title="Insert Image" />
      <span className="w-px h-5 bg-slate-200 mx-1" />
      <ToolBtn onClick={() => execCmd('undo')} icon={Undo2} title="Undo" />
      <ToolBtn onClick={() => execCmd('redo')} icon={Redo2} title="Redo" />
      <span className="flex-1" />
      {saving && <span className="text-[10px] text-amber-600">Saving...</span>}
      {hasUnsaved && <span className="text-[10px] text-slate-400">Unsaved changes</span>}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search notes..." className="max-w-xs" />
        <Button onClick={() => { resetForm(); setShowEditor(true); }}><Edit3 className="w-4 h-4 mr-1" />New Note</Button>
      </div>

      {showEditor && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-soft">
          {toolbar}
          <div className="p-4 space-y-3">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note title" className="text-lg font-semibold" />
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description (optional)" />
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={() => setHasUnsaved(true)}
              className="min-h-[300px] p-4 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 prose prose-sm max-w-none"
              style={{ whiteSpace: 'pre-wrap' }}
            />
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags: Easy, Important, Formula, Revision..." />

            {/* Drag-drop upload zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={handleFileSelect}
              className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-slate-300 bg-slate-50'}`}
            >
              {uploading ? (
                <div className="space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
                  <p className="text-sm text-slate-500">Uploading... {uploadProgress}%</p>
                  <div className="w-full max-w-xs mx-auto bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="w-6 h-6 mx-auto text-slate-400" />
                  <p className="text-sm text-slate-600">Drag & drop files here, or click to browse</p>
                  <p className="text-xs text-slate-400">PDF, images, Word docs (max 50MB each)</p>
                </div>
              )}
            </div>

            {/* File cards */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Attachments ({attachments.length})</p>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {attachments.map((att) => (
                    <FileCard key={att.id} att={att} noteId={editId!} api={api} pushToast={pushToast} onDeleted={() => setAttachments((prev) => prev.filter((a) => a.id !== att.id))} />
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button onClick={submit} disabled={busy || !title.trim()}><Save className="w-4 h-4 mr-1" />{busy ? 'Saving...' : editId ? 'Update' : 'Save'}</Button>
              <Button variant="secondary" onClick={resetForm}>Cancel</Button>
              {editId && <Button variant="secondary" onClick={() => window.open(`/api/notes/${editId}`, '_blank')}><Eye className="w-4 h-4 mr-1" />Preview</Button>}
            </div>
          </div>
        </div>
      )}

      {paged.length === 0 && !showEditor && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium text-slate-700">No Notes</p>
          <p className="text-sm text-slate-400 mt-1 mb-4">Create rich text notes with PDF attachments.</p>
          <Button onClick={() => { resetForm(); setShowEditor(true); }}>Create Note</Button>
        </div>
      )}

      {paged.length > 0 && <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm"><thead><tr className="bg-slate-50 text-left text-slate-600">
          <th className="px-4 py-3 font-medium">Title</th><th className="px-4 py-3 font-medium">Tags</th><th className="px-4 py-3 font-medium">Files</th><th className="px-4 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium text-center">Actions</th>
        </tr></thead><tbody>
          {paged.map((n) => <tr key={n.id} className="border-t border-slate-100 hover:bg-slate-50">
            <td className="px-4 py-3 font-medium text-slate-900">{n.title}</td>
            <td className="px-4 py-3"><span className="text-xs text-slate-400">{n.tags || n.tagsString || '—'}</span></td>
            <td className="px-4 py-3"><span className="text-xs text-slate-500">{(n as any).attachments?.length || 0} files</span></td>
            <td className="px-4 py-3 text-slate-500">{fmtDate(n.createdAt)}</td>
            <td className="px-4 py-3 text-center"><div className="flex gap-2 justify-center">
              <button onClick={() => startEdit(n)} className="text-xs text-indigo-600 hover:underline flex items-center gap-1"><Edit3 className="w-3 h-3" />Edit</button>
              <button onClick={() => handleDelete(n.id)} className="text-xs text-red-500 hover:underline flex items-center gap-1"><Trash2 className="w-3 h-3" />Delete</button>
            </div></td>
          </tr>)}
        </tbody></table>
      </div>}

      {totalPages > 1 && <div className="flex justify-center gap-2 mt-4">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button key={p} onClick={() => setPage(p)} className={`px-3 py-1 text-sm rounded ${page === p ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}>{p}</button>
        ))}
      </div>}
    </div>
  );
}
