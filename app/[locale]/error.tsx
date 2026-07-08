'use client';

import { useTranslations } from 'next-intl';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const tErrors = useTranslations('Errors');
  const tCommon = useTranslations('Common');

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="flex flex-col items-center gap-4 max-w-sm text-center">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          {tErrors('somethingWentWrong')}
        </p>
        <p className="text-sm text-muted-foreground">
          {error.message ?? tErrors('unexpectedError')}
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 rounded-md text-[11px] font-mono uppercase tracking-widest border border-border text-foreground hover:bg-muted/40 transition-colors"
        >
          {tCommon('tryAgain')}
        </button>
      </div>
    </div>
  );
}
