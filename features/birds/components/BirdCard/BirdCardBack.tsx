'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import rotateImg from '@/components/icons/ui/rotate.svg';
import type { Bird, Difficulty, BestTimeOfDay } from '@/entities/bird-domain';
import ObservationMonthsChart from '@/shared/ui/ObservationMonthsChart/ObservationMonthsChart';
import TipsToFind from '@/shared/ui/TipsToFind/TipsToFind';
import FieldMarks from '@/shared/ui/FieldMarks/FieldMarks';
import SoundButton from '@/shared/ui/SoundButton/SoundButton';
import HexIcon from '@/shared/ui/HexIcon/HexIcon';
import dawnImg from '@/components/icons/day/dawn.png';
import dayImg from '@/components/icons/day/day.png';
import duskImg from '@/components/icons/day/dusk.png';
import nightImg from '@/components/icons/day/night.png';
import type { StaticImageData } from 'next/image';

interface Props {
  bird: Bird;
  frameColor: string;
  isAdmin: boolean;
  onFlip: () => void;
}

type Tab = 'marks' | 'tips';

const DIFFICULTY_LEVELS: Difficulty[] = [
  'beginner',
  'easy',
  'moderate',
  'tricky',
  'good_luck',
];
const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  beginner: 'Beginner',
  easy: 'Easy',
  moderate: 'Moderate',
  tricky: 'Tricky',
  good_luck: 'Good Luck',
};

function ObservationDifficulty({
  difficulty,
  frameColor,
}: {
  difficulty: Difficulty;
  frameColor: string;
}) {
  const level = DIFFICULTY_LEVELS.indexOf(difficulty) + 1;
  return (
    <div className='flex flex-col gap-1'>
      <p
        className='text-[7px] uppercase tracking-[0.18em] font-mono'
        style={{ color: `${frameColor}bb` }}
      >
        Finding difficulty
      </p>
      <div className='flex items-center gap-1'>
        <div className='flex gap-0.5'>
          {DIFFICULTY_LEVELS.map((_, i) => (
            <div
              key={i}
              style={{
                width: 10,
                height: 11,
                clipPath:
                  'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                background: i < level ? `${frameColor}cc` : `${frameColor}18`,
              }}
            />
          ))}
        </div>
        <span
          className='font-mono ml-0.5'
          style={{
            fontSize: 7,
            color: `${frameColor}88`,
            letterSpacing: '0.04em',
          }}
        >
          {DIFFICULTY_LABEL[difficulty]}
        </span>
      </div>
    </div>
  );
}

const TIME_SLOTS: {
  key: keyof BestTimeOfDay;
  label: string;
  img: StaticImageData;
}[] = [
  { key: 'dawn', label: 'Dawn', img: dawnImg },
  { key: 'day', label: 'Day', img: dayImg },
  { key: 'dusk', label: 'Dusk', img: duskImg },
  { key: 'night', label: 'Night', img: nightImg },
];

