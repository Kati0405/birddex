import type { Rarity } from './types';

export const RARITY_COLOR: Record<Rarity, string> = {
  Common: '#808080',
  Uncommon: '#198b58',
  Rare: '#306fd5',
  Epic: '#8d33ab',
  Legendary: '#f9a01f',
};

export const rarityBorder: Record<Rarity, string> = {
  Common: 'border-[#808080]/60',
  Uncommon: 'border-[#198b58]/60',
  Rare: 'border-[#306fd5]/60',
  Epic: 'border-[#8d33ab]/60',
  Legendary: 'border-[#f9a01f]/60',
};

export const rarityBadge: Record<Rarity, string> = {
  Common: 'border-[#808080]/40 bg-[#808080]/10 text-[#808080] hover:bg-[#808080]/10',
  Uncommon: 'border-[#198b58]/40 bg-[#198b58]/10 text-[#198b58] hover:bg-[#198b58]/10',
  Rare: 'border-[#306fd5]/40 bg-[#306fd5]/10 text-[#306fd5] hover:bg-[#306fd5]/10',
  Epic: 'border-[#8d33ab]/40 bg-[#8d33ab]/10 text-[#8d33ab] hover:bg-[#8d33ab]/10',
  Legendary: 'border-[#f9a01f]/40 bg-[#f9a01f]/10 text-[#f9a01f] hover:bg-[#f9a01f]/10',
};

export const rarityFilter: Record<Rarity, string> = {
  Common: 'border-[#808080]/40 text-[#808080] hover:bg-[#808080]/10 data-[active=true]:bg-[#808080]/20',
  Uncommon: 'border-[#198b58]/40 text-[#198b58] hover:bg-[#198b58]/10 data-[active=true]:bg-[#198b58]/20',
  Rare: 'border-[#306fd5]/40 text-[#306fd5] hover:bg-[#306fd5]/10 data-[active=true]:bg-[#306fd5]/20',
  Epic: 'border-[#8d33ab]/40 text-[#8d33ab] hover:bg-[#8d33ab]/10 data-[active=true]:bg-[#8d33ab]/20',
  Legendary: 'border-[#f9a01f]/40 text-[#f9a01f] hover:bg-[#f9a01f]/10 data-[active=true]:bg-[#f9a01f]/20',
};

export const rarityGlow: Record<Rarity, string> = {
  Common: 'shadow-[#808080]/20',
  Uncommon: 'shadow-[#198b58]/20',
  Rare: 'shadow-[#306fd5]/20',
  Epic: 'shadow-[#8d33ab]/20',
  Legendary: 'shadow-[#f9a01f]/20',
};
