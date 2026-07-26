import { MoreVertical, Edit3, Copy, Trash2, Eye } from 'lucide-react';
import { useState } from 'react';

type Action = {
  label: string;
  icon: any;
  onClick: () => void;
  variant?: 'default' | 'danger';
  shortcut?: string;
};

type Props = {
  actions: Action[];
  itemName?: string;
};

export function ActionMenu({ actions, itemName }: Props) {
  const [open, setOpen] = useState(false);

  const handleAction = (action: Action, e: React.MouseEvent) => {
    e.stopPropagation();
    action.onClick();
    setOpen(false);
  };

  return (
    <div className="relative inline-block">
      <button onClick={() => setOpen(!open)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors touch-target" title="Actions">
        <MoreVertical size={16} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white shadow-lg z-10 py-1" onClick={(e) => e.stopPropagation()}>
          {actions.map((action, i) => (
            <button key={i} onClick={(e) => handleAction(action, e)} className={`flex items-center gap-2 w-full px-4 py-2 text-sm text-left hover:bg-slate-50 transition-colors ${action.variant === 'danger' ? 'text-red-600 hover:bg-red-50' : 'text-slate-700'}`}>
              <action.icon size={16} /> {action.label} {action.shortcut && <span className="text-slate-400 ml-auto">{action.shortcut}</span>}
            </button>
          ))}
        </div>
      )}

      {open && <div className="fixed inset-0 z-5" onClick={() => setOpen(false)} />}
    </div>
  );
}
