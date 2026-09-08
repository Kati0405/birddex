import { RARITY_COLOR } from '@/entities/bird-domain';
import type { Rarity } from '@/entities/bird-domain';

export default function RarityBadge({ rarity }: { rarity: Rarity }) {
  const color = RARITY_COLOR[rarity];

  return (
    <div className='flex items-center gap-1.5'>
      <div
        className='w-[8px] h-[8px] shrink-0'
        style={{
          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
          background: color,
        }}
      />
      <span className='text-[9px] uppercase tracking-[0.18em] font-mono' style={{ color }}>
        {rarity}
      </span>
    </div>
  );
}
