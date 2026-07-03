'use client';

import { Link } from '@/i18n/navigation';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen bg-background px-4 py-12 sm:px-8">
      <div className="mx-auto max-w-lg flex flex-col items-center gap-4 text-center pt-24">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Failed to load bird
        </p>
        <p className="text-sm text-muted-foreground">
          {error.message ?? 'An unexpected error occurred.'}
        </p>
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="px-4 py-2 rounded-md text-[11px] font-mono uppercase tracking-widest border border-border text-foreground hover:bg-muted/40 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/birds"
            className="px-4 py-2 rounded-md text-[11px] font-mono uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Back to catalog
          </Link>
        </div>
      </div>
    </main>
  );
}
