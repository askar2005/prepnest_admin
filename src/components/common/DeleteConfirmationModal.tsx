import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
};

export function DeleteConfirmationModal({ open, title, message, confirmLabel = 'Delete', cancelLabel = 'Cancel', variant = 'danger', onConfirm, onCancel }: Props) {
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onCancel}>
      <div className="w-full max-w-md rounded-[16px] border border-slate-200 bg-white p-6 shadow-soft mx-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
        </div>
        <p className="text-sm text-slate-600">{message}</p>
        <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-3">
          <Button variant="secondary" onClick={onCancel} className="w-full sm:w-auto">{cancelLabel}</Button>
          <Button variant={variant} onClick={onConfirm} className="w-full sm:w-auto">{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
