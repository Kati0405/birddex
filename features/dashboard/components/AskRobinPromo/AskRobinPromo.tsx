import Link from 'next/link';
import Image from 'next/image';
import { Bird, MessageCircle, Search } from 'lucide-react';

const SAMPLE_QUESTIONS = [
  "What's that bird I saw near the river?",
  'When is the best time to see hoopoes?',
  'How can I tell a magpie from a jackdaw?',
];

export default function AskRobinPromo() {
  return (
    <div className='relative h-full min-w-0 rounded-xl border border-border bg-card p-5 sm:p-6 flex flex-col justify-between overflow-hidden'>
      <Image
        src='/hero/ask-robin.png'
        alt=''
        width={400}
        height={400}
        className='absolute bottom-4 right-4 w-[16rem] h-auto opacity-30 pointer-events-none select-none'
        aria-hidden='true'
      />
      <div className='relative'>
        <div className='flex items-center gap-2 mb-2'>
          <Bird className='h-4 w-4 text-primary' aria-hidden='true' />
          <h2 className='font-heading text-lg font-bold text-card-foreground'>
            Ask Robin
          </h2>
        </div>
        <p className='text-sm text-foreground font-medium'>
          Curious about a bird you&apos;ve seen?
        </p>
        <p className='text-xs text-muted-foreground mt-1.5 text-balance'>
          Ask anything — identification, behaviour, habitat, or when and where
          to look. Robin knows the catalog and your observations.
        </p>
        <Link
          href='/ask-robin'
          className='mt-4 inline-flex items-center justify-center gap-1.5 font-mono text-xs uppercase tracking-[0.15em] text-primary-foreground bg-primary px-4 py-2.5 rounded-md no-underline font-medium hover:bg-primary/90 transition-colors self-start'
        >
          <MessageCircle className='h-3.5 w-3.5' aria-hidden='true' />
          Ask a question
        </Link>
        <div className='mt-4'>
          <p className='font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2'>
            Try asking
          </p>
          <div className='inline-flex flex-col gap-1 max-w-full'>
            {SAMPLE_QUESTIONS.map((question) => (
              <div
                key={question}
                className='flex items-start gap-2 px-2.5 py-1.5 rounded-md bg-muted/30'
              >
                <Search
                  className='h-3 w-3 shrink-0 mt-0.5 text-muted-foreground/70'
                  aria-hidden='true'
                />
                <p className='text-xs text-muted-foreground leading-snug'>
                  {question}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
