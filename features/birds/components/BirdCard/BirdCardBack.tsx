'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/cn';
import type { Bird, Difficulty, BestTimeOfDay } from '@/entities/bird-domain';
import ObservationMonthsChart from '@/shared/ui/ObservationMonthsChart/ObservationMonthsChart';
import TipsToFind from '@/shared/ui/TipsToFind/TipsToFind';
import FieldMarks from '@/shared/ui/FieldMarks/FieldMarks';
import HexIcon from '@/shared/ui/HexIcon/HexIcon';
import dawnImg from '@/components/icons/day/dawn.png';
import dayImg from '@/components/icons/day/day.png';
import duskImg from '@/components/icons/day/dusk.png';
import nightImg from '@/components/icons/day/night.png';
import type { StaticImageData } from 'next/image';
import type { SavedLocation } from '@/features/locations/location-queries';
import type { CollectionCardData } from '@/features/observations/observation-queries';
import BirdCardBackObservation from './BirdCardBackObservation';

interface Props {
  bird: Bird;
  frameColor: string;
  isAdmin: boolean;
  isAuthenticated?: boolean;
  isObserved?: boolean;
  savedLocations?: SavedLocation[];
  collectionData?: CollectionCardData;
  onFlip?: () => void;
  active?: boolean;
  initialObsId?: string;
}

type MainTab = 'field-guide' | 'my-observations';
type FieldTab = 'marks' | 'tips';

const DIFFICULTY_LEVELS: Difficulty[] = [
  'beginner',
  'easy',
  'moderate',
  'tricky',
  'good_luck',
];
const DIFFICULTY_LABEL_KEY: Record<Difficulty, string> = {
  beginner: 'difficultyBeginner',
  easy: 'difficultyEasy',
  moderate: 'difficultyModerate',
  tricky: 'difficultyTricky',
  good_luck: 'difficultyGoodLuck',
};

function ObservationDifficulty({
  difficulty,
  frameColor,
}: {
  difficulty: Difficulty;
  frameColor: string;
}) {
  const t = useTranslations('BirdCard');
  const level = DIFFICULTY_LEVELS.indexOf(difficulty) + 1;
  return (
    <div className='flex flex-col gap-1'>
      <p
        className='text-[11px] sm:text-[7px] uppercase tracking-[0.18em] font-mono'
        style={{ color: `${frameColor}bb` }}
      >
        {t('findingDifficulty')}
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
          {t(DIFFICULTY_LABEL_KEY[difficulty])}
        </span>
      </div>
    </div>
  );
}

const TIME_SLOTS: {
  key: keyof BestTimeOfDay;
  labelKey: string;
  img: StaticImageData;
}[] = [
  { key: 'dawn', labelKey: 'timeDawn', img: dawnImg },
  { key: 'day', labelKey: 'timeDay', img: dayImg },
  { key: 'dusk', labelKey: 'timeDusk', img: duskImg },
  { key: 'night', labelKey: 'timeNight', img: nightImg },
];

