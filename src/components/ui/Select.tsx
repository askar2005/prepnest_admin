import type { SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn('h-11 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none focus:border-brand-500', className)}
    >
      {children}
    </select>
  );
}
