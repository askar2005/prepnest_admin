import { Edit3, Trash2, FileText, Download } from 'lucide-react';

export interface PYQCardProps {
  pyq: any;
  onEdit: (pyq: any) => void;
  onDelete: (id: string) => void;
}

export function PYQCard({ pyq, onEdit, onDelete }: PYQCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-soft hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0"><h3 className="text-sm font-semibold text-slate-900">{pyq.year} {pyq.title}</h3><p className="text-xs text-slate-500 mt-0.5">{pyq.description || 'Previous Year Question'}</p></div>
          <div className="flex flex-col gap-1 ml-2 shrink-0"><span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">Year {pyq.year}</span>{pyq.pdfUrl && <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">PDF</span>}</div>
        </div>
        <div className="flex items-center gap-3 mt-3 text-xs text-slate-500"><span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" />{pyq.pdfUrl ? 'PDF Available' : 'No File'}</span></div>
      </div>
      <div className="p-3 bg-slate-50 flex gap-2 justify-end">
        <button onClick={() => onEdit(pyq)} className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors touch-target min-w-[36px] min-h-[36px]" title="Edit"><Edit3 className="w-4 h-4" /></button>
        {pyq.pdfUrl && <a href={pyq.pdfUrl} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors touch-target" title="Download PDF"><Download className="w-4 h-4" /></a>}
        <button onClick={() => onDelete(pyq.id)} className="p-1.5 rounded-lg hover:bg-white text-red-600 hover:text-red-700 transition-colors touch-target min-w-[36px] min-h-[36px]" title="Delete"><Trash2 className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
