import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getBirdById } from '@/features/birds/bird-queries';
import { RARITY_COLOR, foodImage, biomeImage, behaviourImage } from '@/entities/bird-domain';
import { getUser, getUserRole } from '@/features/auth/auth-helpers';
import { checkIfCollected } from '@/features/collection/collection-queries';
import CollectButton from '@/features/collection/components/CollectButton/CollectButton';
import BirdImage from '@/features/birds/components/BirdImage/BirdImage';
import HexIcon from '@/shared/ui/HexIcon/HexIcon';
import ObservationMonthsChart from '@/shared/ui/ObservationMonthsChart/ObservationMonthsChart';
import SoundButton from '@/shared/ui/SoundButton/SoundButton';
import wingImg from '@/components/icons/ui/wing.png';

const PAPER_BG = 'linear-gradient(170deg, #faf6ed 0%, #f0e6cc 45%, #e4d5b0 100%)';
const INK = '#2a1808';
const INK_MED = '#6b5030';
const INK_LIGHT = '#8a6c44';
const DIVIDER = '#c4a87840';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const bird = await getBirdById(Number(id));
  if (!bird) return { title: 'Bird not found — BirdDex' };
  return {
    title: `${bird.name_eng} — BirdDex`,
    description: bird.field_note ?? `${bird.name_eng} (${bird.name_latin}) — ${bird.rarity} species.`,
  };
}

export default async function BirdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [bird, user, role] = await Promise.all([
    getBirdById(Number(id)),
    getUser(),
    getUserRole(),
  ]);
  if (!bird) notFound();

  const isCollected = user ? await checkIfCollected(user.id, bird.id) : false;
  const frameColor = RARITY_COLOR[bird.rarity];

  return (
    <main className="min-h-screen bg-background px-4 py-12 sm:px-8">
      <div className="mx-auto max-w-lg">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to catalog
        </Link>

        <div
          className="relative rounded-xl overflow-hidden flex flex-col"
          style={{
            border: `2px solid ${frameColor}70`,
            boxShadow: `0 4px 32px ${frameColor}25`,
            background: PAPER_BG,
          }}
        >
          <div className="h-1.5 w-full shrink-0" style={{ background: frameColor }} />

          <div className="px-5 pt-5 pb-2 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h1 className="text-xl font-black leading-tight" style={{ color: INK }}>
                {bird.name_eng}
              </h1>
              <p className="text-sm italic mt-0.5" style={{ color: INK_MED }}>
                {bird.name_latin}
              </p>
              <span
                className="inline-block mt-1.5 text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{
                  background: `${frameColor}20`,
                  border: `1px solid ${frameColor}50`,
                  color: frameColor,
                }}
              >
                {bird.rarity}
              </span>
            </div>
            <div className="shrink-0 pt-1">
              <SoundButton soundUrl={bird.sound_url} />
            </div>
          </div>

          <BirdImage
            imageUrl={bird.image_url}
            selectedImage={bird.selected_image}
            className="mx-3 rounded-lg h-80"
          />

          <div className="px-3 pt-3 pb-1 flex items-center justify-between">
            <div className="flex gap-1">
              {bird.food.slice(0, 3).map((f) => (
                <HexIcon key={f} imageSrc={foodImage[f]} label={f} size={44} />
              ))}
            </div>
            <div className="flex gap-1">
              {bird.biomes.slice(0, 3).map((b) => (
                <HexIcon key={b} imageSrc={biomeImage[b]} label={b} size={44} />
              ))}
            </div>
          </div>

          <div className="mx-4 my-2 h-px" style={{ background: DIVIDER }} />

          <div className="px-4 pb-3">
            <div
              className="rounded-lg px-4 py-3"
              style={{ border: `1px solid ${frameColor}35` }}
            >
              <div className="flex items-start gap-2">
                <span className="text-xl leading-none shrink-0 select-none" style={{ color: frameColor, opacity: 0.65 }}>
                  ❝
                </span>
                <p className="text-sm italic leading-relaxed" style={{ color: INK_LIGHT }}>
                  {bird.field_note}
                </p>
              </div>
            </div>
          </div>

          {bird.behaviour.length > 0 && (
            <div className="px-4 pb-3 flex flex-wrap gap-1.5">
              {bird.behaviour.map((b) => (
                <span
                  key={b}
                  className="text-[11px] px-2.5 py-1 rounded-full leading-none inline-flex items-center gap-1.5"
                  style={{
                    background: `${frameColor}18`,
                    border: `1px solid ${frameColor}45`,
                    color: INK_MED,
                  }}
                >
                  {behaviourImage[b] && (
                    <Image src={behaviourImage[b]} alt="" width={12} height={12} className="opacity-70" />
                  )}
                  {b}
                </span>
              ))}
            </div>
          )}

          <div className="mx-4 my-1 h-px" style={{ background: DIVIDER }} />

          <div className="px-4 py-3">
            <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: INK_LIGHT }}>
              Best months to observe
            </p>
            <ObservationMonthsChart bestMonths={bird.best_months} />
          </div>

          <div
            className="px-4 pt-2 pb-4 flex items-center gap-2 border-t"
            style={{ borderColor: DIVIDER }}
          >
            <Image src={wingImg} alt="" width={26} height={26} style={{ opacity: 0.55 }} />
            <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, ${frameColor}80, ${frameColor}20)` }} />
            <span className="text-base font-black tabular-nums px-2" style={{ color: INK }}>
              {bird.wingspan}
              <span className="text-xs font-normal ml-1" style={{ color: INK_MED }}>cm</span>
            </span>
            <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, ${frameColor}80, ${frameColor}20)` }} />
            <Image src={wingImg} alt="" width={26} height={26} style={{ opacity: 0.55 }} className="scale-x-[-1]" />
          </div>

          <div
            className="px-4 pb-4 flex items-center justify-between border-t pt-3"
            style={{ borderColor: DIVIDER }}
          >
            <div>
              {user && (
                <CollectButton
                  birdId={bird.id}
                  initialCollected={isCollected}
                  frameColor={frameColor}
                />
              )}
            </div>
            {role === 'admin' && (
              <Link
                href={`/birds/${bird.id}/edit`}
                className="text-xs underline underline-offset-4 transition-colors"
                style={{ color: INK_LIGHT }}
              >
                Change photo →
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
