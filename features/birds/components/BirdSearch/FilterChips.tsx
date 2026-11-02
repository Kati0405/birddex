import { X } from 'lucide-react';

export interface FilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

export default function FilterChips({ chips }: { chips: FilterChip[] }) {
  if (chips.length === 0) return null;

  return (
    <div className='flex flex-wrap items-center gap-1.5'>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type='button'
          onClick={chip.onRemove}
          className='group inline-flex cursor-pointer items-center gap-1 rounded-full bg-muted pl-2.5 pr-1.5 py-1 text-xs font-medium text-foreground capitalize transition-colors hover:bg-muted/70'
        >
          {chip.label}
          <X size={12} className='text-muted-foreground group-hover:text-foreground' aria-hidden='true' />
          <span className='sr-only'>Remove {chip.label} filter</span>
        </button>
      ))}
    </div>
  );
}
