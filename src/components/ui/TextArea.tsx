import type { TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn('min-h-28 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-brand-500', className)}
    />
  );
}
