'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import type { MonthKey } from '@/features/observations/journal-month';

const MONTH_ABBR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

interface Props {
  selected: MonthKey;
  current: MonthKey;
  onSelect: (key: MonthKey) => void;
}

export default function MonthPickerPopover({ selected, current, onSelect }: Props) {
  const [year, setYear] = useState(selected.year);
  const yearIsFuture = year > current.year;

  return (
    <div className='p-3 w-56'>
      <div className='flex items-center justify-between mb-2'>
        <button
          type='button'
          onClick={() => setYear((y) => y - 1)}
          aria-label='Previous year'
          className='flex items-center justify-center h-6 w-6 rounded text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors'
        >
          <ChevronLeft className='h-3.5 w-3.5' />
        </button>
        <span className='text-sm font-semibold text-foreground'>{year}</span>
        <button
          type='button'
          onClick={() => !yearIsFuture && setYear((y) => y + 1)}
          disabled={yearIsFuture}
          aria-label='Next year'
          className='flex items-center justify-center h-6 w-6 rounded text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors disabled:opacity-30 disabled:pointer-events-none'
        >
          <ChevronRight className='h-3.5 w-3.5' />
        </button>
      </div>
      <div className='grid grid-cols-3 gap-1'>
        {MONTH_ABBR.map((label, idx) => {
          const month = idx + 1;
          const isFuture = year > current.year || (year === current.year && month > current.month);
          const isSelected = year === selected.year && month === selected.month;
          return (
            <button
              key={label}
              type='button'
              disabled={isFuture}
              onClick={() => onSelect({ year, month })}
              className={cn(
                'rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-secondary/60',
                isFuture && 'opacity-30 pointer-events-none',
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
