'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { Share2, X, Bird, Sparkles } from 'lucide-react';
import { setJournalPhotoOfMonthAction } from '@/features/observations/actions/journal-mutations';
import type { JournalPhotoOption, JournalPhotoOfMonth } from '@/features/observations/journal-queries';

interface Props {
  monthKey: string;
  monthLabel: string;
  speciesCount: number;
  observationCount: number;
  photoOfMonth: JournalPhotoOfMonth | null;
  photoOptions: JournalPhotoOption[];
}

export default function MonthPhotoHighlight({
  monthKey,
  monthLabel,
  speciesCount,
  observationCount,
  photoOfMonth,
  photoOptions,
}: Props) {
  const router = useRouter();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function choose(observationId: string) {
    setError(null);
    startTransition(async () => {
      const result = await setJournalPhotoOfMonthAction({ monthKey, observationId });
      if ('error' in result) {
        setError(result.error);
        return;
      }
      setPickerOpen(false);
      router.refresh();
    });
  }

  return (
    <div className='rounded-xl border border-border bg-card p-4'>
      <div className='flex items-center justify-between gap-2 mb-3'>
        <h2 className='font-heading text-sm font-bold text-card-foreground'>
          Best of {monthLabel}
        </h2>
        <button
          type='button'
          aria-label='Share this month'
          title='Share this month'
          className='flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors'
        >
          <Share2 className='h-4 w-4' />
        </button>
      </div>

      <button
        type='button'
        onClick={() => photoOptions.length > 0 && setPickerOpen(true)}
        disabled={photoOptions.length === 0}
        aria-label={photoOfMonth ? 'Change featured photo' : 'Choose a featured photo'}
        className='group relative block w-full rounded-lg overflow-hidden border border-border text-left disabled:cursor-default'
        style={{ aspectRatio: '4 / 5' }}
      >
        {photoOfMonth ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoOfMonth.photoUrl}
            alt=''
            className='absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]'
          />
        ) : (
          <div className='absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/30 text-center px-4'>
            <Bird className='h-8 w-8 text-muted-foreground/30' />
            <p className='text-xs text-muted-foreground'>
              {photoOptions.length > 0 ? 'Pick a photo to feature' : 'No photos logged this month yet.'}
            </p>
          </div>
        )}

        <div className='absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent pointer-events-none' />

        <div className='absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full bg-black/45 backdrop-blur-sm px-2.5 py-1 text-white'>
          <Sparkles className='h-3 w-3' />
          <span className='text-[10px] font-mono uppercase tracking-wide'>Featured</span>
        </div>

        {photoOptions.length > 0 && (
          <span className='absolute bottom-2.5 right-2.5 rounded-md bg-black/45 backdrop-blur-sm px-2 py-1 text-[9px] font-mono uppercase tracking-wide text-white opacity-0 group-hover:opacity-100 transition-opacity'>
            {photoOfMonth ? 'Change' : 'Choose'}
          </span>
        )}

        <div className='absolute inset-x-0 bottom-0 p-3 text-white'>
          <p className='font-heading text-base font-bold leading-tight'>{monthLabel}</p>
          <p className='text-[11px] opacity-90 mt-0.5'>
            {speciesCount} species &middot; {observationCount} observations
          </p>
        </div>
      </button>

      {pickerOpen && createPortal(
        <div
          className='fixed inset-0 z-[110] flex items-center justify-center p-4'
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={(e) => e.target === e.currentTarget && setPickerOpen(false)}
        >
          <div className='w-full max-w-sm rounded-xl overflow-hidden bg-card border border-border shadow-2xl flex flex-col max-h-[80vh]'>
            <div className='flex items-center gap-2 px-4 py-3 border-b border-border shrink-0'>
              <span className='text-sm font-semibold flex-1'>Choose a photo</span>
              <button
                type='button'
                onClick={() => setPickerOpen(false)}
                aria-label='Close'
                className='text-muted-foreground hover:text-foreground transition-colors'
              >
                <X size={16} />
              </button>
            </div>
            {error && (
              <p className='px-4 pt-2 text-[11px] text-destructive'>{error}</p>
            )}
            <div className='grid grid-cols-3 gap-2 p-3 overflow-y-auto'>
              {photoOptions.map((opt) => (
                <button
                  key={opt.observationId}
                  type='button'
                  disabled={pending}
                  onClick={() => choose(opt.observationId)}
                  aria-label={`Use photo of ${opt.birdName}`}
                  className='aspect-square rounded-md overflow-hidden border border-border hover:border-primary/60 transition-colors disabled:opacity-50'
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={opt.photoUrl} alt={opt.birdName} className='w-full h-full object-cover' />
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
