import type { StaticImageData } from 'next/image';
import insectImg    from '@/components/icons/food/insect.png';
import seedImg      from '@/components/icons/food/seed.png';
import fishImg      from '@/components/icons/food/fish.png';
import rodentImg    from '@/components/icons/food/rodent.png';
import berryImg     from '@/components/icons/food/berry.png';
import omnivoreImg  from '@/components/icons/food/omnivore.png';
import scavangerImg from '@/components/icons/food/scavanger.png';
import forestImg    from '@/components/icons/biomes/forest.png';
import wetlandImg   from '@/components/icons/biomes/wetland.png';
import cityscapeImg from '@/components/icons/biomes/cityscape.png';
import fieldsImg    from '@/components/icons/biomes/fields.png';
import riverImg     from '@/components/icons/biomes/river.png';
import mountainsImg from '@/components/icons/biomes/mountains.png';
import coastImg     from '@/components/icons/biomes/coast.png';
import parkImg      from '@/components/icons/biomes/park.png';
import nocturnalImg   from '@/components/icons/behaviour/nocturnal.svg';
import predatorImg    from '@/components/icons/behaviour/predator.svg';
import songbirdImg    from '@/components/icons/behaviour/song.svg';
import mimicImg       from '@/components/icons/behaviour/mimic.svg';
import flockImg       from '@/components/icons/behaviour/flock.svg';
import urbanImg       from '@/components/icons/behaviour/urban.svg';
import fishHunterImg  from '@/components/icons/behaviour/fish.svg';
import secretiveImg   from '@/components/icons/behaviour/secretive.svg';
import territorialImg from '@/components/icons/behaviour/territorial.svg';
import fastFlyerImg   from '@/components/icons/behaviour/fast.svg';
import berryBehImg    from '@/components/icons/behaviour/berry.svg';
import ghostImg       from '@/components/icons/behaviour/ghost.svg';
import feederImg      from '@/components/icons/behaviour/feeder.svg';

// ── Types ────────────────────────────────────────────────────────────────────

export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';

export type Food = 'insects' | 'seeds' | 'fish' | 'rodents' | 'berries' | 'omnivore' | 'scavenger';

export type Biome = 'forest' | 'wetlands' | 'city' | 'fields' | 'rivers' | 'mountains' | 'coast' | 'gardens';

export type Behaviour =
  | 'nocturnal'
  | 'predator'
  | 'songbird'
  | 'mimic'
  | 'flock bird'
  | 'urban survivor'
  | 'fish hunter'
  | 'secretive'
  | 'territorial'
  | 'fast flyer'
  | 'berry lover'
  | 'forest ghost'
  | 'feeder visitor';

export interface WikimediaImage {
  imageUrl: string;
  thumbnailUrl: string;
  author: string;
  license: string;
  sourceUrl: string;
}

export interface Bird {
  id: number;
  name_eng: string;
  name_latin: string;
  rarity: Rarity;
  biomes: Biome[];
  food: Food[];
  behaviour: Behaviour[];
  wingspan: number;
  field_note: string;
  image_url?: string;
  sound_url?: string;
  best_months: number[];
  selected_image?: WikimediaImage;
}

// ── Rarity ───────────────────────────────────────────────────────────────────

export const RARITY_COLOR: Record<Rarity, string> = {
  Common:    '#808080',
  Uncommon:  '#198b58',
  Rare:      '#306fd5',
  Epic:      '#8d33ab',
  Legendary: '#f9a01f',
};

export const rarityBorder: Record<Rarity, string> = {
  Common:    'border-[#808080]/60',
  Uncommon:  'border-[#198b58]/60',
  Rare:      'border-[#306fd5]/60',
  Epic:      'border-[#8d33ab]/60',
  Legendary: 'border-[#f9a01f]/60',
};

export const rarityBadge: Record<Rarity, string> = {
  Common:    'border-[#808080]/40 bg-[#808080]/10 text-[#808080] hover:bg-[#808080]/10',
  Uncommon:  'border-[#198b58]/40 bg-[#198b58]/10 text-[#198b58] hover:bg-[#198b58]/10',
  Rare:      'border-[#306fd5]/40 bg-[#306fd5]/10 text-[#306fd5] hover:bg-[#306fd5]/10',
  Epic:      'border-[#8d33ab]/40 bg-[#8d33ab]/10 text-[#8d33ab] hover:bg-[#8d33ab]/10',
  Legendary: 'border-[#f9a01f]/40 bg-[#f9a01f]/10 text-[#f9a01f] hover:bg-[#f9a01f]/10',
};

export const rarityFilter: Record<Rarity, string> = {
  Common:    'border-[#808080]/40 text-[#808080] hover:bg-[#808080]/10 data-[active=true]:bg-[#808080]/20',
  Uncommon:  'border-[#198b58]/40 text-[#198b58] hover:bg-[#198b58]/10 data-[active=true]:bg-[#198b58]/20',
  Rare:      'border-[#306fd5]/40 text-[#306fd5] hover:bg-[#306fd5]/10 data-[active=true]:bg-[#306fd5]/20',
  Epic:      'border-[#8d33ab]/40 text-[#8d33ab] hover:bg-[#8d33ab]/10 data-[active=true]:bg-[#8d33ab]/20',
  Legendary: 'border-[#f9a01f]/40 text-[#f9a01f] hover:bg-[#f9a01f]/10 data-[active=true]:bg-[#f9a01f]/20',
};

export const rarityGlow: Record<Rarity, string> = {
  Common:    'shadow-[#808080]/20',
  Uncommon:  'shadow-[#198b58]/20',
  Rare:      'shadow-[#306fd5]/20',
  Epic:      'shadow-[#8d33ab]/20',
  Legendary: 'shadow-[#f9a01f]/20',
};

// ── Food ─────────────────────────────────────────────────────────────────────

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

// ── Biome ────────────────────────────────────────────────────────────────────

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

// ── Behaviour ────────────────────────────────────────────────────────────────

export const BEHAVIOURS: Behaviour[] = [
  'nocturnal',
  'predator',
  'songbird',
  'mimic',
  'flock bird',
  'urban survivor',
  'fish hunter',
  'secretive',
  'territorial',
  'fast flyer',
  'berry lover',
  'forest ghost',
  'feeder visitor',
];

export const behaviourImage: Record<Behaviour, StaticImageData> = {
  nocturnal:        nocturnalImg,
  predator:         predatorImg,
  songbird:         songbirdImg,
  mimic:            mimicImg,
  'flock bird':     flockImg,
  'urban survivor': urbanImg,
  'fish hunter':    fishHunterImg,
  secretive:        secretiveImg,
  territorial:      territorialImg,
  'fast flyer':     fastFlyerImg,
  'berry lover':    berryBehImg,
  'forest ghost':   ghostImg,
  'feeder visitor': feederImg,
};
