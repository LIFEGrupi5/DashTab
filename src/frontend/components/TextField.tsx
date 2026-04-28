'use client';

import { useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  leftIcon?: ReactNode;
};

export default function TextField({ label, leftIcon, className = '', id: externalId, ...props }: TextFieldProps) {
  const generatedId = useId();
  const id = externalId ?? generatedId;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-neutral-700 dark:text-muted-foreground mb-1.5">{label}</label>
      <div className="relative">
        {leftIcon ? (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-muted-foreground pointer-events-none">
            {leftIcon}
          </span>
        ) : null}
        <input
          id={id}
          className={`w-full ${leftIcon ? 'pl-11' : 'pl-3'} pr-3 py-3 rounded-lg border border-neutral-200 dark:border-border bg-neutral-50 dark:bg-card text-sm text-neutral-900 dark:text-foreground placeholder:text-neutral-400 dark:placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition ${className}`.trim()}
          {...props}
        />
      </div>
    </div>
  );
}
