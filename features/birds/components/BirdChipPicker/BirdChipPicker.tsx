'use client';

import type { StaticImageData } from 'next/image';
import HexIcon from '@/shared/ui/HexIcon/HexIcon';

interface BirdChipPickerProps<T extends string> {
  label: string;
  values: readonly T[];
  imageFor: Record<T, StaticImageData>;
  selected: readonly T[];
  max: number;
  onToggle: (value: T) => void;
}

export default function BirdChipPicker<T extends string>({
  label,
  values,
  imageFor,
  selected,
  max,
  onToggle,
}: BirdChipPickerProps<T>) {
  return (
    <section className='space-y-2'>
      <p className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
        {label}
        <span className='normal-case font-normal ml-1'>
          ({selected.length}/{max})
        </span>
      </p>
      <div className='flex flex-wrap gap-2'>
        {values.map((value) => {
          const isSelected = selected.includes(value);
          const disabled = !isSelected && selected.length >= max;
          return (
            <button
              key={value}
              type='button'
              disabled={disabled}
              aria-pressed={isSelected}
              onClick={() => onToggle(value)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition-colors
                ${
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : disabled
                      ? 'border-border bg-muted text-muted-foreground opacity-40 cursor-not-allowed'
                      : 'border-border bg-background hover:border-primary'
                }`}
            >
              <HexIcon imageSrc={imageFor[value]} label={value} size={22} />
            </button>
          );
        })}
      </div>
    </section>
  );
}
