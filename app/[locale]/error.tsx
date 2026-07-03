'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="flex flex-col items-center gap-4 max-w-sm text-center">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Something went wrong
        </p>
        <p className="text-sm text-muted-foreground">
          {error.message ?? 'An unexpected error occurred.'}
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 rounded-md text-[11px] font-mono uppercase tracking-widest border border-border text-foreground hover:bg-muted/40 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
