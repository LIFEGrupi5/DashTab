'use client';

import { useEffect, useRef, type ReactNode } from 'react';

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
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const first = dialogRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    first?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`bg-white dark:bg-card rounded-2xl shadow-xl w-full border border-neutral-100 dark:border-border ${maxWidthClassName}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-border">
          <h2 id="modal-title" className="font-semibold text-neutral-900 dark:text-card-foreground">{title}</h2>
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
