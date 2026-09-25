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
  /** Wraps the desktop bar in the card/border toolbar style. Defaults to false. */
  desktopToolbarStyle?: boolean;
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
  desktopToolbarStyle = false,
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
        className='h-10 w-full rounded-lg border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/50'
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
        <div
          className={cn(
            'flex flex-col gap-3',
            desktopToolbarStyle
              ? 'mb-5 rounded-xl border border-border bg-card px-4 py-3 shadow-sm shadow-black/[0.03]'
              : 'mb-4',
          )}
        >
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
