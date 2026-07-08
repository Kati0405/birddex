'use client';

import { useTranslations } from 'next-intl';

const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

interface Props {
  bestMonths: number[];
  frameColor?: string;
}

export default function ObservationMonthsChart({ bestMonths = [], frameColor = '#5a7a3a' }: Props) {
  const t = useTranslations('Months');
  const BASE = frameColor;

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
      {MONTH_KEYS.map((key, i) => {
        const label = t(key);
        const month = i + 1;
        const active = activeSet.has(month);
        const peak = isPeak(month);

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
          >
            <div
              style={{
                height: barH,
                background: bg,
                borderRadius: peak ? '3px 3px 2px 2px' : '2px 2px 1px 1px',
                width: '100%',
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
