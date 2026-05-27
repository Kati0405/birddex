import { Badge } from '@/components/ui/badge';
import type { Rarity } from '@/lib/types';

export default function RarityBadge({ rarity }: { rarity: Rarity }) {
  return (
    <Badge variant="outline" className="uppercase tracking-wide font-semibold">
      {rarity}
    </Badge>
  );
}
