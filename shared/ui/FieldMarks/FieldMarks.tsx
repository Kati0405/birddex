'use client';

import {
  Eye,
  Feather,
  MoveRight,
  Waves,
  Wind,
  ScanLine,
  Minus,
  Circle,
  Triangle,
  Zap,
} from 'lucide-react';

const ICON_RULES: Array<{ keywords: string[]; icon: React.ReactNode }> = [
  { keywords: ['eye', 'eyes', 'orbital', 'mask', 'cap', 'crown', 'head', 'cheek', 'face'], icon: <Eye size={10} strokeWidth={1.5} /> },
  { keywords: ['stripe', 'streaked', 'barred', 'band', 'collar', 'moustache'], icon: <ScanLine size={10} strokeWidth={1.5} /> },
  { keywords: ['crest', 'tufts', 'tuft'], icon: <Triangle size={10} strokeWidth={1.5} /> },
  { keywords: ['tail', 'rump', 'forked', 'wedge', 'streamer'], icon: <Minus size={10} strokeWidth={1.5} /> },
  { keywords: ['wing', 'wingspan', 'wings', 'sickle', 'pointed', 'rounded', 'broad'], icon: <Wind size={10} strokeWidth={1.5} /> },
  { keywords: ['bill', 'beak', 'curved', 'dagger', 'hooked'], icon: <Zap size={10} strokeWidth={1.5} /> },
  { keywords: ['belly', 'breast', 'chest', 'throat', 'back', 'plumage', 'silky', 'glossy', 'iridescent', 'rainbow'], icon: <Feather size={10} strokeWidth={1.5} /> },
  { keywords: ['flight', 'hover', 'hovering', 'soar', 'glide', 'fly', 'flying', 'movement', 'running', 'climb', 'hops', 'bouncing', 'agile'], icon: <MoveRight size={10} strokeWidth={1.5} /> },
  { keywords: ['patch', 'flash', 'bright', 'orange', 'yellow', 'blue', 'red', 'white', 'black', 'green', 'gray', 'pale', 'dark', 'color', 'colour'], icon: <Circle size={10} strokeWidth={1.5} /> },
  { keywords: ['silhouette', 'shape', 'body', 'massive', 'slender', 'stocky', 'round', 'large', 'long', 'short', 'tiny', 'huge', 'small', 'sound', 'loud'], icon: <Waves size={10} strokeWidth={1.5} /> },
];

const DEFAULT_ICON = <Eye size={10} strokeWidth={1.5} />;

function markIcon(mark: string): React.ReactNode {
  const lower = mark.toLowerCase();
  for (const rule of ICON_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) return rule.icon;
  }
  return DEFAULT_ICON;
}

interface Props {
  marks: string[];
}

export default function FieldMarks({ marks }: Props) {
  if (!marks || marks.length === 0) return null;

  return (
    <div className='flex flex-col gap-1 w-full'>
      {marks.slice(0, 4).map((mark, i) => (
        <div
          key={i}
          className='flex items-start gap-2 px-2.5 py-1.5 rounded-md'
          style={{ background: 'rgba(90,122,58,0.05)' }}
        >
          <span
            className='shrink-0 mt-[1px] opacity-50'
            style={{ color: '#5a7a3a' }}
          >
            {markIcon(mark)}
          </span>
          <p
            className='text-[9.5px] leading-snug'
            style={{
              color: '#4a4030',
              fontFamily: 'var(--font-sans)',
              letterSpacing: '0.01em',
            }}
          >
            {mark}
          </p>
        </div>
      ))}
    </div>
  );
}
