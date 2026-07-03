import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { getBirdById } from '@/features/birds/bird-queries';
import WikimediaImagePicker from '@/features/birds/components/WikimediaImagePicker/WikimediaImagePicker';
import CloudinaryImagePicker from '@/features/birds/components/CloudinaryImagePicker/CloudinaryImagePicker';
import XenoCantoSoundPicker, { type XenoCantoResult } from '@/features/birds/components/XenoCantoSoundPicker/XenoCantoSoundPicker';
import BirdMetadataEditor from '@/features/birds/components/BirdMetadataEditor/BirdMetadataEditor';
import type { WikimediaImage } from '@/entities/bird-domain';
import { requireAdmin } from '@/features/auth/auth-helpers';
import { locales, type Locale } from '@/i18n/locales';
import { Link } from '@/i18n/navigation';

interface WikimediaResult {
  title: string;
  image: WikimediaImage;
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

async function fetchWikimediaImages(query: string): Promise<WikimediaResult[]> {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrsearch: `filetype:bitmap ${query}`,
    gsrnamespace: '6',
    gsrlimit: '20',
    prop: 'imageinfo',
    iiprop: 'url|user|extmetadata',
    iiurlwidth: '400',
    format: 'json',
    origin: '*',
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

      const rawAuthor = info.extmetadata?.Artist?.value ?? info.user ?? 'Unknown';
      const author = rawAuthor.replace(/<[^>]+>/g, '').trim() || 'Unknown';
      const license = info.extmetadata?.LicenseShortName?.value ?? 'Unknown';

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

function parseLengthToSeconds(length: string): number {
  const parts = length.split(':').map(Number);
  if (parts.some(Number.isNaN)) return Infinity;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

async function fetchXenoCantoRecordings(nameLatin: string): Promise<XenoCantoResult[]> {
  const apiKey = process.env.XENO_CANTO_API_KEY;
  if (!apiKey) return [];

  const params = new URLSearchParams({
    query: `sp:"${nameLatin}" len:"<30"`,
    key: apiKey,
    per_page: '20',
  });

  const res = await fetch(
    `https://xeno-canto.org/api/3/recordings?${params}`,
    { next: { revalidate: 3600 } }
  );

  if (!res.ok) return [];

  const data = await res.json();
  const recordings: unknown[] = data?.recordings ?? [];

  return recordings
    .map((rec) => {
      const r = rec as {
        id: string; file: string; url: string; type: string; q: string;
        length: string; rec: string; cnt: string; lic: string;
        sono?: { small?: string | null };
      };
      return {
        id: r.id,
        fileUrl: r.file,
        pageUrl: r.url,
        type: r.type || 'call',
        quality: r.q || '?',
        length: r.length,
        recordist: r.rec,
        country: r.cnt,
        sonogramUrl: r.sono?.small ?? null,
        license: r.lic,
      };
    })
    .filter((r) => parseLengthToSeconds(r.length) <= 30);
}

export default async function BirdEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale; id: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();

  const { locale, id } = await params;
  setRequestLocale(locale);

  const { q } = await searchParams;

  const bird = await getBirdById(Number(id));
  if (!bird) notFound();

  const query = q ?? bird.name_latin;
  const results = await fetchWikimediaImages(query);
  const soundResults = await fetchXenoCantoRecordings(bird.name_latin);

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

        <CloudinaryImagePicker birdId={bird.id} />

        <div className="relative flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">or search Wikimedia</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <WikimediaImagePicker
          birdId={bird.id}
          results={results}
          currentImage={bird.selected_image}
        />

        <div className="relative flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">find sound — xeno-canto</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <XenoCantoSoundPicker
          birdId={bird.id}
          results={soundResults}
          currentSoundUrl={bird.sound_url}
        />

        <BirdMetadataEditor
          birdId={bird.id}
          nameEng={bird.name_eng}
          nameLatin={bird.name_latin}
          currentRarity={bird.rarity}
          currentFood={bird.food}
          currentBiomes={bird.biomes}
          currentBehaviour={bird.behaviour}
          currentBestMonths={bird.best_months ?? []}
          currentFieldNote={bird.field_note ?? ''}
          currentTipsToFind={bird.tips_to_find ?? []}
          currentFieldMarks={bird.field_marks ?? []}
          currentSoundUrl={bird.sound_url}
        />
      </div>
    </main>
  );
}
