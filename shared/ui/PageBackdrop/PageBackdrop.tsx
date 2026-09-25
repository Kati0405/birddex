import Image from 'next/image';

export default function PageBackdrop({
  children,
  className = '',
  showUpper = true,
}: {
  children: React.ReactNode;
  className?: string;
  showUpper?: boolean;
}) {
  return (
    <main className={`relative min-h-screen bg-card overflow-hidden ${className}`}>
      {showUpper && (
        <Image
          src='/hero/background_upper.png'
          alt=''
          width={1916}
          height={411}
          className='absolute inset-x-0 top-0 w-full h-auto object-cover pointer-events-none select-none'
          aria-hidden='true'
        />
      )}
      <Image
        src='/hero/background_lower.png'
        alt=''
        width={1916}
        height={380}
        className='absolute inset-x-0 bottom-0 w-full h-auto object-cover pointer-events-none select-none'
        aria-hidden='true'
      />
      <div className='relative'>{children}</div>
    </main>
  );
}
