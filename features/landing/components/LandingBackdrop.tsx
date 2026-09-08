import Image from 'next/image';

export default function LandingBackdrop({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className='relative bg-card overflow-hidden'>
      <Image
        src='/hero/background_right.png'
        alt=''
        width={958}
        height={411}
        className='absolute top-0 right-0 w-1/2 max-w-none h-auto pointer-events-none select-none'
        aria-hidden='true'
      />
      <Image
        src='/hero/background_lower.png'
        alt=''
        width={1916}
        height={380}
        className='absolute inset-x-0 bottom-0 w-full h-auto object-cover pointer-events-none select-none'
        aria-hidden='true'
      />
      <div className='relative'>{children}</div>
    </div>
  );
}
