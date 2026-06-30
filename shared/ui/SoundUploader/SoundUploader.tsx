'use client';

import { useRef, useState } from 'react';
import { updateBirdSoundUrlAction, updateBirdSoundFileAction } from '@/features/birds/actions/bird-mutations';

interface Props {
  birdId: number;
  currentSoundUrl?: string;
}

export default function SoundUploader({ birdId, currentSoundUrl }: Props) {
  const [soundUrl, setSoundUrl] = useState(currentSoundUrl);
  const [urlInput, setUrlInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleUrlSubmit() {
    if (!urlInput.trim()) return;
    setStatus('saving');
    setError(null);
    const result = await updateBirdSoundUrlAction({ birdId, soundUrl: urlInput.trim() });
    if ('error' in result) {
      setError(typeof result.error === 'string' ? result.error : JSON.stringify(result.error));
      setStatus('error');
    } else {
      setSoundUrl(result.soundUrl);
      setUrlInput('');
      setStatus('idle');
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus('saving');
    setError(null);
    const formData = new FormData();
    formData.set('birdId', String(birdId));
    formData.set('file', file);
    const result = await updateBirdSoundFileAction(formData);
    if ('error' in result) {
      setError(typeof result.error === 'string' ? result.error : JSON.stringify(result.error));
      setStatus('error');
    } else {
      setSoundUrl(result.soundUrl);
      setStatus('idle');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <section className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sound</p>

      {soundUrl && (
        <audio controls src={soundUrl} className="w-full h-9">
          Your browser does not support audio playback.
        </audio>
      )}

      <div className="flex gap-2">
        <input
          type="url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="Paste sound URL (e.g. xeno-canto, Wikimedia)…"
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          type="button"
          disabled={status === 'saving' || !urlInput.trim()}
          onClick={handleUrlSubmit}
          className="shrink-0 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'saving' ? 'Saving…' : 'Save URL'}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/x-m4a,audio/mp4"
          disabled={status === 'saving'}
          onChange={handleFileChange}
          className="flex-1 text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-semibold file:uppercase file:tracking-wide hover:file:bg-muted/80"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </section>
  );
}
