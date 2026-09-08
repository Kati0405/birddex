import Link from 'next/link';
import type { Bird } from '@/entities/bird-domain';
import LandingBirdCardPreview from './LandingBirdCardPreview';

export default function LandingFeaturedBirds({ birds }: { birds: Bird[] }) {
  if (birds.length === 0) return null;

  return (
    <section className='border-t border-border bg-transparent'>
      <div className='max-w-[1280px] mx-auto px-4 sm:px-[clamp(1rem,4vw,3rem)] py-12 sm:py-16'>
        <div className='flex items-end justify-between gap-4 mb-6'>
          <div>
            <h2 className='font-heading text-2xl sm:text-3xl font-bold text-foreground'>
              Birds nearby
            </h2>
            <p className='text-sm text-muted-foreground mt-1'>
              Familiar species you might spot right now.
            </p>
          </div>
          <Link
            href='/birds'
            className='font-mono text-[11px] uppercase tracking-[0.15em] text-primary no-underline font-medium hover:underline whitespace-nowrap'
          >
            View all birds &rarr;
          </Link>
        </div>

        <div className='flex sm:grid sm:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto sm:overflow-visible no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0'>
          {birds.map((bird) => (
            <div key={bird.id} className='w-[42vw] shrink-0 sm:w-auto sm:shrink'>
              <LandingBirdCardPreview bird={bird} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
