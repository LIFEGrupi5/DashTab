'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { motion } from 'framer-motion';

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
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCloseRef.current(); };
    document.addEventListener('keydown', onKey);
    const first = dialogRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    first?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
      role="presentation"
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`bg-white dark:bg-card rounded-2xl shadow-xl w-full border border-neutral-100 dark:border-border ${maxWidthClassName}`}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-border">
          <h2 id="modal-title" className="font-semibold text-neutral-900 dark:text-card-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 dark:text-muted-foreground hover:text-neutral-600 dark:hover:text-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        <div className={`p-5 ${bodyClassName}`.trim()}>{children}</div>
        {footer ? <div className="p-5 pt-0">{footer}</div> : null}
      </motion.div>
    </motion.div>
  );
}
