'use client';

import { useState, useTransition } from 'react';
import { updateBirdSoundUrlAction } from '@/features/birds/actions/bird-mutations';

export interface XenoCantoResult {
  id: string;
  fileUrl: string;
  pageUrl: string;
  type: string;
  quality: string;
  length: string;
  recordist: string;
  country: string;
  sonogramUrl: string | null;
  license: string;
}

interface Props {
  birdId: number;
  results: XenoCantoResult[];
  currentSoundUrl?: string;
}

export default function XenoCantoSoundPicker({ birdId, results, currentSoundUrl }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  function handleSelect(r: XenoCantoResult) {
    setError(null);
    startTransition(async () => {
      const result = await updateBirdSoundUrlAction({ birdId, soundUrl: r.fileUrl });
      if ('error' in result) {
        setError(typeof result.error === 'string' ? result.error : JSON.stringify(result.error));
      }
    });
  }

  if (results.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center rounded-lg border border-border p-2">
        <p className="text-sm text-muted-foreground">No recordings found. Try a different search.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="h-80 overflow-y-auto rounded-lg border border-border p-2 space-y-2">
        {results.map((r) => (
          <div
            key={r.id}
            className="rounded-lg border border-border p-2 hover:border-primary transition-colors space-y-2"
          >
            <div className="flex items-center gap-3">
              {r.sonogramUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.sonogramUrl}
                  alt={`Sonogram of ${r.type} recording`}
                  className="h-10 w-16 shrink-0 rounded object-cover"
                />
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {r.type} <span className="text-muted-foreground font-normal">· Q{r.quality} · {r.length}</span>
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {r.recordist} · {r.country}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPlayingId(playingId === r.id ? null : r.id)}
                className="shrink-0 rounded-md border border-border px-2 py-1 text-xs hover:border-primary transition-colors"
              >
                {playingId === r.id ? 'Hide' : 'Preview'}
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={() => handleSelect(r)}
                className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Use
              </button>
            </div>

            {playingId === r.id && (
              <audio controls autoPlay src={r.fileUrl} className="w-full h-8" />
            )}
          </div>
        ))}
      </div>

      {currentSoundUrl && (
        <p className="text-xs text-muted-foreground">
          Current sound is set. Picking a recording above will replace it.
        </p>
      )}

      {isPending && <p className="text-sm text-muted-foreground">Uploading to Cloudinary…</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
