import type { LucideIcon } from 'lucide-react';
import Button from '@/components/Button';

type Props = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
};

export default function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-muted/40 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-neutral-400 dark:text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-neutral-900 dark:text-foreground mb-1">{title}</h3>
      <p className="text-sm text-neutral-500 dark:text-muted-foreground max-w-xs mb-5">{description}</p>
      {action && (
        <Button onClick={action.onClick} size="sm">
          {action.label}
        </Button>
      )}
    </div>
  );
}
