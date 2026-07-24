import type { InputHTMLAttributes } from 'react';

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`h-11 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-brand-500 ${props.className ?? ''}`.trim()} />;
}
