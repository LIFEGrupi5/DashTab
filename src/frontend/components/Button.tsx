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
  primary: 'bg-orange-500 text-white hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-500',
  secondary:
    'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-secondary dark:text-secondary-foreground dark:hover:bg-muted',
  ghost:
    'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-muted-foreground dark:hover:bg-muted/30 dark:hover:text-foreground',
  success:
    'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-950/40 dark:text-green-200 dark:border dark:border-green-800/50 dark:hover:bg-green-950/60',
  warning:
    'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/35 dark:text-amber-200 dark:border dark:border-amber-900/45 dark:hover:bg-amber-950/55',
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
      className={`inline-flex items-center justify-center gap-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 ${VARIANT_STYLES[variant]} ${SIZE_STYLES[size]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
