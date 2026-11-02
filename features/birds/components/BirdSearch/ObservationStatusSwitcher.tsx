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
      className={cn('inline-flex h-10 items-center gap-0.5 rounded-lg shrink-0', className)}
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type='button'
          role='radio'
          aria-checked={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'relative cursor-pointer rounded-md px-3 py-1.5 text-xs transition-colors whitespace-nowrap',
            value === opt.value
              ? 'font-bold text-foreground'
              : 'font-normal text-muted-foreground hover:text-foreground',
          )}
        >
          {opt.label}
          {value === opt.value && (
            <span className='absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-primary' />
          )}
        </button>
      ))}
    </div>
  );
}
