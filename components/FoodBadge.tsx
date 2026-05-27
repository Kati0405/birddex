import { foodImage } from '@/lib/food';
import type { Food } from '@/lib/types';
import HexIcon from './HexIcon';

export default function FoodBadge({ food }: { food: Food }) {
  return (
    <div className="flex items-center gap-2">
      <HexIcon imageSrc={foodImage[food]} label={food} size={32} />
      <span className="text-sm text-muted-foreground capitalize">{food}</span>
    </div>
  );
}
