'use client';

import { useState, useTransition } from 'react';
import { Input } from '@/shared/ui/primitives/input';
import { Button } from '@/shared/ui/primitives/button';
import { setNicknameAction } from '@/features/profile/actions/profile-mutations';

type Props = {
  currentNickname: string | null;
  fullName: string;
};

export default function NicknameForm({ currentNickname, fullName }: Props) {
  const [value, setValue] = useState(currentNickname ?? '');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await setNicknameAction({ nickname: value.trim() === '' ? null : value.trim() });
      if ('error' in result) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-3 rounded-xl border border-border bg-card p-5'>
      <div>
        <label htmlFor='nickname' className='block font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1.5'>
          Nickname
        </label>
        <Input
          id='nickname'
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={fullName}
          maxLength={20}
        />
        <p className='mt-1.5 text-xs text-muted-foreground'>
          Shown instead of your name on photos and to friends. 3-20 letters, numbers, or underscores. Leave blank to use your name ({fullName}).
        </p>
      </div>

      {error && <p className='text-xs text-destructive'>{error}</p>}
      {success && !error && <p className='text-xs text-primary'>Saved.</p>}

      <Button type='submit' disabled={isPending}>
        {isPending ? 'Saving…' : 'Save'}
      </Button>
    </form>
  );
}
