import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(props, ref) {
  return <input ref={ref} {...props} className={`h-11 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-brand-500 ${props.className ?? ''}`.trim()} />;
});
