'use client';

import { useState } from 'react';
import { Share2, Check, Link as LinkIcon, Download, Loader2 } from 'lucide-react';
import { createObservationShareLinkAction } from '@/features/observations/actions/share-mutations';

interface ShareObservationButtonProps {
  observationId: string;
  birdName: string;
  frameColor: string;
  /** Extra classes for the trigger button, so each call site can match its own icon-button sizing. */
  className?: string;
  style?: React.CSSProperties;
  /** Classes for the icon itself (size), so each call site can match its own icon scale. */
  iconClassName?: string;
}

type ShareState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'fallback'; shareUrl: string; imageBlob: Blob }
  | { status: 'copied'; shareUrl: string; imageBlob: Blob };

function canShareFiles(file: File): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.canShare === 'function' &&
    typeof navigator.share === 'function' &&
    navigator.canShare({ files: [file] })
  );
}

export default function ShareObservationButton({
  observationId,
  birdName,
  frameColor,
  className,
  style,
  iconClassName = 'h-3.5 w-3.5',
}: ShareObservationButtonProps) {
  const [state, setState] = useState<ShareState>({ status: 'idle' });

  async function handleShare(e: React.MouseEvent) {
    e.stopPropagation();
    setState({ status: 'loading' });

    const result = await createObservationShareLinkAction({ observationId });
    if ('error' in result) {
      setState({ status: 'error', message: result.error });
      return;
    }

    const shareUrl = `${window.location.origin}/share/observation/${result.shareSlug}`;

    let imageBlob: Blob;
    try {
      const res = await fetch(`${shareUrl}/image`);
      if (!res.ok) throw new Error('Failed to generate share image');
      imageBlob = await res.blob();
    } catch {
      setState({ status: 'error', message: 'Could not generate the share image. You can still copy the link.' });
      return;
    }

    const file = new File([imageBlob], 'observation.png', { type: 'image/png' });

    if (canShareFiles(file)) {
      try {
        await navigator.share({ files: [file], url: shareUrl, title: `${birdName} — birds.in.ua` });
        setState({ status: 'idle' });
      } catch (err) {
        // A user dismissing the native share sheet is a normal cancellation, not an error.
        if (err instanceof DOMException && err.name === 'AbortError') {
          setState({ status: 'idle' });
        } else {
          setState({ status: 'fallback', shareUrl, imageBlob });
        }
      }
      return;
    }

    setState({ status: 'fallback', shareUrl, imageBlob });
  }

  async function copyLink(shareUrl: string, imageBlob: Blob) {
    await navigator.clipboard.writeText(shareUrl);
    setState({ status: 'copied', shareUrl, imageBlob });
  }

  function downloadImage(imageBlob: Blob) {
    const url = URL.createObjectURL(imageBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${birdName.replace(/\s+/g, '-').toLowerCase()}-observation.png`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className='relative inline-flex'>
      <button
        type='button'
        onClick={handleShare}
        disabled={state.status === 'loading'}
        title='Share this observation'
        aria-label={`Share observation of ${birdName}`}
        className={className}
        style={style}
      >
        {state.status === 'loading' ? (
          <Loader2 className={`${iconClassName} animate-spin`} />
        ) : (
          <Share2 className={iconClassName} />
        )}
      </button>

      {state.status === 'error' && (
        <div
          role='alert'
          className='absolute top-full right-0 mt-1 z-10 w-48 rounded-md px-2.5 py-2 text-[10px] font-mono bg-destructive/10 border border-destructive/30 text-destructive'
        >
          {state.message}
        </div>
      )}

      {(state.status === 'fallback' || state.status === 'copied') && (
        <div
          className='absolute top-full right-0 mt-1 z-10 flex flex-col gap-1 rounded-md p-1.5 bg-card border border-border shadow-md'
        >
          <button
            type='button'
            onClick={(e) => { e.stopPropagation(); copyLink(state.shareUrl, state.imageBlob); }}
            className='flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono whitespace-nowrap hover:bg-muted/50 transition-colors'
            style={{ color: frameColor }}
          >
            {state.status === 'copied' ? <Check className='h-3 w-3' /> : <LinkIcon className='h-3 w-3' />}
            {state.status === 'copied' ? 'Copied!' : 'Copy link'}
          </button>
          <button
            type='button'
            onClick={(e) => { e.stopPropagation(); downloadImage(state.imageBlob); }}
            className='flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono whitespace-nowrap hover:bg-muted/50 transition-colors'
            style={{ color: frameColor }}
          >
            <Download className='h-3 w-3' />
            Download image
          </button>
        </div>
      )}
    </div>
  );
}
