"use client";

import Image from "next/image";
import { useTransition } from "react";
import type { WikimediaImage } from "@/lib/types";
import { updateBirdImageAction } from "@/app/birds/[id]/edit/actions";

interface WikimediaResult {
  title: string;
  image: WikimediaImage;
}

interface Props {
  birdId: number;
  results: WikimediaResult[];
  currentImage?: WikimediaImage;
}

export default function WikimediaImagePicker({ birdId, results, currentImage }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleSelect(img: WikimediaImage) {
    startTransition(async () => {
      await updateBirdImageAction({ birdId, selectedImage: img });
    });
  }

  if (results.length === 0) {
    return <p className="text-sm text-muted-foreground">No images found. Try a different search.</p>;
  }

  return (
    <div className="space-y-4">
      {currentImage && (
        <div className="text-sm text-muted-foreground">
          Current:{" "}
          <a href={currentImage.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">
            {currentImage.author} · {currentImage.license}
          </a>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {results.map((r) => (
          <button
            key={r.title}
            onClick={() => handleSelect(r.image)}
            disabled={isPending}
            className="group relative aspect-square overflow-hidden rounded-lg border border-border hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 transition-colors"
          >
            <Image
              src={r.image.thumbnailUrl}
              alt={r.title}
              fill
              unoptimized
              className="object-cover group-hover:scale-105 transition-transform duration-200"
            />
            <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-[9px] text-white leading-tight truncate">
                © {r.image.author}
              </p>
              <p className="text-[9px] text-white/70 leading-tight truncate">
                {r.image.license}
              </p>
            </div>
          </button>
        ))}
      </div>

      {isPending && <p className="text-sm text-muted-foreground">Saving…</p>}
    </div>
  );
}
