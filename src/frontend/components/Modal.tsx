'use client';

import type { ReactNode } from 'react';

type ModalProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidthClassName?: string;
  bodyClassName?: string;
};

export default function Modal({
  title,
  onClose,
  children,
  footer,
  maxWidthClassName = 'max-w-sm',
  bodyClassName = 'space-y-3',
}: ModalProps) {
  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white dark:bg-card rounded-2xl shadow-xl w-full border border-neutral-100 dark:border-border ${maxWidthClassName}`}
      >
        <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-border">
          <h2 className="font-semibold text-neutral-900 dark:text-card-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 dark:text-muted-foreground hover:text-neutral-600 dark:hover:text-foreground transition"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        <div className={`p-5 ${bodyClassName}`.trim()}>{children}</div>
        {footer ? <div className="p-5 pt-0">{footer}</div> : null}
      </div>
    </div>
  );
}