function BestTimeOfDayRow({
  times,
  frameColor,
  iconSize = 36,
}: {
  times: BestTimeOfDay;
  frameColor: string;
  iconSize?: number;
}) {
  const t = useTranslations('BirdCard');
  return (
    <div className='flex flex-col gap-1 shrink-0'>
      <p
        className='text-[11px] sm:text-[7px] uppercase tracking-[0.18em] font-mono self-end'
        style={{ color: `${frameColor}bb` }}
      >
        {t('bestTime')}
      </p>
      <div className='flex gap-1'>
        {TIME_SLOTS.map(({ key, labelKey, img }) => {
          const active = times[key];
          return (
            <div
              key={key}
              className='flex flex-col items-center gap-0.5'
              style={{ opacity: active ? 1 : 0.22 }}
            >
              <HexIcon
                imageSrc={img}
                label={t(labelKey)}
                size={iconSize}
                bgColor={active ? `${frameColor}28` : 'rgba(42,24,8,0.07)'}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FieldGuideContent({
  bird,
  frameColor,
}: {
  bird: Bird;
  frameColor: string;
}) {
  const t = useTranslations('BirdCard');
  const [fieldTab, setFieldTab] = useState<FieldTab>('tips');

  const hasDifficulty = !!bird.difficulty;
  const hasTimeOfDay = !!bird.best_time_of_day;
  const showBottom = hasDifficulty || hasTimeOfDay;

  return (
    <div className='flex flex-col gap-4 sm:gap-3 flex-1 min-h-0 overflow-auto px-5 sm:px-4 pb-4 sm:pb-3'>
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
            {t('signatureBehavior')}
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
          {t('bestMonthsToObserve')}
        </p>
        <ObservationMonthsChart bestMonths={bird.best_months ?? []} frameColor={frameColor} />
      </div>

      {/* Inner tab switcher: Field Marks / How to Find */}
      <div
        className='rounded-lg flex flex-col flex-1 min-h-0'
        style={{ border: `1px solid ${frameColor}22` }}
      >
        <div
          className='flex shrink-0 rounded-t-lg overflow-hidden'
          style={{ background: `${frameColor}08` }}
        >
          {(['tips', 'marks'] as FieldTab[]).map((tab) => (
            <button
              key={tab}
              type='button'
              onClick={(e) => { e.stopPropagation(); setFieldTab(tab); }}
              className='flex-1 py-2 sm:py-0.5 text-[11px] sm:text-[7px] uppercase tracking-[0.16em] font-mono transition-colors duration-150'
              style={{
                color: fieldTab === tab ? frameColor : `${frameColor}55`,
                background: fieldTab === tab ? `${frameColor}16` : 'transparent',
                borderBottom:
                  fieldTab === tab
                    ? `1.5px solid ${frameColor}`
                    : `1.5px solid transparent`,
              }}
            >
              {tab === 'marks' ? t('fieldMarksTab') : t('howToFindTab')}
            </button>
          ))}
        </div>
        <div className='p-3 sm:p-2 flex-1 overflow-auto'>
          {fieldTab === 'marks' ? (
            <FieldMarks marks={bird.field_marks ?? []} />
          ) : (
            <TipsToFind tips={bird.tips_to_find ?? []} />
          )}
        </div>
      </div>

      {/* Challenge + Best time of day */}
      {showBottom && (
        <div
          className='rounded-lg px-4 sm:px-2 py-3 sm:py-2 flex items-start justify-between gap-2 overflow-hidden'
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
            <BestTimeOfDayRow times={bird.best_time_of_day!} frameColor={frameColor} iconSize={30} />
          )}
        </div>
      )}

    </div>
  );
}

export default function BirdCardBack({
  bird,
  frameColor,
  isAuthenticated = false,
  isObserved = false,
  savedLocations = [],
  collectionData,
  onFlip,
  active = true,
  initialObsId,
}: Props) {
  const t = useTranslations('BirdCard');
  const defaultTab: MainTab =
    isAuthenticated && isObserved ? 'my-observations' : 'field-guide';
  const [mainTab, setMainTab] = useState<MainTab>(defaultTab);

  return (
    <div
      className={cn(
        '[grid-area:1/1] absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-xl flex flex-col overflow-hidden bg-card',
        !active && 'pointer-events-none',
      )}
      style={{
        border: `2px solid ${frameColor}70`,
        boxShadow: `0 4px 20px ${frameColor}20`,
      }}
      onClick={onFlip}
    >
      {/* Top rarity bar */}
      <div
        className='h-1.5 sm:h-1 w-full shrink-0'
        style={{ background: frameColor }}
      />

      {/* Name */}
      <div className='text-center pt-4 sm:pt-2 pb-2 sm:pb-1 px-5'>
        <p className='text-xl sm:text-xs font-semibold text-card-foreground leading-tight'>
          {bird.name_eng}
        </p>
      </div>

      {/* Main tab bar — only shown for authenticated users */}
      {isAuthenticated && (
        <div
          className='flex shrink-0 mx-4 sm:mx-3 rounded-t-lg overflow-hidden mb-3 sm:mb-1.5'
          style={{ background: `${frameColor}08`, borderBottom: `1px solid ${frameColor}22` }}
        >
          <button
            type='button'
            onClick={(e) => { e.stopPropagation(); setMainTab('field-guide'); }}
            className='flex-1 py-2 sm:py-0.5 text-[11px] sm:text-[7px] uppercase tracking-[0.16em] font-mono transition-colors duration-150'
            style={{
              color: mainTab === 'field-guide' ? frameColor : `${frameColor}55`,
              background: mainTab === 'field-guide' ? `${frameColor}16` : 'transparent',
              borderBottom: mainTab === 'field-guide' ? `1.5px solid ${frameColor}` : '1.5px solid transparent',
            }}
          >
            {t('fieldGuideTab')}
          </button>
          <button
            type='button'
            onClick={(e) => { e.stopPropagation(); setMainTab('my-observations'); }}
            className='flex-1 py-2 sm:py-0.5 text-[11px] sm:text-[7px] uppercase tracking-[0.16em] font-mono transition-colors duration-150'
            style={{
              color: mainTab === 'my-observations' ? frameColor : `${frameColor}55`,
              background: mainTab === 'my-observations' ? `${frameColor}16` : 'transparent',
              borderBottom: mainTab === 'my-observations' ? `1.5px solid ${frameColor}` : '1.5px solid transparent',
            }}
          >
            {t('myObservationsTab')}
          </button>
        </div>
      )}

      {/* Tab content */}
      {!isAuthenticated || mainTab === 'field-guide' ? (
        <FieldGuideContent bird={bird} frameColor={frameColor} />
      ) : (
        <BirdCardBackObservation
          bird={bird}
          frameColor={frameColor}
          collectionData={collectionData}
          savedLocations={savedLocations}
          initialObsId={initialObsId}
        />
      )}
    </div>
  );
}
