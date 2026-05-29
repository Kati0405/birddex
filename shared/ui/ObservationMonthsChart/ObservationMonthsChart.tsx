'use client';

import { useState } from 'react';

const MONTHS = ['J','F','M','A','M','J','J','A','S','O','N','D'];

interface Props {
  bestMonths: number[];
  frameColor?: string;
}

export default function ObservationMonthsChart({ bestMonths = [], frameColor = '#5a7a3a' }: Props) {
  const BASE = frameColor;
  const [hovered, setHovered] = useState<number | null>(null);

  const activeSet = new Set(bestMonths);
  const count = activeSet.size;

  function isPeak(month: number): boolean {
    if (!activeSet.has(month)) return false;
    if (count <= 2) return true;
    const prev = month === 1 ? 12 : month - 1;
    const next = month === 12 ? 1 : month + 1;
    return activeSet.has(prev) && activeSet.has(next);
  }

  return (
    <div className='flex gap-[2px] w-full items-end'>
      {MONTHS.map((label, i) => {
        const month = i + 1;
        const active = activeSet.has(month);
        const peak = isPeak(month);
        const isHovered = hovered === month;

        const barH = peak ? 14 : active ? 10 : 4;

        const bg = peak
          ? `${BASE}cc`
          : active
          ? `${BASE}66`
          : `${BASE}18`;

        return (
          <div
            key={i}
            className='flex flex-col items-center gap-[3px] flex-1 cursor-default'
            onMouseEnter={() => setHovered(month)}
            onMouseLeave={() => setHovered(null)}
          >
            <div
              style={{
                height: barH + (isHovered && active ? 2 : 0),
                background: isHovered && active ? `${BASE}ee` : bg,
                borderRadius: peak ? '3px 3px 2px 2px' : '2px 2px 1px 1px',
                width: '100%',
                transition: 'height 0.15s ease, background 0.15s ease',
                boxShadow: peak ? `0 -1px 4px ${BASE}40` : undefined,
                outline: active && !peak ? `1px dotted ${BASE}35` : undefined,
                outlineOffset: -1,
              }}
            />
            <span
              style={{
                fontSize: 6,
                lineHeight: 1,
                fontFamily: 'var(--font-mono, monospace)',
                letterSpacing: '0.02em',
                color: peak ? `${BASE}bb` : active ? `${BASE}77` : `${BASE}30`,
                transition: 'color 0.15s ease',
                fontWeight: peak ? 700 : 400,
              }}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
