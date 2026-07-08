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
          className='group inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 pl-2.5 pr-1.5 py-1 text-xs font-medium text-primary capitalize transition-colors hover:bg-primary/15'
        >
          {chip.label}
          <X size={12} className='text-primary/60 group-hover:text-primary' aria-hidden='true' />
          <span className='sr-only'>Remove {chip.label} filter</span>
        </button>
      ))}
    </div>
  );
}
