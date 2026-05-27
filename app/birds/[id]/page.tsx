import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getBirdById } from '@/lib/birds';
import { RARITY_COLOR } from '@/lib/rarity';
import { getUser, getUserRole } from '@/lib/auth';
import { checkIfCollected } from '@/lib/collection';
import CollectButton from '@/components/CollectButton';
import { biomeImage } from '@/lib/biome';
import { foodImage } from '@/lib/food';
import BirdImage from '@/components/BirdImage';
import HexIcon from '@/components/HexIcon';
import ObservationMonthsChart from '@/components/ObservationMonthsChart';
import SoundButton from '@/components/SoundButton';
import wingImg from '@/components/icons/ui/wing.png';
import behaviourFish from '@/components/icons/behaviour/fish.svg';
import behaviourSong from '@/components/icons/behaviour/song.svg';
import behaviourMimic from '@/components/icons/behaviour/mimic.svg';
import behaviourNocturnal from '@/components/icons/behaviour/nocturnal.svg';
import behaviourBerry from '@/components/icons/behaviour/berry.svg';
import behaviourPredator from '@/components/icons/behaviour/predator.svg';
import behaviourUrban from '@/components/icons/behaviour/urban.svg';
import behaviourTerritorial from '@/components/icons/behaviour/territorial.svg';
import behaviourFast from '@/components/icons/behaviour/fast.svg';
import behaviourSecretive from '@/components/icons/behaviour/secretive.svg';
import behaviourGhost from '@/components/icons/behaviour/ghost.svg';
import behaviourFlock from '@/components/icons/behaviour/flock.svg';

const BEHAVIOUR_ICON: Record<string, string> = {
  nocturnal: behaviourNocturnal,
  predator: behaviourPredator,
  songbird: behaviourSong,
  mimic: behaviourMimic,
  'flock bird': behaviourFlock,
  'urban survivor': behaviourUrban,
  'fish hunter': behaviourFish,
  secretive: behaviourSecretive,
  territorial: behaviourTerritorial,
  'fast flyer': behaviourFast,
  'berry lover': behaviourBerry,
  'forest ghost': behaviourGhost,
};

const PAPER_BG = 'linear-gradient(170deg, #faf6ed 0%, #f0e6cc 45%, #e4d5b0 100%)';
const PAPER_MID = '#eadfc6';
const INK = '#2a1808';
const INK_MED = '#6b5030';
const INK_LIGHT = '#8a6c44';
const DIVIDER = '#c4a87840';

export const dynamic = 'force-dynamic';

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

        {/* Card shell */}
        <div
          className="relative rounded-xl overflow-hidden flex flex-col"
          style={{
            border: `2px solid ${frameColor}70`,
            boxShadow: `0 4px 32px ${frameColor}25`,
            background: PAPER_BG,
          }}
        >
          {/* Rarity colour band */}
          <div className="h-1.5 w-full shrink-0" style={{ background: frameColor }} />

          {/* Name row */}
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

          {/* Image */}
          <BirdImage
            imageUrl={bird.image_url}
            selectedImage={bird.selected_image}
            className="mx-3 rounded-lg"
            fadeColor={PAPER_MID}
            style={{ height: 320 }}
          />

          {/* Icon row: food left, biomes right */}
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

          {/* Divider */}
          <div className="mx-4 my-2 h-px" style={{ background: DIVIDER }} />

          {/* Field note */}
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

          {/* Behaviour tags */}
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
                  {BEHAVIOUR_ICON[b] && (
                    <Image src={BEHAVIOUR_ICON[b]} alt="" width={12} height={12} className="opacity-70" />
                  )}
                  {b}
                </span>
              ))}
            </div>
          )}

          {/* Divider */}
          <div className="mx-4 my-1 h-px" style={{ background: DIVIDER }} />

          {/* Best months chart */}
          <div className="px-4 py-3">
            <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: INK_LIGHT }}>
              Best months to observe
            </p>
            <ObservationMonthsChart bestMonths={bird.best_months} />
          </div>

          {/* Wingspan */}
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

          {/* Collect / Edit row */}
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
