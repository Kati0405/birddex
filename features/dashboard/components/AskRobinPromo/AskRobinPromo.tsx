import Link from 'next/link';
import { Bird, MessageCircle } from 'lucide-react';

export default function AskRobinPromo() {
  return (
    <div className='h-full rounded-xl border border-border bg-card p-5 sm:p-6 flex flex-col justify-between'>
      <div>
        <div className='flex items-center gap-2 mb-2'>
          <Bird className='h-4 w-4 text-primary -scale-x-100' aria-hidden='true' />
          <h2 className='font-heading text-lg font-bold text-card-foreground'>Ask Robin</h2>
        </div>
        <p className='text-sm text-foreground font-medium'>Ask anything about birds in Ukraine</p>
        <p className='text-xs text-muted-foreground mt-1.5 text-balance'>
          Identification, behaviour, habitat, and where and when to look — Robin knows the catalog and your
          observations.
        </p>
      </div>

      <Link
        href='/ask-robin'
        className='mt-4 inline-flex items-center justify-center gap-1.5 font-mono text-xs uppercase tracking-[0.15em] text-primary-foreground bg-primary px-4 py-2.5 rounded-md no-underline font-medium hover:bg-primary/90 transition-colors self-start'
      >
        <MessageCircle className='h-3.5 w-3.5' aria-hidden='true' />
        Ask a question
      </Link>
    </div>
  );
}
