import Link from 'next/link';
import { MapPin, Calendar } from 'lucide-react';
import type { Bird } from '@/entities/bird-domain';
import BirdImage from '@/features/birds/components/BirdImage/BirdImage';

export default function LandingCollectionPreview({ birds }: { birds: Bird[] }) {
  const shown = birds.slice(0, 4);
  const remaining = Math.max(birds.length - shown.length, 0);

  return (
    <div className='w-full max-w-[300px] rounded-xl border border-border bg-card p-4 shadow-lg mx-auto sm:mx-0'>
      <div className='flex items-center justify-between mb-3'>
        <h3 className='font-heading text-sm font-bold text-card-foreground'>My collection</h3>
        <Link
          href='/birds'
          className='font-mono text-[10px] uppercase tracking-[0.1em] text-primary no-underline hover:underline whitespace-nowrap'
        >
          View all &rarr;
        </Link>
      </div>

      <p className='font-heading text-3xl font-bold text-primary leading-none mb-0.5'>
        {birds.length}
      </p>
      <p className='text-xs text-muted-foreground mb-3'>species spotted</p>

      <div className='flex items-center gap-2 mb-3'>
        {shown.map((bird) => (
          <div
            key={bird.id}
            className='w-11 h-11 rounded-md overflow-hidden border border-border shrink-0'
          >
            <BirdImage
              imageUrl={bird.image_url}
              selectedImage={bird.selected_image}
              className='w-full h-full'
              hideAttribution
            />
          </div>
        ))}
        {remaining > 0 && (
          <div className='w-11 h-11 rounded-md border border-border bg-secondary flex items-center justify-center shrink-0'>
            <span className='text-xs font-mono text-muted-foreground'>+{remaining}</span>
          </div>
        )}
      </div>

      <div className='flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/70 pt-2.5'>
        <span className='inline-flex items-center gap-1'>
          <MapPin className='w-3 h-3' aria-hidden='true' />
          Zhytomyr region
        </span>
        <span className='inline-flex items-center gap-1'>
          <Calendar className='w-3 h-3' aria-hidden='true' />
          Last observation 2 days ago
        </span>
      </div>
    </div>
  );
}
