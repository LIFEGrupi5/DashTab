'use client';

import type { InputHTMLAttributes, ReactNode } from 'react';

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  leftIcon?: ReactNode;
};

export default function TextField({ label, leftIcon, className = '', ...props }: TextFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1.5">{label}</label>
      <div className="relative">
        {leftIcon ? (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
            {leftIcon}
          </span>
        ) : null}
        <input
          className={`w-full ${leftIcon ? 'pl-11' : 'pl-3'} pr-3 py-3 rounded-lg border border-neutral-200 bg-neutral-50 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition ${className}`.trim()}
          {...props}
        />
      </div>
    </div>
  );
}
