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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl shadow-xl w-full ${maxWidthClassName}`}>
        <div className="flex items-center justify-between p-5 border-b border-neutral-100">
          <h2 className="font-semibold text-neutral-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition"
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
