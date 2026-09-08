import Link from 'next/link';
import Image from 'next/image';
import LandingHowItWorks from './LandingHowItWorks';
import HeroStatIcon from './HeroStatIcon';

export default function LandingHero({ totalBirds }: { totalBirds: number }) {
  return (
    <section className='relative border-b border-border overflow-hidden min-h-[calc(100dvh-62px)] flex flex-col'>
      <Image
        src='/hero/background_hero.png'
        alt=''
        fill
        priority
        className='object-cover object-[100%]'
        sizes='100vw'
      />
      <div className='absolute inset-0 bg-linear-to-b from-card/90 via-card/60 to-card/40 lg:bg-linear-to-r lg:from-card/90 lg:via-card/45 lg:to-card/25' />
      <div className='absolute inset-x-0 bottom-0 h-24 bg-linear-to-b from-transparent to-background' />

      <div className='relative flex-1 flex items-center max-w-[1280px] mx-auto px-4 sm:px-[clamp(1rem,4vw,3rem)] py-8 sm:py-12 grid lg:grid-cols-2 gap-6 lg:gap-16 items-center w-full'>
        <div className='text-center lg:text-left'>
          <p className='font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-4'>
            Your birding journal
          </p>
          <h1 className='font-heading text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] text-foreground mb-5 text-balance'>
            Discover the birds of Ukraine
          </h1>
          <p className='text-lg text-muted-foreground mb-8 max-w-md mx-auto lg:mx-0 text-balance'>
            Find, observe and build your collection.
          </p>
          <div className='flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-6'>
            <Link
              href='/birds'
              className='font-mono text-xs uppercase tracking-[0.15em] text-primary-foreground bg-primary px-6 py-3 rounded-md no-underline font-medium hover:bg-primary/90 transition-colors'
            >
              Browse birds &rarr;
            </Link>
          </div>
          <ul className='flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-1.5 font-mono text-[11px] text-foreground/70 tracking-[0.05em]'>
            <li className='flex items-center gap-1.5'>
              <HeroStatIcon src='/hero/bird.png' alt='bird' />
              {totalBirds} species
            </li>
            <li className='flex items-center gap-1.5'>
              <HeroStatIcon src='/hero/binoculars.png' alt='binoculars' />
              observations
            </li>
            <li className='flex items-center gap-1.5'>
              <HeroStatIcon src='/hero/book.png' alt='book' />
              personal collection
            </li>
          </ul>
        </div>

        <div className='relative w-full max-w-[520px] mx-auto lg:max-w-none aspect-[1448/1086] drop-shadow-[0_24px_48px_rgba(0,0,0,0.18)]'>
          <Image
            src='/hero/cards_cascade.png'
            alt='Sample bird cards: Common Kingfisher, European Robin, Black Stork'
            fill
            priority
            className='object-contain'
            sizes='(max-width: 1024px) 90vw, 50vw'
          />
        </div>
      </div>

      <div className='relative'>
        <LandingHowItWorks />
      </div>
    </section>
  );
}
