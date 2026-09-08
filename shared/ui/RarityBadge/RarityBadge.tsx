import { Badge } from '@/shared/ui/primitives/badge';
import type { Rarity } from '@/entities/bird-domain';

export default function RarityBadge({ rarity }: { rarity: Rarity }) {
  return (
    <Badge variant="outline" className="uppercase tracking-wide font-semibold">
      {rarity}
    </Badge>
  );
}
