'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'success' | 'warning';
type ButtonSize = 'sm' | 'md' | 'icon';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: ReactNode;
};

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary: 'bg-orange-500 text-white hover:bg-orange-600',
  secondary: 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200',
  ghost: 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900',
  success: 'bg-green-50 text-green-700 hover:bg-green-100',
  warning: 'bg-amber-50 text-amber-700 hover:bg-amber-100',
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs font-medium rounded-lg',
  md: 'px-4 py-2.5 text-sm font-semibold rounded-lg',
  icon: 'p-1.5 rounded-lg',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 transition ${VARIANT_STYLES[variant]} ${SIZE_STYLES[size]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
