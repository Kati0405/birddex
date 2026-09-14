'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { Badge } from '@/shared/ui/primitives/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/primitives/popover';
import MonthPickerPopover from './MonthPickerPopover';
import { currentMonthKey, monthKeyToString, MONTH_NAMES, type MonthKey } from '@/features/observations/journal-month';

function addMonths({ year, month }: MonthKey, delta: number): MonthKey {
  const total = (year * 12 + (month - 1)) + delta;
  return { year: Math.floor(total / 12), month: (total % 12) + 1 };
}

function isSameMonth(a: MonthKey, b: MonthKey): boolean {
  return a.year === b.year && a.month === b.month;
}

function isFutureMonth(a: MonthKey, current: MonthKey): boolean {
  return a.year > current.year || (a.year === current.year && a.month > current.month);
}

interface Props {
  selected: MonthKey;
}

export default function MonthNav({ selected }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = currentMonthKey();

  function goTo(key: MonthKey) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('month', monthKeyToString(key));
    router.push(`${pathname}?${params.toString()}`);
  }

  const prev = addMonths(selected, -1);
  const next = addMonths(selected, 1);
  const nextDisabled = isFutureMonth(next, current) && !isSameMonth(next, current);
  const isThisMonth = isSameMonth(selected, current);

  const prevLabel = `Go to ${MONTH_NAMES[prev.month - 1]} ${prev.year}`;
  const nextLabel = nextDisabled ? 'No future months available' : `Go to ${MONTH_NAMES[next.month - 1]} ${next.year}`;

  return (
    <div className='flex items-center justify-between py-2'>
      <button
        type='button'
        onClick={() => goTo(prev)}
        aria-label={prevLabel}
        title={prevLabel}
        className='flex items-center justify-center h-9 w-9 rounded-lg border border-border bg-card text-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/10 transition-colors'
      >
        <ChevronLeft className='h-4 w-4' />
      </button>

      <Popover>
        <PopoverTrigger render={
          <button
            type='button'
            className='flex items-center gap-2 px-2 py-1 rounded-md hover:bg-secondary/60 transition-colors'
          >
            <span className='font-heading text-xl font-bold text-foreground'>
              {MONTH_NAMES[selected.month - 1]} {selected.year}
            </span>
            <ChevronDown className='h-4 w-4 text-muted-foreground' aria-hidden='true' />
            {isThisMonth && (
              <Badge variant='secondary' className='font-normal'>This month</Badge>
            )}
          </button>
        } />
        <PopoverContent className='w-auto p-0' align='center'>
          <MonthPickerPopover selected={selected} current={current} onSelect={goTo} />
        </PopoverContent>
      </Popover>

      <button
        type='button'
        onClick={() => !nextDisabled && goTo(next)}
        disabled={nextDisabled}
        aria-label={nextLabel}
        title={nextLabel}
        className='flex items-center justify-center h-9 w-9 rounded-lg border border-border bg-card text-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-30 disabled:pointer-events-none'
      >
        <ChevronRight className='h-4 w-4' />
      </button>
    </div>
  );
}
