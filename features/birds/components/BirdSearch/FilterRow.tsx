import { cn } from '@/shared/lib/cn';

interface Props {
  icon: React.ReactNode;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}

export default function FilterRow({ icon, label, count, active, onClick }: Props) {
  const disabled = count === 0 && !active;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition-colors',
        disabled
          ? 'opacity-40 cursor-not-allowed text-muted-foreground'
          : active
            ? 'bg-muted/60 text-foreground'
            : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground',
      )}
    >
      <span className='flex h-6 w-6 items-center justify-center shrink-0'>{icon}</span>
      <span className='flex-1 capitalize'>{label}</span>
      <span className='text-xs tabular-nums text-muted-foreground'>{count}</span>
    </button>
  );
}
