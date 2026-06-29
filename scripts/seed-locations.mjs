import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rxpafqcecuborfhtskay.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4cGFmcWNlY3Vib3JmaHRza2F5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTE3NjU0MywiZXhwIjoyMDk0NzUyNTQzfQ.qBOD4IgE5kEsylWLoxRzNRFKLNeB8V7trADnn5ZRhUE'
);

const USER_ID = '05d9f961-5aa1-4c81-a0b7-b999cf05aa1f';

const SAVED_LOCATIONS = [
  { name: 'Stryiskyi Park',        lat: 49.8283, lng: 24.0254, habitats: ['gardens', 'forest'] },
  { name: 'Backyard feeder',       lat: 49.8412, lng: 24.0185, habitats: ['city', 'gardens'] },
  { name: 'Znesinnya hill',        lat: 49.8501, lng: 24.0512, habitats: ['forest', 'fields'] },
  { name: 'Yaniv lake',            lat: 49.8735, lng: 23.9410, habitats: ['wetlands', 'rivers'] },
  { name: 'Shevchenkivskyi grove', lat: 49.8360, lng: 24.0020, habitats: ['forest'] },
  { name: 'River Poltva trail',    lat: 49.8445, lng: 24.0330, habitats: ['rivers', 'city', 'gardens'] },
];

// Insert saved locations
console.log('Inserting saved locations…');
const { error: locError } = await supabase.from('saved_locations').insert(
  SAVED_LOCATIONS.map((loc) => ({
    user_id: USER_ID,
    name: loc.name,
    lat: loc.lat,
    lng: loc.lng,
    photo_url: null,
    photo_public_id: null,
    habitats: loc.habitats,
  }))
);
if (locError) {
  console.error('Location insert error:', locError.message);
  process.exit(1);
}
console.log(`Inserted ${SAVED_LOCATIONS.length} saved locations.`);

// Observations that reference these locations by name
const NOTES = [
  'Singing from a pine tree before sunrise. Finally spotted after ten minutes.',
  'Chased away a crow twice. Very territorial today.',
  'Heard first, then spotted in the reeds. Incredibly loud for its size.',
  'Feeding chicks. At least three in the nest.',
  'Brief glance in bad light but unmistakable silhouette.',
  'Perfect view for nearly five minutes. Could see every feather.',
  'Completely ignored me. Was busy eating.',
  'Flying overhead in a loose flock of about twelve.',
  'Heard calling repeatedly but stayed hidden in the canopy.',
  'Mobbed by smaller birds for ten minutes straight.',
  'First time this year. Spring is officially here.',
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
  d.setHours(Math.floor(Math.random() * 10) + 5);
  d.setMinutes(Math.floor(Math.random() * 60));
  return d.toISOString();
}

// [birdId, locationIndex, daysAgoOffset, seen, heard, photographed]
const OBS_DATA = [
  // Stryiskyi Park — busy urban park, lots of observations
  [4,  0, 2,   true,  false, false],
  [4,  0, 8,   true,  true,  false],
  [4,  0, 22,  true,  true,  true],
  [16, 0, 3,   true,  true,  false],
  [16, 0, 15,  true,  false, false],
  [16, 0, 45,  true,  true,  true],
  [2,  0, 5,   true,  true,  false],
  [2,  0, 18,  true,  true,  false],
  [2,  0, 60,  true,  false, true],
  [18, 0, 7,   true,  false, false],
  [18, 0, 30,  true,  true,  false],
  [5,  0, 12,  true,  false, false],
  [14, 0, 25,  true,  false, false],
  [15, 0, 40,  false, true,  false],

  // Backyard feeder — regular visitor
  [4,  1, 1,   true,  false, true],
  [4,  1, 4,   true,  false, false],
  [4,  1, 9,   true,  true,  false],
  [4,  1, 14,  true,  false, true],
  [2,  1, 2,   true,  true,  false],
  [2,  1, 6,   true,  false, false],
  [2,  1, 20,  true,  true,  true],
  [14, 1, 3,   true,  false, false],
  [14, 1, 11,  true,  false, true],
  [18, 1, 5,   true,  false, false],
  [13, 1, 7,   true,  true,  false],

  // Znesinnya hill — woodland walks
  [15, 2, 10,  false, true,  false],
  [15, 2, 35,  true,  true,  false],
  [5,  2, 14,  true,  false, false],
  [5,  2, 50,  true,  true,  true],
  [17, 2, 20,  false, true,  false],
  [17, 2, 55,  true,  true,  false],
  [14, 2, 28,  true,  false, false],
  [2,  2, 33,  true,  true,  false],

  // Yaniv lake — waterbirds
  [3,  3, 6,   true,  false, true],
  [3,  3, 42,  true,  false, false],
  [23, 3, 8,   true,  false, true],
  [23, 3, 25,  true,  false, false],
  [10, 3, 12,  true,  false, false],
  [10, 3, 38,  true,  true,  false],
  [13, 3, 15,  true,  true,  false],

  // Shevchenkivskyi grove — quiet walks
  [17, 4, 18,  false, true,  false],
  [16, 4, 22,  true,  true,  false],
  [2,  4, 30,  true,  false, false],
  [1,  4, 65,  true,  false, true],

  // River Poltva trail — mixed
  [13, 5, 4,   true,  true,  false],
  [10, 5, 16,  true,  false, false],
  [28, 5, 45,  true,  false, true],
  [6,  5, 70,  true,  false, false],
  [16, 5, 9,   true,  true,  false],
];

const obsRows = OBS_DATA.map(([birdId, locIdx, ago, seen, heard, photographed]) => {
  const loc = SAVED_LOCATIONS[locIdx];
  return {
    user_id: USER_ID,
    bird_id: birdId,
    observed_at: daysAgo(ago),
    seen,
    heard,
    photographed,
    quality: randomFrom(QUALITIES),
    notes: randomFrom(NOTES),
    photo_url: null,
    lat: loc.lat + (Math.random() - 0.5) * 0.002,
    lng: loc.lng + (Math.random() - 0.5) * 0.002,
    location_name: loc.name,
  };
});

console.log(`Inserting ${obsRows.length} observations…`);
const { error: obsError } = await supabase.from('observations').insert(obsRows);
if (obsError) {
  console.error('Observation insert error:', obsError.message);
  process.exit(1);
}
console.log('Done. Seeded locations and observations.');
