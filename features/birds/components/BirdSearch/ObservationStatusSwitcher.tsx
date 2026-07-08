import { cn } from '@/shared/lib/cn';

type ObservationFilter = 'all' | 'observed' | 'unobserved';

const OPTIONS: { value: ObservationFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'observed', label: 'Seen' },
  { value: 'unobserved', label: 'Not seen' },
];

interface Props {
  value: ObservationFilter;
  onChange: (value: ObservationFilter) => void;
  className?: string;
}

export default function ObservationStatusSwitcher({ value, onChange, className }: Props) {
  return (
    <div
      role='radiogroup'
      aria-label='Collection status'
      className={cn('inline-flex rounded-full border border-border bg-secondary/60 p-0.5 shrink-0', className)}
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type='button'
          role='radio'
          aria-checked={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap',
            value === opt.value
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
