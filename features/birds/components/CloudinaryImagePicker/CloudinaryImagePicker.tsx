'use client';

import { useRef, useState, useTransition } from 'react';
import { uploadBirdImageAction } from '@/features/birds/actions/cloudinary-upload';

interface Props {
  birdId: number;
}

export default function CloudinaryImagePicker({ birdId }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setError(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('birdId', String(birdId));

    startTransition(async () => {
      const result = await uploadBirdImageAction(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-6">
      <h2 className="text-base font-bold">Upload photo</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div
          onClick={() => inputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-background p-8 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Preview" className="max-h-48 rounded-md object-contain" />
          ) : (
            <>
              <span className="text-2xl">📷</span>
              <span>Click to choose a file</span>
              <span className="text-xs">JPG, PNG, WebP — max 10 MB</span>
            </>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={!preview || isPending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? 'Uploading…' : 'Upload to Cloudinary'}
        </button>
      </form>
    </div>
  );
}