function BestTimeOfDayRow({
  times,
  frameColor,
}: {
  times: BestTimeOfDay;
  frameColor: string;
}) {
  return (
    <div className='flex flex-col gap-1'>
      <p
        className='text-[7px] uppercase tracking-[0.18em] font-mono'
        style={{ color: `${frameColor}bb` }}
      >
        Best time
      </p>
      <div className='flex gap-1'>
        {TIME_SLOTS.map(({ key, label, img }) => {
          const active = times[key];
          return (
            <div
              key={key}
              className='flex flex-col items-center gap-0.5'
              style={{ opacity: active ? 1 : 0.22 }}
            >
              <HexIcon
                imageSrc={img}
                label={label}
                size={26}
                bgColor={active ? `${frameColor}28` : 'rgba(42,24,8,0.07)'}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function BirdCardBack({
  bird,
  frameColor,
  isAdmin,
  onFlip,
}: Props) {
  const [tab, setTab] = useState<Tab>('tips');

  const hasDifficulty = !!bird.difficulty;
  const hasTimeOfDay = !!bird.best_time_of_day;
  const showBottom = hasDifficulty || hasTimeOfDay;

  return (
    <div
      className='absolute inset-0 rounded-xl [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col gap-2 p-4 overflow-hidden bg-card'
      style={{
        border: `2px solid ${frameColor}70`,
        boxShadow: `0 4px 20px ${frameColor}20`,
      }}
    >
      <div
        className='h-1 w-full absolute top-0 left-0'
        style={{ background: frameColor }}
      />

      {/* Sound button — top right */}
      <div className='absolute top-5 right-3'>
        <SoundButton soundUrl={bird.sound_url} />
      </div>

      {/* Name */}
      <div className='text-center pt-0.5'>
        <p className='text-sm font-semibold text-card-foreground leading-tight'>
          {bird.name_eng}
        </p>
        <p className='text-[9px] italic mt-0.5 text-muted-foreground'>
          {bird.name_latin}
        </p>
      </div>

      {/* Signature behavior */}
      {bird.signature_behavior && (
        <div
          className='rounded-lg px-3 py-2'
          style={{
            background: `${frameColor}10`,
            border: `1px solid ${frameColor}28`,
          }}
        >
          <p
            className='text-[7px] uppercase tracking-[0.18em] font-mono mb-1'
            style={{ color: `${frameColor}bb` }}
          >
            Signature behavior
          </p>
          <p
            className='italic leading-snug'
            style={{
              fontSize: 9.5,
              color: '#2a1808cc',
              fontFamily: 'var(--font-sans)',
            }}
          >
            &ldquo;{bird.signature_behavior}&rdquo;
          </p>
        </div>
      )}

      {/* Best months chart */}
      <div
        className='rounded-lg px-3 pt-2 pb-2'
        style={{
          background: `${frameColor}08`,
          border: `1px solid ${frameColor}22`,
        }}
      >
        <p
          className='text-[7px] uppercase tracking-[0.18em] mb-1.5 font-mono'
          style={{ color: `${frameColor}bb` }}
        >
          Best months to observe
        </p>
        <ObservationMonthsChart bestMonths={bird.best_months ?? []} frameColor={frameColor} />
      </div>

      {/* Tab switcher */}
      <div
        className='rounded-lg overflow-hidden flex flex-col'
        style={{ border: `1px solid ${frameColor}22` }}
      >
        <div className='flex' style={{ background: `${frameColor}08` }}>
          {(['tips', 'marks'] as Tab[]).map((t) => (
            <button
              key={t}
              type='button'
              onClick={() => setTab(t)}
              className='flex-1 py-1 transition-colors duration-150'
              style={{
                fontSize: 7,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-mono, monospace)',
                color: tab === t ? frameColor : `${frameColor}55`,
                background: tab === t ? `${frameColor}16` : 'transparent',
                borderBottom:
                  tab === t
                    ? `1.5px solid ${frameColor}`
                    : `1.5px solid transparent`,
              }}
            >
              {t === 'marks' ? 'Field Marks' : 'How to Find'}
            </button>
          ))}
        </div>
        <div className='p-2'>
          {tab === 'marks' ? (
            <FieldMarks marks={bird.field_marks ?? []} />
          ) : (
            <TipsToFind tips={bird.tips_to_find ?? []} />
          )}
        </div>
      </div>

      {/* Challenge + Best time of day */}
      {showBottom && (
        <div
          className='rounded-lg px-3 py-2 flex items-start justify-between gap-2'
          style={{
            background: `${frameColor}08`,
            border: `1px solid ${frameColor}22`,
          }}
        >
          {hasDifficulty && (
            <ObservationDifficulty
              difficulty={bird.difficulty!}
              frameColor={frameColor}
            />
          )}
          {hasTimeOfDay && (
            <BestTimeOfDayRow
              times={bird.best_time_of_day!}
              frameColor={frameColor}
            />
          )}
        </div>
      )}

      {/* Links */}
      <div className='flex items-center justify-center gap-3 mt-auto'>
        <Link
          href={`/birds/${bird.id}`}
          onClick={(e) => e.stopPropagation()}
          className='text-[10px] underline underline-offset-4 transition-colors text-muted-foreground hover:text-foreground'
        >
          Full profile →
        </Link>
        {isAdmin && (
          <Link
            href={`/birds/${bird.id}/edit`}
            onClick={(e) => e.stopPropagation()}
            className='text-[10px] px-2.5 py-1 rounded border transition-colors text-muted-foreground hover:text-foreground'
            style={{
              borderColor: `${frameColor}60`,
              background: `${frameColor}12`,
            }}
          >
            Edit
          </Link>
        )}
      </div>

      {/* Flip back button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onFlip();
        }}
        title='Flip back'
        aria-label='Flip back'
        className='absolute bottom-2 right-2 flex items-center justify-center rounded-full transition-all hover:opacity-80 active:scale-90'
        style={{
          width: 22,
          height: 22,
          background: `${frameColor}18`,
          border: `1px solid ${frameColor}40`,
        }}
      >
        <Image
          src={rotateImg}
          alt=''
          width={12}
          height={12}
          className='opacity-55'
        />
      </button>
    </div>
  );
}
