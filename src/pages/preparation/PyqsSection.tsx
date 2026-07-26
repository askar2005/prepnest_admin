import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { Plus, Edit3, Trash2, FileText, Download } from 'lucide-react';
import { useToast } from '../../components/common/ToastHost';
import { useTopicWorkspace, type PyqItem } from './useTopicWorkspace';
import { DeleteConfirmationModal } from '../../components/common/DeleteConfirmationModal';
import { SearchBar } from '../../components/common/SearchBar';
import { PYQCard } from '../../components/common/PYQCard';

export function PyqsSection({ items, api, pushToast, onConfirm }: { items: PyqItem[]; api: ReturnType<typeof useTopicWorkspace>; pushToast: any; onConfirm: (c: { id: string; action: string }) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });

  const perPage = 10;
  const filtered = items.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()) || p.year.toString().includes(search.toLowerCase()));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const fileToDataUrl = (f: File): Promise<string> => new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(String(r.result)); r.onerror = reject; r.readAsDataURL(f); });

  const submit = async () => {
    if (!title.trim() || !year) return;
    setBusy(true);
    try {
      const body: any = { year: Number(year), title: title.trim(), description: desc.trim() || null };
      if (pdfFile) body.pdfUrl = await fileToDataUrl(pdfFile);
      await api.createPyq(body);
      pushToast('PYQ added', 'success');
      setTitle(''); setYear(new Date().getFullYear()); setPdfFile(null); setShowForm(false);
    } catch (err: any) { pushToast(err?.response?.data?.message || err?.message || 'Failed', 'error'); }
    finally { setBusy(false); }
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    setBusy(true);
    try {
      await api.deletePyq(deleteModal.id);
      pushToast('PYQ deleted', 'success');
      setDeleteModal({ open: false, id: null });
    } catch (err: any) { pushToast(err?.response?.data?.message || err?.message || 'Failed', 'error'); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">PYQ Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage Previous Year Question papers</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2"><Plus className="w-4 h-4" />{showForm ? 'Cancel' : 'Add PYQ'}</Button>
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search PYQs by year or title..." className="max-w-sm" />

      {showForm && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} placeholder="Year" className="w-full sm:max-w-[120px]" />
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="flex-1" />
          </div>
          <TextArea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description (optional)" />
          <Input type="file" accept=".pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} />
          <Button onClick={submit} disabled={busy || !title.trim() || !year}>{busy ? 'Adding...' : 'Add'}</Button>
        </div>
      )}

      {items.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="w-12 h-12 text-slate-400 mb-4" />
          <h2 className="text-lg font-semibold text-slate-700">No PYQs Yet</h2>
          <p className="text-sm text-slate-500 mt-1 mb-4">Upload previous year papers.</p>
          <Button onClick={() => setShowForm(true)}>Add PYQ</Button>
        </div>
      )}

      <div className="space-y-3">
        {paged.map((p) => (
          <PYQCard
            key={p.id}
            pyq={p}
            onEdit={() => {}}
            onDelete={() => setDeleteModal({ open: true, id: p.id })}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button key={pageNum} onClick={() => setPage(pageNum)} className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${page === pageNum ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}>{pageNum}</button>
          ))}
        </div>
      )}

      <DeleteConfirmationModal open={deleteModal.open} title="Delete PYQ" message="Are you sure you want to delete this PYQ?" onConfirm={confirmDelete} onCancel={() => setDeleteModal({ open: false, id: null })} />
    </div>
  );
}