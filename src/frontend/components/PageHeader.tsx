import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export default function PageHeader({ title, subtitle, action, className = '' }: PageHeaderProps) {
  return (
    <div className={`flex items-center justify-between mb-6 ${className}`.trim()}>
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
        {subtitle ? <p className="text-sm text-neutral-500 mt-0.5">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
