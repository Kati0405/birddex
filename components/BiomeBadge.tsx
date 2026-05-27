import { biomeImage } from '@/lib/biome';
import type { Biome } from '@/lib/types';
import HexIcon from './HexIcon';

export default function BiomeBadge({ biome }: { biome: Biome }) {
  return (
    <div className="flex items-center gap-2">
      <HexIcon imageSrc={biomeImage[biome]} label={biome} size={32} />
      <span className="text-sm text-muted-foreground capitalize">{biome}</span>
    </div>
  );
}
