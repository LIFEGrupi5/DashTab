type StatusBadgeProps = {
  label: string;
  toneClassName: string;
  className?: string;
};

export default function StatusBadge({ label, toneClassName, className = '' }: StatusBadgeProps) {
  return (
    <span
      className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${toneClassName} ${className}`.trim()}
    >
      {label}
    </span>
  );
}
