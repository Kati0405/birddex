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
