import { Edit3, Trash2, Eye, Download, FileText } from 'lucide-react';
import { openPdf } from '../../lib/openPdf';

export interface PYQCardProps {
  pyq: any;
  onEdit: (pyq: any) => void;
  onDelete: (id: string) => void;
  onDownload: (pyq: any) => void;
}

export function PYQCard({ pyq, onEdit, onDelete, onDownload }: PYQCardProps) {
  const hasPdf = !!pyq.pdfUrl;
  const publishedColor = pyq.isPublished ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700';
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-soft hover:shadow-md transition-shadow">
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0"><h3 className="text-sm font-semibold text-slate-900 truncate">{pyq.year} {pyq.title}</h3></div>
          <div className="flex flex-col gap-1 ml-2 shrink-0"><span className={`text-[10px] px-2 py-0.5 rounded font-medium ${publishedColor}`}>{pyq.isPublished ? 'Published' : 'Draft'}</span></div>
        </div>
        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{pyq.description || 'Previous Year Question'}</p>
        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500"><span className="flex items-center gap-1"><FileText className="w-3 h-3" />{hasPdf ? 'PDF' : 'No file'}</span></div>
      </div>
      <div className="p-3 bg-slate-50 flex flex-wrap gap-2 justify-end">
        {hasPdf && <button onClick={() => openPdf(pyq.pdfUrl)} className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors touch-target" title="Preview"><Eye className="w-4 h-4" /></button>}
        {hasPdf && <button onClick={() => onDownload(pyq)} className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors touch-target" title="Download PDF"><Download className="w-4 h-4" /></button>}
        <button onClick={() => onEdit(pyq)} className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors touch-target" title="Edit"><Edit3 className="w-4 h-4" /></button>
        <button onClick={() => onDelete(pyq.id)} className="p-1.5 rounded-lg hover:bg-white text-red-600 hover:text-red-700 transition-colors touch-target" title="Delete"><Trash2 className="w-4 h-4" /></button>
      </div>
    </div>
  );
}