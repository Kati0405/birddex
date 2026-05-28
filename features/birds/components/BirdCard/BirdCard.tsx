'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/shared/lib/cn';
import { biomeImage, foodImage, behaviourImage } from '@/entities/bird-domain';
import wingImg from '@/components/icons/ui/wing.png';
import birdImg from '@/components/icons/ui/bird.png';
import type { Bird } from '@/entities/bird-domain';
import { RARITY_COLOR } from '@/entities/bird-domain';
import BirdImage from '@/features/birds/components/BirdImage/BirdImage';
import SoundButton from '@/shared/ui/SoundButton/SoundButton';
import HexIcon from '@/shared/ui/HexIcon/HexIcon';
import ObservationButton from '@/features/observations/components/ObservationButton/ObservationButton';

const PAPER_BG =
  'linear-gradient(170deg, #faf6ed 0%, #f0e6cc 45%, #e4d5b0 100%)';
const PAPER_MID = '#eadfc6';
const INK = '#2a1808';
const INK_MED = '#6b5030';
const INK_LIGHT = '#8a6c44';
const DIVIDER = '#c4a87840';

export default function BirdCard({
  bird,
  isAdmin = false,
  isObserved = false,
  isAuthenticated = false,
}: {
  bird: Bird;
  isAdmin?: boolean;
  isObserved?: boolean;
  isAuthenticated?: boolean;
}) {
  const [flipped, setFlipped] = useState(false);
  const frameColor = RARITY_COLOR[bird.rarity];

  const cardStyle = {
    border: `2px solid ${frameColor}70`,
    boxShadow: `0 4px 20px ${frameColor}20`,
    background: PAPER_BG,
  };

  return (
    <div className='[perspective:1000px] w-full aspect-[5/7]'>
      <div
        className={cn(
          'relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d]',
          flipped && '[transform:rotateY(180deg)]',
        )}
      >
        {/* ── FRONT ── */}
        <div
          className='absolute inset-0 rounded-xl [backface-visibility:hidden] flex flex-col overflow-hidden'
          style={cardStyle}
        >
          {/* Rarity colour band */}
          <div
            className='h-1 w-full shrink-0'
            style={{ background: frameColor }}
          />

          {/* Name row */}
          <div className='pl-10 pr-3 pt-4 pb-1 flex items-start justify-between gap-1 shrink-0'>
            <div className='min-w-0 flex-1'>
              <div className='flex items-center gap-1 min-w-0'>
                <h2
                  className='text-sm font-semibold leading-tight truncate'
                  style={{ color: INK }}
                >
                  {bird.name_eng}
                </h2>
                <div className='shrink-0'>
                  <SoundButton soundUrl={bird.sound_url} />
                </div>
              </div>
              <p
                className='text-[10px] italic mt-0.5 truncate'
                style={{ color: INK_MED }}
              >
                {bird.name_latin}
              </p>
            </div>
            {isAuthenticated && (
              <div className='shrink-0 pt-0.5'>
                <ObservationButton
                  birdId={bird.id}
                  birdName={bird.name_eng}
                  frameColor={frameColor}
                  initialObserved={isObserved}
                />
              </div>
            )}
          </div>

          {/* Hexagon rarity gem */}
          <div className='absolute top-5.5 left-5 -translate-x-1/2 z-10'>
            <div
              className='w-[22px] h-[25px] relative'
              style={{
                clipPath:
                  'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                background: `linear-gradient(145deg, rgba(255,255,255,0.95) 0%, ${frameColor} 45%, ${frameColor}bb 100%)`,
                boxShadow: `0 0 7px ${frameColor}90, 0 0 14px ${frameColor}40`,
              }}
            >
              <div
                className='absolute top-1 left-1 w-2 h-1.5'
                style={{
                  clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                  background: 'rgba(255,255,255,0.6)',
                }}
              />
            </div>
          </div>

          {/* Image */}
          <BirdImage
            imageUrl={bird.image_url}
            selectedImage={bird.selected_image}
            className='flex-1 min-h-0 mx-1.5 rounded-md'
            fadeColor={PAPER_MID}
          />

          {/* Icon row: food left, biomes right */}
          <div className='px-1.5 pt-1 pb-0.5 flex items-center justify-between shrink-0'>
            <div className='flex gap-0.5'>
              {bird.food.slice(0, 3).map((f) => (
                <HexIcon key={f} imageSrc={foodImage[f]} label={f} size={36} />
              ))}
            </div>
            <div className='flex gap-0.5'>
              {bird.biomes.slice(0, 3).map((b) => (
                <HexIcon key={b} imageSrc={biomeImage[b]} label={b} size={36} />
              ))}
            </div>
          </div>

          {/* Field note */}
          <div
            className='relative shrink-0  pt-4 pb-2 px-2.5'
            style={{ borderColor: DIVIDER }}
          >
            <div
              className='rounded px-2.5 py-1.5'
              style={{
                border: `1px solid ${frameColor}35`,
              }}
            >
              <div className='flex items-start gap-1.5'>
                <span
                  className='text-base leading-none select-none shrink-0'
                  style={{ color: frameColor, opacity: 0.65 }}
                >
                  ❝
                </span>
                <p
                  className='text-[10px] italic leading-snug line-clamp-2 flex-1'
                  style={{ color: INK_LIGHT }}
                >
                  {bird.field_note}
                </p>
              </div>
            </div>
          </div>

          {/* Behaviour tags */}
          {bird.behaviour.length > 0 && (
            <div className='px-2 pb-1 flex flex-wrap gap-1 shrink-0'>
              {bird.behaviour.map((b) => (
                <span
                  key={b}
                  className='text-[9px] px-1.5 py-0.5 rounded leading-none inline-flex items-center gap-1'
                  style={{
                    background: `${frameColor}18`,
                    border: `1px solid ${frameColor}45`,
                    color: INK_MED,
                  }}
                >
                  {behaviourImage[b] && (
                    <Image
                      src={behaviourImage[b]}
                      alt=''
                      width={10}
                      height={10}
                      className='opacity-70'
                    />
                  )}
                  {b}
                </span>
              ))}
            </div>
          )}

          {/* Wingspan */}
          <div
            className='pl-3 pr-8 pt-1.5 pb-2 flex items-center shrink-0 border-t gap-1'
            style={{ borderColor: DIVIDER }}
          >
            <Image
              src={wingImg}
              alt=''
              width={22}
              height={22}
              style={{
                filter: `brightness(0) saturate(100%) invert(0)`,
                opacity: 0.55,
              }}
            />
            <div
              className='flex-1 h-px'
              style={{
                background: `linear-gradient(to right, ${frameColor}80, ${frameColor}20)`,
              }}
            />
            <span
              className='text-[12px] font-bold tabular-nums px-1.5'
              style={{ color: INK, letterSpacing: '0.02em' }}
            >
              {bird.wingspan}
              <span
                className='text-[9px] font-normal ml-0.5'
                style={{ color: INK_MED }}
              >
                cm
              </span>
            </span>
            <div
              className='flex-1 h-px'
              style={{
                background: `linear-gradient(to left, ${frameColor}80, ${frameColor}20)`,
              }}
            />
            <Image
              src={wingImg}
              alt=''
              width={22}
              height={22}
              style={{ opacity: 0.55 }}
              className='scale-x-[-1]'
            />
          </div>

          {/* Flip button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setFlipped(true);
            }}
            title='Flip card'
            aria-label='Flip card'
            className='absolute bottom-2 right-2 flex items-center justify-center rounded-full transition-all hover:opacity-80 active:scale-90'
            style={{
              width: 22,
              height: 22,
              background: `${frameColor}18`,
              border: `1px solid ${frameColor}40`,
            }}
          >
            <Image
              src={birdImg}
              alt=''
              width={12}
              height={12}
              style={{ opacity: 0.55 }}
            />
          </button>
        </div>

        {/* ── BACK ── */}
        <div
          className='absolute inset-0 rounded-xl [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col items-center justify-center gap-5 p-6 text-center overflow-hidden'
          style={cardStyle}
        >
          <div
            className='h-1 w-full absolute top-0 left-0'
            style={{ background: frameColor }}
          />

          <div>
            <p className='text-sm font-semibold' style={{ color: INK }}>
              {bird.name_eng}
            </p>
            <p className='text-[10px] italic mt-0.5' style={{ color: INK_MED }}>
              {bird.name_latin}
            </p>
          </div>

          <p
            className='text-sm italic font-medium leading-relaxed'
            style={{ color: INK_MED }}
          >
            &ldquo;{bird.field_note}&rdquo;
          </p>

          <div className='flex items-center gap-3'>
            <Link
              href={`/birds/${bird.id}`}
              onClick={(e) => e.stopPropagation()}
              className='text-[10px] underline underline-offset-4 transition-colors'
              style={{ color: INK_LIGHT }}
            >
              Full profile →
            </Link>
            {isAdmin && (
              <Link
                href={`/birds/${bird.id}/edit`}
                onClick={(e) => e.stopPropagation()}
                className='text-[10px] px-2.5 py-1 rounded border transition-colors'
                style={{
                  color: INK_MED,
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
              setFlipped(false);
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
              src={birdImg}
              alt=''
              width={12}
              height={12}
              style={{ opacity: 0.55 }}
              className='scale-x-[-1]'
            />
          </button>
        </div>
      </div>
    </div>
  );
}
