import Image from 'next/image';

const STEPS = [
  {
    title: '1. Find a bird',
    description: 'In a park, a forest, near your home — birds are everywhere.',
    icon: '/hero/binoculars.png',
  },
  {
    title: '2. Log an observation',
    description: 'Note where and when you saw it.',
    icon: '/hero/note.png',
  },
  {
    title: '3. Build your collection',
    description: 'Unlock new species and learn more about nature.',
    icon: '/hero/trophy.png',
  },
];

export default function LandingHowItWorks() {
  return (
    <section className='border-t border-border/70 bg-card/5 backdrop-blur-sm'>
      <div className='max-w-[1280px] mx-auto px-4 sm:px-[clamp(1rem,4vw,3rem)] py-6 sm:py-8 grid sm:grid-cols-3 gap-6 sm:gap-8'>
        <h2 className='sr-only'>How it works</h2>
        {STEPS.map((step) => (
          <div key={step.title} className='flex items-start gap-4'>
            <div className='w-11 h-11 rounded-full bg-card border border-border flex items-center justify-center shrink-0'>
              <Image
                src={step.icon}
                alt=''
                width={22}
                height={22}
                aria-hidden='true'
              />
            </div>
            <div>
              <h3 className='font-heading text-base font-semibold text-foreground mb-1'>
                {step.title}
              </h3>
              <p className='text-sm text-muted-foreground'>
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
