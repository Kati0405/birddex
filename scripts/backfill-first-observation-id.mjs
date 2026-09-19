// One-time backfill for collected_birds.first_observation_id.
//
// For every existing (user_id, bird_id) pair with no first_observation_id
// yet, sets it to the observation with the earliest (observed_at, id) for
// that pair — reusing the exact "earliest by date" logic the app used to
// rely on dynamically, just once, to seed the new stable column.
//
// This is a deliberate, reviewed, one-off assumption for PRE-EXISTING data
// only: going forward, addObservation() sets first_observation_id at insert
// time and never recalculates it from observed_at (see
// features/observations/observation-queries.ts).
//
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the
// environment (never hardcode the service-role key). Safe to re-run — rows
// that already have a first_observation_id are left untouched.
//
// Usage: node scripts/backfill-first-observation-id.mjs [--dry-run]

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in the environment.');
  process.exit(1);
}

const dryRun = process.argv.includes('--dry-run');
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function main() {
  const { data: pending, error: pendingError } = await supabase
    .from('collected_birds')
    .select('user_id, bird_id')
    .is('first_observation_id', null);
  if (pendingError) throw new Error(`fetch pending collected_birds: ${pendingError.message}`);

  if (!pending || pending.length === 0) {
    console.log('Nothing to backfill — every collected_birds row already has a first_observation_id.');
    return;
  }

  console.log(`Backfilling ${pending.length} collected_birds row(s)...`);

  let updated = 0;
  let skippedNoObservations = 0;

  for (const { user_id, bird_id } of pending) {
    const { data: rows, error: obsError } = await supabase
      .from('observations')
      .select('id, observed_at')
      .eq('user_id', user_id)
      .eq('bird_id', bird_id)
      .order('observed_at', { ascending: true })
      .order('id', { ascending: true })
      .limit(1);
    if (obsError) throw new Error(`fetch observations for ${user_id}/${bird_id}: ${obsError.message}`);

    const first = rows?.[0];
    if (!first) {
      // Collected via toggleCollected with no logged observation — nothing to point at.
      skippedNoObservations++;
      continue;
    }

    if (dryRun) {
      console.log(`[dry-run] would set collected_birds(${user_id}, ${bird_id}).first_observation_id = ${first.id}`);
      updated++;
      continue;
    }

    const { error: updateError } = await supabase
      .from('collected_birds')
      .update({ first_observation_id: first.id })
      .eq('user_id', user_id)
      .eq('bird_id', bird_id);
    if (updateError) throw new Error(`update collected_birds for ${user_id}/${bird_id}: ${updateError.message}`);
    updated++;
  }

  console.log(`Done. Updated ${updated} row(s). Skipped ${skippedNoObservations} row(s) with no matching observation.`);
  if (dryRun) console.log('(dry run — no changes were written)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
