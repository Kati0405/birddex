'use client';

import { useState } from 'react';
import Link from 'next/link';
import AdminBadge from '@/shared/ui/AdminBadge/AdminBadge';

type Props = {
  displayName?: string;
  avatarUrl?: string;
  isAdmin: boolean;
};

export default function HeaderAvatarLink({ displayName, avatarUrl, isAdmin }: Props) {
  const [imageFailed, setImageFailed] = useState(false);
  const initial = displayName?.[0]?.toUpperCase() ?? '?';

  return (
    <Link
      href='/account'
      className='relative block shrink-0 no-underline'
      title={displayName}
      aria-label={displayName ? `Account: ${displayName}` : 'Account'}
    >
      {avatarUrl && !imageFailed ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={avatarUrl}
          alt=''
          width={30}
          height={30}
          referrerPolicy='no-referrer'
          onError={() => setImageFailed(true)}
          className='w-[30px] h-[30px] rounded-full object-cover shrink-0'
        />
      ) : (
        <div className='w-[30px] h-[30px] rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center shrink-0'>
          <span className='font-heading text-[13px] font-bold text-primary-foreground leading-none'>
            {initial}
          </span>
        </div>
      )}
      {isAdmin && (
        <AdminBadge className='absolute -top-1 -right-1 border-2 border-card' />
      )}
    </Link>
  );
}
