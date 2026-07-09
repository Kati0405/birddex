'use client';

import { useState } from 'react';
import type { Rarity, Food, Biome, Behaviour } from '@/entities/bird-domain';
import { draftBirdAction, type DraftedBird } from '@/features/birds/actions/ai-draft-bird';
import { createBirdAction } from '@/features/birds/actions/create-bird-mutation';
import BirdMetadataFields from '@/features/birds/components/BirdMetadataFields/BirdMetadataFields';

export default function AddBirdForm() {
  const [query, setQuery] = useState('');
  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftedBird | null>(null);

  async function handleDraft() {
    setDrafting(true);
    setDraftError(null);
    const result = await draftBirdAction({ query });
    if ('error' in result) {
      setDraftError(result.error);
      setDraft(null);
    } else {
      setDraft(result.draft);
    }
    setDrafting(false);
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2 rounded-xl border border-border bg-card p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Identify bird
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. European Robin"
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="button"
            disabled={drafting || !query.trim()}
            onClick={handleDraft}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {drafting ? 'Drafting…' : 'Draft with AI'}
          </button>
        </div>
        {draftError && <p className="text-sm text-red-500">{draftError}</p>}
      </section>

      {draft && <AddBirdEditableFields key={draft.name_latin} initialDraft={draft} />}
    </div>
  );
}

function AddBirdEditableFields({ initialDraft }: { initialDraft: DraftedBird }) {
  const [nameEng, setNameEng] = useState(initialDraft.name_eng);
  const [nameLatin, setNameLatin] = useState(initialDraft.name_latin);
  const [rarity, setRarity] = useState<Rarity>(initialDraft.rarity);
  const [wingspan, setWingspan] = useState(initialDraft.wingspan);
  const [food, setFood] = useState<Food[]>(initialDraft.food);
  const [biomes, setBiomes] = useState<Biome[]>(initialDraft.biomes);
  const [behaviour, setBehaviour] = useState<Behaviour[]>(initialDraft.behaviour);
  const [bestMonths, setBestMonths] = useState<number[]>(initialDraft.best_months);
  const [fieldNote, setFieldNote] = useState(initialDraft.field_note);
  const [tips, setTips] = useState<string[]>(
    initialDraft.tips_to_find.length > 0 ? initialDraft.tips_to_find : ['']
  );
  const [marks, setMarks] = useState<string[]>(
    initialDraft.field_marks.length > 0 ? initialDraft.field_marks : ['']
  );
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSave() {
    setStatus('saving');
    setSaveError(null);
    const result = await createBirdAction({
      name_eng: nameEng.trim(),
      name_latin: nameLatin.trim(),
      rarity,
      wingspan,
      food,
      biomes,
      behaviour,
      best_months: bestMonths,
      field_note: fieldNote,
      tips_to_find: tips.map((t) => t.trim()).filter(Boolean),
      field_marks: marks.map((m) => m.trim()).filter(Boolean),
    });
    if (result && 'error' in result) {
      setSaveError(typeof result.error === 'string' ? result.error : JSON.stringify(result.error));
      setStatus('error');
    }
    // on success createBirdAction redirects, so no further state update needed
  }

  const canSave =
    nameEng.trim().length > 0 &&
    nameLatin.trim().length > 0 &&
    wingspan > 0 &&
    food.length > 0 &&
    biomes.length > 0 &&
    behaviour.length > 0 &&
    status !== 'saving';

  return (
    <div className="space-y-6 rounded-xl border border-border bg-card p-6">
      <h2 className="text-base font-bold">Review &amp; edit draft</h2>

      <section className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">English name</p>
          <input
            type="text"
            value={nameEng}
            onChange={(e) => setNameEng(e.target.value)}
            maxLength={100}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Latin name</p>
          <input
            type="text"
            value={nameLatin}
            onChange={(e) => setNameLatin(e.target.value)}
            maxLength={100}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm italic text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </section>

      <BirdMetadataFields
        value={{ rarity, wingspan, food, biomes, behaviour, bestMonths, fieldNote, tips, marks }}
        onChange={{
          setRarity, setWingspan, setFood, setBiomes, setBehaviour, setBestMonths, setFieldNote, setTips, setMarks,
        }}
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={!canSave}
          onClick={handleSave}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'saving' ? 'Saving…' : 'Save bird'}
        </button>
        {status === 'error' && <span className="text-sm text-red-500">{saveError}</span>}
      </div>
    </div>
  );
}
