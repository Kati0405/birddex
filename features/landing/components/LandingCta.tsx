import Link from 'next/link';
import { NotebookPen, MapPin, TrendingUp } from 'lucide-react';
import type { Bird } from '@/entities/bird-domain';
import LandingCollectionPreview from './LandingCollectionPreview';

const FEATURES = [
  { icon: NotebookPen, label: 'Log observations' },
  { icon: MapPin, label: 'Save locations' },
  { icon: TrendingUp, label: 'Track your progress' },
];

export default function LandingCta({ birds }: { birds: Bird[] }) {
  return (
    <section className='border-t border-border/70 bg-transparent'>
      <div className='max-w-[1280px] mx-auto px-4 sm:px-[clamp(1rem,4vw,3rem)] py-12 sm:py-16 grid sm:grid-cols-2 items-center gap-8'>
        <div className='text-center sm:text-left'>
          <h2 className='font-heading text-2xl sm:text-3xl font-bold text-foreground'>
            Keep your bird journal
          </h2>
          <p className='text-muted-foreground mt-2 max-w-md mx-auto sm:mx-0'>
            Save your sightings, favourite places, and build your personal collection across
            Ukraine.
          </p>
          <Link
            href='/signup'
            className='inline-block mt-6 font-mono text-xs uppercase tracking-[0.15em] text-primary-foreground bg-primary px-6 py-3 rounded-md no-underline font-medium hover:bg-primary/90 transition-colors whitespace-nowrap'
          >
            Create your collection &rarr;
          </Link>

          <div className='flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-2 mt-6'>
            {FEATURES.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className='inline-flex items-center gap-1.5 text-xs text-muted-foreground'
              >
                <Icon className='w-3.5 h-3.5 text-primary' aria-hidden='true' />
                {label}
              </span>
            ))}
          </div>
        </div>

        <LandingCollectionPreview birds={birds} />
      </div>
    </section>
  );
}
