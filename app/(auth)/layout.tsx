import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className='relative min-h-screen flex items-center justify-center px-4 overflow-hidden'>
      <Image
        src='/hero/login_background.png'
        alt=''
        fill
        priority
        className='object-cover object-[100%]'
        sizes='100vw'
      />
      {children}
    </main>
  );
}
