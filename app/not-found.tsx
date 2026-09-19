import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="flex flex-col items-center gap-4 max-w-sm text-center">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Not found
        </p>
        <p className="text-sm text-muted-foreground">
          This page doesn&apos;t exist or is no longer available.
        </p>
        <Link
          href="/"
          className="px-4 py-2 rounded-md text-[11px] font-mono uppercase tracking-widest border border-border text-foreground hover:bg-muted/40 transition-colors"
        >
          Back to birds.in.ua
        </Link>
      </div>
    </div>
  );
}
