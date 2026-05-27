import { notFound } from "next/navigation";
import Link from "next/link";
import { getBirdById } from "@/lib/birds";
import WikimediaImagePicker from "@/components/WikimediaImagePicker";
import BirdMetadataEditor from "@/components/BirdMetadataEditor";
import type { WikimediaImage } from "@/lib/types";
import { requireAdmin } from "@/lib/auth";

interface WikimediaResult {
  title: string;
  image: WikimediaImage;
}

async function fetchWikimediaImages(query: string): Promise<WikimediaResult[]> {
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: `filetype:bitmap ${query}`,
    gsrnamespace: "6",
    gsrlimit: "20",
    prop: "imageinfo",
    iiprop: "url|user|extmetadata",
    iiurlwidth: "400",
    format: "json",
    origin: "*",
  });

  const res = await fetch(
    `https://commons.wikimedia.org/w/api.php?${params}`,
    { next: { revalidate: 3600 } }
  );

  if (!res.ok) return [];

  const data = await res.json();
  const pages: Record<string, unknown> = data?.query?.pages ?? {};

  return Object.values(pages)
    .map((page) => {
      const p = page as {
        title: string;
        imageinfo?: Array<{
          url: string;
          thumburl: string;
          descriptionurl: string;
          user: string;
          extmetadata?: {
            LicenseShortName?: { value: string };
            Artist?: { value: string };
          };
        }>;
      };
      const info = p.imageinfo?.[0];
      if (!info) return null;

      const rawAuthor = info.extmetadata?.Artist?.value ?? info.user ?? "Unknown";
      // Strip HTML tags from author field (Wikimedia often returns HTML here)
      const author = rawAuthor.replace(/<[^>]+>/g, "").trim() || "Unknown";
      const license = info.extmetadata?.LicenseShortName?.value ?? "Unknown";

      return {
        title: p.title,
        image: {
          imageUrl: info.url,
          thumbnailUrl: info.thumburl ?? info.url,
          author,
          license,
          sourceUrl: info.descriptionurl,
        } satisfies WikimediaImage,
      };
    })
    .filter((r): r is WikimediaResult => r !== null);
}

export default async function BirdEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  const { q } = await searchParams;

  const bird = await getBirdById(Number(id));
  if (!bird) notFound();

  const query = q ?? bird.name_latin;
  const results = await fetchWikimediaImages(query);

  return (
    <main className="min-h-screen bg-background px-4 py-12 sm:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link
          href={`/birds/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to {bird.name_eng}
        </Link>

        <div>
          <h1 className="text-xl font-black">Pick photo — {bird.name_eng}</h1>
          <p className="text-sm italic text-muted-foreground">{bird.name_latin}</p>
        </div>

        {/* Search form — navigates to same page with ?q= */}
        <form method="get" className="flex gap-2">
          <input
            name="q"
            defaultValue={query}
            placeholder="Search Wikimedia Commons…"
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Search
          </button>
        </form>

        <WikimediaImagePicker
          birdId={bird.id}
          results={results}
          currentImage={bird.selected_image}
        />

        <BirdMetadataEditor
          birdId={bird.id}
          currentFood={bird.food}
          currentBiomes={bird.biomes}
          currentBehaviour={bird.behaviour}
        />
      </div>
    </main>
  );
}
