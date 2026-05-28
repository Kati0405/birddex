import { foodImage } from '@/entities/bird-domain';
import type { Food } from '@/entities/bird-domain';
import HexIcon from '@/shared/ui/HexIcon/HexIcon';

export default function FoodBadge({ food }: { food: Food }) {
  return (
    <div className="flex items-center gap-2">
      <HexIcon imageSrc={foodImage[food]} label={food} size={32} />
      <span className="text-sm text-muted-foreground capitalize">{food}</span>
    </div>
  );
}
