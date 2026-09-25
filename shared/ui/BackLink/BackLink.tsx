'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface Props {
  fallbackHref: string;
  label?: string;
  className?: string;
}

export default function BackLink({ fallbackHref, label = 'Back', className = '' }: Props) {
  const router = useRouter();

  function handleClick() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <button
      type='button'
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer ${className}`}
    >
      <ArrowLeft className='h-4 w-4' />
      {label}
    </button>
  );
}
