import type { StaticImageData } from 'next/image';
import type { Behaviour } from './types';
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
import berryImg       from '@/components/icons/behaviour/berry.svg';
import ghostImg       from '@/components/icons/behaviour/ghost.svg';
import feederImg      from '@/components/icons/behaviour/feeder.svg';

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
  'berry lover':    berryImg,
  'forest ghost':   ghostImg,
  'feeder visitor': feederImg,
};
