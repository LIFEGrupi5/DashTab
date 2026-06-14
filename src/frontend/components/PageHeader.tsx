import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export default function PageHeader({ title, subtitle, action, className = '' }: PageHeaderProps) {
  return (
    <div className={`flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 mb-6 ${className}`.trim()}>
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-foreground">{title}</h1>
        {subtitle ? (
          <p className="text-sm text-neutral-500 dark:text-muted-foreground mt-0.5">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0 w-full sm:w-auto">{action}</div> : null}
    </div>
  );
}
