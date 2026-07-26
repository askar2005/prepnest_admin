import { Edit3, Trash2, Copy, Eye, FileText, Image } from 'lucide-react';

export interface NoteCardProps {
  note: any;
  onEdit: (note: any) => void;
  onDelete: (id: string) => void;
  onDuplicate: (note: any) => void;
  onPreview: (id: string) => void;
}

export function NoteCard({ note, onEdit, onDelete, onDuplicate, onPreview }: NoteCardProps) {
  const isPdf = note.type === 'PDF';
  const statusColor = note.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700';
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-soft hover:shadow-md transition-shadow">
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0"><h3 className="text-sm font-semibold text-slate-900 truncate">{note.title}</h3><p className="text-xs text-slate-500 mt-0.5 truncate">{note.description}</p></div>
          <div className="flex flex-col gap-1 ml-2 shrink-0"><span className={`text-[10px] px-2 py-0.5 rounded font-medium ${statusColor}`}>{note.status}</span><span className={`text-[10px] px-1.5 py-0.5 rounded ${isPdf ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>{note.type}</span></div>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500"><span className="flex items-center gap-1"><FileText className="w-3 h-3" />{isPdf ? 'PDF' : 'Note'}</span><span className="flex items-center gap-1"><Image className="w-3 h-3" />{(isPdf ? (note as any).fileName || 'File' : (note as any).tags || 'Tags') || '—'}</span></div>
      </div>
      <div className="p-3 bg-slate-50 flex flex-wrap gap-2 justify-end">
        <button onClick={() => onPreview(note.id)} className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors touch-target" title="Preview"><Eye className="w-4 h-4" /></button>
        <button onClick={() => onEdit(note)} className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors touch-target" title="Edit"><Edit3 className="w-4 h-4" /></button>
        <button onClick={() => onDuplicate(note)} className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors touch-target" title="Duplicate"><Copy className="w-4 h-4" /></button>
        <button onClick={() => onDelete(note.id)} className="p-1.5 rounded-lg hover:bg-white text-red-600 hover:text-red-700 transition-colors touch-target" title="Delete"><Trash2 className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
