import { cn } from '@/shared/lib/cn';

type Props = {
  variant?: 'dot' | 'pill';
  className?: string;
};

export default function AdminBadge({ variant = 'dot', className }: Props) {
  if (variant === 'pill') {
    return (
      <span
        className={cn(
          'shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 text-[9px] font-semibold uppercase tracking-wider',
          className,
        )}
      >
        Admin
      </span>
    );
  }

  return (
    <span
      className={cn(
        'flex items-center justify-center w-3.5 h-3.5 rounded-full bg-amber-500',
        className,
      )}
      aria-hidden="true"
    >
      <svg width="7" height="7" viewBox="0 0 7 7" fill="none" aria-label="Admin">
        <path d="M3.5 0.5L4.3 2.3L6.3 2.5L4.8 3.9L5.2 5.9L3.5 4.9L1.8 5.9L2.2 3.9L0.7 2.5L2.7 2.3Z" fill="white" />
      </svg>
    </span>
  );
}
