import { useState, useCallback } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { TextArea } from '../../components/ui/TextArea';
import { Select } from '../../components/ui/Select';
import { Plus, Edit3, Trash2, Copy, ChevronUp, ChevronDown, ChevronRight, ChevronDown as ChevronDownIcon, Upload, Download, CheckSquare } from 'lucide-react';
import { useToast } from '../../components/common/ToastHost';
import { useTopicWorkspace, type McqItem } from './useTopicWorkspace';
import { DeleteConfirmationModal } from '../../components/common/DeleteConfirmationModal';
import { SearchBar } from '../../components/common/SearchBar';
import { MCQCard } from '../../components/common/MCQCard';

export function McqsSection({ items, api }: { items: McqItem[]; api: ReturnType<typeof useTopicWorkspace> }) {
  const { pushToast } = useToast();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showBuilder, setShowBuilder] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [duplicateModal, setDuplicateModal] = useState<{ open: boolean; mcq: McqItem | null }>({ open: false, mcq: null });

  const perPage = 10;
  const filtered = items.filter((m) => m.question.toLowerCase().includes(search.toLowerCase()));
  const paged = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <SearchBar value={search} onChange={setSearch} placeholder="Search MCQs..." className="max-w-xs" />
        <Button onClick={() => { setShowBuilder(!showBuilder); }}><Plus className="w-4 h-4 mr-1" />{showBuilder ? 'Cancel' : 'MCQ Builder'}</Button>
      </div>

      {showBuilder && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft space-y-3">
          <p className="text-sm font-semibold text-slate-700">MCQ Builder</p>
          <div className="space-y-3">
            <div className="border border-slate-200 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-600">Question</p>
                <div className="flex gap-1">
                  <button className="text-xs text-red-500 hover:underline">Delete</button>
                  <button className="text-xs text-indigo-600 hover:underline">Duplicate</button>
                </div>
              </div>
              <TextArea placeholder="Enter question" className="min-h-[50px] text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Option A" className="text-sm" />
                <Input placeholder="Option B" className="text-sm" />
                <Input placeholder="Option C" className="text-sm" />
                <Input placeholder="Option D" className="text-sm" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {paged.map((m) => (
          <MCQCard
            key={m.id}
            mcq={m}
            onEdit={() => {}}
            onDelete={() => setDeleteModal({ open: true, id: m.id })}
            onDuplicate={() => setDuplicateModal({ open: true, mcq: m })}
          />
        ))}
        {paged.length === 0 && !showBuilder && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-lg font-semibold text-slate-700">No MCQs Yet</p>
            <p className="text-sm text-slate-500 mt-1 mb-4">Use the MCQ Builder to create questions.</p>
            <Button onClick={() => setShowBuilder(true)}>Create MCQs</Button>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${page === p ? 'bg-indigo-100 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}>{p}</button>
          ))}
        </div>
      )}

      <DeleteConfirmationModal open={deleteModal.open} title="Delete MCQ" message="Are you sure you want to delete this MCQ?" onConfirm={() => {}} onCancel={() => setDeleteModal({ open: false, id: null })} />
      <DeleteConfirmationModal open={duplicateModal.open} title="Duplicate MCQ" message={`Create a copy of "${duplicateModal.mcq?.question}"?`} confirmLabel="Duplicate" onConfirm={() => {}} onCancel={() => setDuplicateModal({ open: false, mcq: null })} />
    </div>
  );
}