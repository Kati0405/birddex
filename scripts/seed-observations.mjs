import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rxpafqcecuborfhtskay.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4cGFmcWNlY3Vib3JmaHRza2F5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTE3NjU0MywiZXhwIjoyMDk0NzUyNTQzfQ.qBOD4IgE5kEsylWLoxRzNRFKLNeB8V7trADnn5ZRhUE'
);

const USER_ID = '05d9f961-5aa1-4c81-a0b7-b999cf05aa1f'; // admin

// Ukrainian/Polish birding locations
const LOCATIONS = [
  { lat: 49.8397, lng: 24.0297 },  // Lviv city park
  { lat: 49.7423, lng: 23.9890 },  // Yavoriv
  { lat: 50.4501, lng: 30.5234 },  // Kyiv
  { lat: 49.5535, lng: 25.5948 },  // Ternopil lake
  { lat: 48.9226, lng: 24.7111 },  // Ivano-Frankivsk
  { lat: 49.9935, lng: 36.2304 },  // Kharkiv
  null,                             // no location
];

const NOTES = [
  'Singing from a pine tree before sunrise. Finally spotted after ten minutes.',
  'Chased away a crow twice. Very territorial today.',
  'Flew low over the river. Caught a fish in under 30 seconds.',
  'Heard first, then spotted in the reeds. Incredibly loud for its size.',
  'Feeding chicks. At least three in the nest.',
  'Brief glance in bad light but unmistakable silhouette.',
  'Perfect view for nearly five minutes. Could see every feather.',
  'Completely ignored me. Was busy eating.',
  'Flying overhead in a loose flock of about twelve.',
  'First time this year. Spring is officially here.',
  'Mobbed by smaller birds for ten minutes straight.',
  'Heard calling repeatedly but stayed hidden in the canopy.',
  null,
  null,
];

const QUALITIES = ['bad', 'good', 'excellent', null];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  // randomise time of day
  d.setHours(Math.floor(Math.random() * 10) + 5);
  d.setMinutes(Math.floor(Math.random() * 60));
  return d.toISOString();
}

// Birds with their observation profiles
// [birdId, totalObs, spreadDays] — spread across that many days in the past
const BIRD_PROFILES = [
  [2,  18, 540],  // European Robin — very common, many obs
  [4,  14, 400],  // Great Tit
  [16, 12, 365],  // Eurasian Blackbird
  [10, 9,  280],  // Barn Swallow — seasonal
  [13, 8,  300],  // White Wagtail
  [1,  6,  200],  // Eurasian Hoopoe
  [3,  5,  350],  // Common Kingfisher
  [17, 5,  180],  // Common Nightingale
  [15, 4,  250],  // Great Spotted Woodpecker
  [5,  4,  220],  // Eurasian Jay
  [18, 3,  150],  // Eurasian Magpie
  [14, 3,  190],  // Eurasian Nuthatch
  [28, 2,  400],  // Common Buzzard
  [23, 2,  300],  // Grey Heron
  [6,  2,  500],  // White Stork
  [22, 1,  180],  // European Bee-eater
  [9,  1,  600],  // Eurasian Eagle-Owl
];

const rows = [];

for (const [birdId, total, spreadDays] of BIRD_PROFILES) {
  // Spread observations across the spread window, not evenly — cluster a bit
  const offsets = [];
  for (let i = 0; i < total; i++) {
    offsets.push(Math.floor(Math.random() * spreadDays));
  }
  offsets.sort((a, b) => b - a); // oldest first (largest offset)

  for (const offset of offsets) {
    const loc = randomFrom(LOCATIONS);
    const hasSeen = Math.random() > 0.1;
    const hasHeard = Math.random() > 0.4;
    const hasPhoto = Math.random() > 0.65;

    rows.push({
      user_id: USER_ID,
      bird_id: birdId,
      observed_at: daysAgo(offset),
      seen: hasSeen,
      heard: hasHeard,
      photographed: hasPhoto,
      quality: randomFrom(QUALITIES),
      notes: randomFrom(NOTES),
      photo_url: null,
      lat: loc?.lat ?? null,
      lng: loc?.lng ?? null,
    });
  }
}

console.log(`Inserting ${rows.length} observations…`);
const { error } = await supabase.from('observations').insert(rows);
if (error) {
  console.error('Error:', error.message);
} else {
  console.log('Done.');
}
