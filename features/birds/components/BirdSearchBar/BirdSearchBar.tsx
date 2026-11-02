import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { Input } from '@/shared/ui/primitives/input';

type BirdSearchBarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  placeholder: string;
  /** Extra controls next to the input, e.g. filters/reset buttons or observation switcher. */
  mobileExtraControls?: ReactNode;
  /** Extra row below the input+controls row on mobile, e.g. ObservationStatusSwitcher. */
  mobileExtraRow?: ReactNode;
  desktopExtraControls?: ReactNode;
  /** Content rendered below the desktop toolbar row, e.g. filter chips. */
  desktopExtraRow?: ReactNode;
  topOffsetClassName: string;
};

export default function BirdSearchBar({
  query,
  onQueryChange,
  placeholder,
  mobileExtraControls,
  mobileExtraRow,
  desktopExtraControls,
  desktopExtraRow,
  topOffsetClassName,
}: BirdSearchBarProps) {
  const input = (className: string) => (
    <div className={cn('relative', className)}>
      <Search
        size={16}
        strokeWidth={2}
        className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'
        aria-hidden='true'
      />
      <Input
        type='text'
        placeholder={placeholder}
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        className='h-10 w-full rounded-lg border-transparent bg-muted/40 pl-9 pr-3 text-sm text-foreground shadow-none placeholder:text-muted-foreground focus-visible:ring-primary/40'
      />
    </div>
  );

  return (
    <>
      <div
        className={cn(
          'md:hidden fixed left-0 right-0 z-30 bg-card border-b border-border px-4 py-2.5 flex flex-col gap-2',
          topOffsetClassName,
        )}
      >
        <div className='flex items-center gap-2'>
          {input('flex-1')}
          {mobileExtraControls}
        </div>
        {mobileExtraRow}
      </div>

      <div className='hidden md:block max-w-[1280px] mx-auto px-4 sm:px-[clamp(1rem,4vw,3rem)]'>
        <div className='mb-4 flex flex-col gap-3'>
          <div className='flex items-center gap-2.5'>
            {input('w-full max-w-xs')}
            {desktopExtraControls}
          </div>
          {desktopExtraRow}
        </div>
      </div>
    </>
  );
}
