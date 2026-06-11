'use client';

import { useState } from 'react';
import Link from 'next/link';
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
        className='text-[11px] sm:text-[7px] uppercase tracking-[0.18em] font-mono'
        style={{ color: `${frameColor}bb` }}
      >
        Finding difficulty
      </p>
      <div className='flex lg:flex-col items-center lg:items-start gap-1.5 sm:gap-1 lg:gap-0.5'>
        <div className='flex gap-1 sm:gap-0.5'>
          {DIFFICULTY_LEVELS.map((_, i) => (
            <div
              key={i}
              style={{
                width: 14,
                height: 16,
                clipPath:
                  'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                background: i < level ? `${frameColor}cc` : `${frameColor}18`,
              }}
              className='sm:!w-[10px] sm:!h-[11px]'
            />
          ))}
        </div>
        <span
          className='text-[11px] sm:text-[7px] font-mono tracking-[0.04em]'
          style={{ color: `${frameColor}88` }}
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
        className='text-[11px] sm:text-[7px] uppercase tracking-[0.18em] font-mono self-end'
        style={{ color: `${frameColor}bb` }}
      >
        Best time
      </p>
      <div className='flex gap-2 sm:gap-1 lg:scale-75 lg:origin-right lg:-mb-2 sm:mb-0'>
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
                size={36}
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
}: Props) {
  const [tab, setTab] = useState<Tab>('tips');

  const hasDifficulty = !!bird.difficulty;
  const hasTimeOfDay = !!bird.best_time_of_day;
  const showBottom = hasDifficulty || hasTimeOfDay;

  return (
    <div
      className='[grid-area:1/1] absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-xl flex flex-col gap-4 sm:gap-3 p-5 sm:p-4 overflow-hidden bg-card'
      style={{
        border: `2px solid ${frameColor}70`,
        boxShadow: `0 4px 20px ${frameColor}20`,
      }}
    >
      <div
        className='h-1.5 sm:h-1 w-full absolute top-0 left-0'
        style={{ background: frameColor }}
      />

      {/* Sound button — top right */}
      <div className='absolute top-6 sm:top-5 right-4 sm:right-3' onClick={(e) => e.stopPropagation()}>
        <SoundButton soundUrl={bird.sound_url} />
      </div>

      {/* Name */}
      <div className='text-center pt-1'>
        <p className='text-xl sm:text-sm font-semibold text-card-foreground leading-tight'>
          {bird.name_eng}
        </p>
        <p className='text-sm sm:text-[9px] italic mt-1 sm:mt-0.5 text-muted-foreground'>
          {bird.name_latin}
        </p>
      </div>

      {/* Signature behavior */}
      {bird.signature_behavior && (
        <div
          className='rounded-lg px-4 sm:px-3 py-3 sm:py-2'
          style={{
            background: `${frameColor}10`,
            border: `1px solid ${frameColor}28`,
          }}
        >
          <p
            className='text-[11px] sm:text-[7px] uppercase tracking-[0.18em] font-mono mb-1.5 sm:mb-1'
            style={{ color: `${frameColor}bb` }}
          >
            Signature behavior
          </p>
          <p
            className='italic leading-snug text-sm sm:text-[9.5px]'
            style={{
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
        className='rounded-lg px-4 sm:px-3 pt-3 sm:pt-2 pb-3 sm:pb-2'
        style={{
          background: `${frameColor}08`,
          border: `1px solid ${frameColor}22`,
        }}
      >
        <p
          className='text-[11px] sm:text-[7px] uppercase tracking-[0.18em] mb-2 sm:mb-1.5 font-mono'
          style={{ color: `${frameColor}bb` }}
        >
          Best months to observe
        </p>
        <ObservationMonthsChart bestMonths={bird.best_months ?? []} frameColor={frameColor} />
      </div>

      {/* Tab switcher */}
      <div
        className='rounded-lg flex flex-col flex-1 min-h-0'
        style={{ border: `1px solid ${frameColor}22` }}
      >
        <div
          className='flex shrink-0 rounded-t-lg overflow-hidden'
          style={{ background: `${frameColor}08` }}
        >
          {(['tips', 'marks'] as Tab[]).map((t) => (
            <button
              key={t}
              type='button'
              onClick={(e) => { e.stopPropagation(); setTab(t); }}
              className='flex-1 py-2 sm:py-1 text-[11px] sm:text-[7px] uppercase tracking-[0.16em] font-mono transition-colors duration-150'
              style={{
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
        <div className='p-3 sm:p-2 flex-1 overflow-auto'>
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
          className='rounded-lg px-4 sm:px-3 py-3 sm:py-2 flex items-start justify-between gap-2'
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
      <div className='flex items-center justify-center gap-3 pb-2'>
        {isAdmin && (
          <Link
            href={`/birds/${bird.id}/edit`}
            onClick={(e) => e.stopPropagation()}
            className='text-sm sm:text-xs px-3 sm:px-2.5 py-2 sm:py-1.5 rounded border transition-colors text-muted-foreground hover:text-foreground'
            style={{
              borderColor: `${frameColor}60`,
              background: `${frameColor}12`,
            }}
          >
            Edit
          </Link>
        )}
      </div>

    </div>
  );
}
