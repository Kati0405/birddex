import type { StaticImageData } from 'next/image';
import type { Biome } from './types';
import forestImg    from '@/components/icons/biomes/forest.png';
import wetlandImg   from '@/components/icons/biomes/wetland.png';
import cityscapeImg from '@/components/icons/biomes/cityscape.png';
import fieldsImg    from '@/components/icons/biomes/fields.png';
import riverImg     from '@/components/icons/biomes/river.png';
import mountainsImg from '@/components/icons/biomes/mountains.png';
import coastImg     from '@/components/icons/biomes/coast.png';
import parkImg      from '@/components/icons/biomes/park.png';

export const BIOMES: Biome[] = ['forest', 'wetlands', 'city', 'fields', 'rivers', 'mountains', 'coast', 'gardens'];

export const biomeImage: Record<Biome, StaticImageData> = {
  forest:    forestImg,
  wetlands:  wetlandImg,
  city:      cityscapeImg,
  fields:    fieldsImg,
  rivers:    riverImg,
  mountains: mountainsImg,
  coast:     coastImg,
  gardens:   parkImg,
};

export const biomeIcon: Record<Biome, string> = {
  forest:    '🌲',
  wetlands:  '🌿',
  city:      '🏙️',
  fields:    '🌾',
  rivers:    '🏞️',
  mountains: '⛰️',
  coast:     '🌊',
  gardens:   '🌷',
};

export const BIOME_FALLBACK_ICON = '📍';
