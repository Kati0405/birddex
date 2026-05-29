'use client';

import {
  Binoculars,
  Ear,
  TreeDeciduous,
  Moon,
  Wind,
  Feather,
  Waves,
  MoveRight,
  MapPin,
  Eye,
  Sun,
  CloudRain,
} from 'lucide-react';

// Maps keywords in a tip to a contextual icon
const ICON_RULES: Array<{ keywords: string[]; icon: React.ReactNode }> = [
  { keywords: ['listen', 'call', 'song', 'singing', 'sound', 'hear', 'vocal', 'trumpet', 'croak', 'whistle', 'drum'], icon: <Ear size={10} strokeWidth={1.5} /> },
  { keywords: ['night', 'sunset', 'dusk', 'nocturnal'], icon: <Moon size={10} strokeWidth={1.5} /> },
  { keywords: ['morning', 'sunrise', 'early'], icon: <Sun size={10} strokeWidth={1.5} /> },
  { keywords: ['rain', 'weather', 'storm'], icon: <CloudRain size={10} strokeWidth={1.5} /> },
  { keywords: ['fly', 'flight', 'migrat', 'hover', 'circle', 'glide', 'overhead'], icon: <MoveRight size={10} strokeWidth={1.5} /> },
  { keywords: ['wind', 'windy'], icon: <Wind size={10} strokeWidth={1.5} /> },
  { keywords: ['river', 'pond', 'water', 'wetland', 'marsh', 'lake', 'bank'], icon: <Waves size={10} strokeWidth={1.5} /> },
  { keywords: ['tree', 'forest', 'trunk', 'oak', 'bush', 'branch', 'wood'], icon: <TreeDeciduous size={10} strokeWidth={1.5} /> },
  { keywords: ['watch', 'look', 'spot', 'visible', 'see', 'observe', 'search', 'check', 'binocular'], icon: <Binoculars size={10} strokeWidth={1.5} /> },
  { keywords: ['wing', 'feather', 'plumage', 'color', 'colour', 'bright', 'flash'], icon: <Feather size={10} strokeWidth={1.5} /> },
  { keywords: ['near', 'field', 'meadow', 'farm', 'ground', 'road', 'pole', 'wire', 'roof'], icon: <MapPin size={10} strokeWidth={1.5} /> },
];

const DEFAULT_ICON = <Eye size={10} strokeWidth={1.5} />;

function tipIcon(tip: string): React.ReactNode {
  const lower = tip.toLowerCase();
  for (const rule of ICON_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) return rule.icon;
  }
  return DEFAULT_ICON;
}

interface Props {
  tips: string[];
}

export default function TipsToFind({ tips }: Props) {
  if (!tips || tips.length === 0) return null;

  return (
    <div className='flex flex-col gap-1 w-full'>
      {tips.slice(0, 4).map((tip, i) => (
        <div
          key={i}
          className='flex items-start gap-2 px-2.5 py-1.5 rounded-md'
          style={{ background: 'rgba(90,122,58,0.05)' }}
        >
          <span
            className='shrink-0 mt-[1px] opacity-50'
            style={{ color: '#5a7a3a' }}
          >
            {tipIcon(tip)}
          </span>
          <p
            className='text-[9.5px] leading-snug'
            style={{
              color: '#4a4030',
              fontFamily: 'var(--font-sans)',
              letterSpacing: '0.01em',
            }}
          >
            {tip}
          </p>
        </div>
      ))}
    </div>
  );
}
