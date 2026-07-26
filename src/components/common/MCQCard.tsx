import { Edit3, Trash2, Copy, CheckSquare } from 'lucide-react';

export interface MCQCardProps {
  mcq: any;
  onEdit: (mcq: any) => void;
  onDelete: (id: string) => void;
  onDuplicate: (mcq: any) => void;
}

export function MCQCard({ mcq, onEdit, onDelete, onDuplicate }: MCQCardProps) {
  const diffColor = mcq.difficulty === 'EASY' ? 'bg-green-100 text-green-700' : mcq.difficulty === 'HARD' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700';
  const publishedColor = mcq.isPublished ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700';
  const correctOptionLetter = mcq.correctOption || 'A';
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-soft hover:shadow-md transition-shadow">
      <div className="p-4 border-b border-slate-100">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0"><h3 className="text-sm font-semibold text-slate-900">{mcq.question}</h3><div className="flex items-center gap-2 mt-2 text-xs"><span className={`px-2 py-0.5 rounded font-medium ${diffColor}`}>{mcq.difficulty || 'N/A'}</span><span className={`px-2 py-0.5 rounded font-medium ${publishedColor}`}>{mcq.isPublished ? 'Published' : 'Draft'}</span></div></div>
          <div className="text-right"><p className="text-xs text-slate-400">Correct</p><p className="text-sm font-bold text-green-700">Option {correctOptionLetter}</p></div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3 text-xs"><div className={mcq.correctOption === 'A' ? 'font-bold text-green-700' : 'text-slate-600'}>A: {mcq.optionA}</div><div className={mcq.correctOption === 'B' ? 'font-bold text-green-700' : 'text-slate-600'}>B: {mcq.optionB}</div><div className={mcq.correctOption === 'C' ? 'font-bold text-green-700' : 'text-slate-600'}>C: {mcq.optionC}</div><div className={mcq.correctOption === 'D' ? 'font-bold text-green-700' : 'text-slate-600'}>D: {mcq.optionD}</div></div>
        {mcq.explanation && <div className="mt-3 p-2 bg-slate-50 rounded text-xs text-slate-600"><strong>Explanation:</strong> {mcq.explanation}</div>}
      </div>
      <div className="p-3 bg-slate-50 flex gap-2 justify-end">
        <button onClick={() => onEdit(mcq)} className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors touch-target" title="Edit"><Edit3 className="w-4 h-4" /></button>
        <button onClick={() => onDuplicate(mcq)} className="p-1.5 rounded-lg hover:bg-white text-slate-600 hover:text-slate-900 transition-colors touch-target" title="Duplicate"><Copy className="w-4 h-4" /></button>
        <button onClick={() => onDelete(mcq.id)} className="p-1.5 rounded-lg hover:bg-white text-red-600 hover:text-red-700 transition-colors touch-target" title="Delete"><Trash2 className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
