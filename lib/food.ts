import type { StaticImageData } from 'next/image';
import type { Food } from './types';
import insectImg   from '@/components/icons/food/insect.png';
import seedImg     from '@/components/icons/food/seed.png';
import fishImg     from '@/components/icons/food/fish.png';
import rodentImg   from '@/components/icons/food/rodent.png';
import berryImg    from '@/components/icons/food/berry.png';
import omnivoreImg from '@/components/icons/food/omnivore.png';
import scavangerImg from '@/components/icons/food/scavanger.png';

export const FOODS: Food[] = ['insects', 'seeds', 'fish', 'rodents', 'berries', 'omnivore', 'scavenger'];

export const foodImage: Record<Food, StaticImageData> = {
  insects:   insectImg,
  seeds:     seedImg,
  fish:      fishImg,
  rodents:   rodentImg,
  berries:   berryImg,
  omnivore:  omnivoreImg,
  scavenger: scavangerImg,
};

export const foodIcon: Record<Food, string> = {
  insects:   '🪲',
  seeds:     '🌰',
  fish:      '🐟',
  rodents:   '🐭',
  berries:   '🫐',
  omnivore:  '🍽️',
  scavenger: '🦴',
};

export const FOOD_FALLBACK_ICON = '🍴';
