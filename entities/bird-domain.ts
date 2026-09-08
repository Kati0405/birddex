import type { StaticImageData } from 'next/image';
import insectImg    from '@/entities/bird-icons/food/insect.png';
import seedImg      from '@/entities/bird-icons/food/seed.png';
import fishImg      from '@/entities/bird-icons/food/fish.png';
import rodentImg    from '@/entities/bird-icons/food/rodent.png';
import berryImg     from '@/entities/bird-icons/food/berry.png';
import omnivoreImg  from '@/entities/bird-icons/food/omnivore.png';
import scavangerImg from '@/entities/bird-icons/food/scavanger.png';
import forestImg    from '@/entities/bird-icons/biomes/forest.png';
import wetlandImg   from '@/entities/bird-icons/biomes/wetland.png';
import cityscapeImg from '@/entities/bird-icons/biomes/cityscape.png';
import fieldsImg    from '@/entities/bird-icons/biomes/fields.png';
import riverImg     from '@/entities/bird-icons/biomes/river.png';
import mountainsImg from '@/entities/bird-icons/biomes/mountains.png';
import coastImg     from '@/entities/bird-icons/biomes/coast.png';
import parkImg      from '@/entities/bird-icons/biomes/park.png';
import nocturnalImg   from '@/entities/bird-icons/behaviour/nocturnal.svg';
import predatorImg    from '@/entities/bird-icons/behaviour/predator.svg';
import songbirdImg    from '@/entities/bird-icons/behaviour/song.svg';
import mimicImg       from '@/entities/bird-icons/behaviour/mimic.svg';
import flockImg       from '@/entities/bird-icons/behaviour/flock.svg';
import urbanImg       from '@/entities/bird-icons/behaviour/urban.svg';
import fishHunterImg  from '@/entities/bird-icons/behaviour/fish.svg';
import secretiveImg   from '@/entities/bird-icons/behaviour/secretive.svg';
import territorialImg from '@/entities/bird-icons/behaviour/territorial.svg';
import fastFlyerImg   from '@/entities/bird-icons/behaviour/fast.svg';
import berryBehImg    from '@/entities/bird-icons/behaviour/berry.svg';
import ghostImg       from '@/entities/bird-icons/behaviour/ghost.svg';
import feederImg      from '@/entities/bird-icons/behaviour/feeder.svg';

// ── Types ────────────────────────────────────────────────────────────────────

export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';

export const RARITIES: Rarity[] = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];

export type Difficulty = 'beginner' | 'easy' | 'moderate' | 'tricky' | 'good_luck';

export interface BestTimeOfDay {
  dawn: boolean;
  day: boolean;
  dusk: boolean;
  night: boolean;
}

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
  image_public_id?: string | null;
  image_resource_type?: string | null;
  sound_url?: string;
  sound_public_id?: string | null;
  sound_resource_type?: string | null;
  best_months: number[];
  tips_to_find: string[];
  field_marks: string[];
  difficulty?: Difficulty;
  best_time_of_day?: BestTimeOfDay;
  signature_behavior?: string;
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
