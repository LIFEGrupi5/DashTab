import type { LucideIcon } from 'lucide-react';

type StatCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  subtitle?: string;
};

export default function StatCard({ label, value, icon: Icon, color, subtitle }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-card rounded-xl border border-neutral-200 dark:border-border p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm text-neutral-500 dark:text-muted-foreground leading-snug pr-2">
          {label}
        </span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-3xl font-extrabold text-neutral-900 dark:text-foreground tracking-tight">
        {value}
      </p>
      {subtitle ? (
        <p className="text-sm mt-1.5 text-neutral-400 dark:text-muted-foreground">{subtitle}</p>
      ) : null}
    </div>
  );
}
