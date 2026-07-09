import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { Input } from '@/components/ui/input';

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
    <Input
      type='text'
      placeholder={placeholder}
      value={query}
      onChange={(e) => onQueryChange(e.target.value)}
      className={cn(
        'bg-background border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/60 rounded-full',
        className,
      )}
    />
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

      <div
        className={cn(
          'hidden md:flex flex-col gap-3',
          desktopToolbarStyle
            ? 'mb-5 rounded-xl border border-border bg-card px-4 py-3'
            : 'mb-4',
        )}
      >
        <div className='flex items-center gap-2'>
          {input('max-w-xs')}
          {desktopExtraControls}
        </div>
        {desktopExtraRow}
      </div>
    </>
  );
}
