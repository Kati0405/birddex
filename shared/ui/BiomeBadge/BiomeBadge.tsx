import { biomeImage } from '@/entities/bird-domain';
import type { Biome } from '@/entities/bird-domain';
import HexIcon from '@/shared/ui/HexIcon/HexIcon';

export default function BiomeBadge({ biome }: { biome: Biome }) {
  return (
    <div className="flex items-center gap-2">
      <HexIcon imageSrc={biomeImage[biome]} label={biome} size={32} />
      <span className="text-sm text-muted-foreground capitalize">{biome}</span>
    </div>
  );
}
