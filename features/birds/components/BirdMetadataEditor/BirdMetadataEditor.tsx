'use client';

import { useState } from 'react';
import { updateBirdMetadataAction } from '@/features/birds/actions/bird-mutations';
import { draftBirdAction } from '@/features/birds/actions/ai-draft-bird';
import type { Rarity, Food, Biome, Behaviour } from '@/entities/bird-domain';
import SoundUploader from '@/shared/ui/SoundUploader/SoundUploader';
import BirdMetadataFields from '@/features/birds/components/BirdMetadataFields/BirdMetadataFields';

interface Props {
  birdId: number;
  nameEng: string;
  nameLatin: string;
  currentRarity: Rarity;
  currentFood: Food[];
  currentBiomes: Biome[];
  currentBehaviour: Behaviour[];
  currentBestMonths: number[];
  currentFieldNote: string;
  currentTipsToFind: string[];
  currentFieldMarks: string[];
  currentSoundUrl?: string;
}

export default function BirdMetadataEditor({
  birdId,
  nameEng,
  nameLatin,
  currentRarity,
  currentFood,
  currentBiomes,
  currentBehaviour,
  currentBestMonths,
  currentFieldNote,
  currentTipsToFind,
  currentFieldMarks,
  currentSoundUrl,
}: Props) {
  const [rarity, setRarity] = useState<Rarity>(currentRarity);
  const [food, setFood] = useState<Food[]>(currentFood);
  const [biomes, setBiomes] = useState<Biome[]>(currentBiomes);
  const [behaviour, setBehaviour] = useState<Behaviour[]>(currentBehaviour);
  const [bestMonths, setBestMonths] = useState<number[]>(currentBestMonths);
  const [fieldNote, setFieldNote] = useState(currentFieldNote);
  const [tips, setTips] = useState<string[]>(
    currentTipsToFind.length > 0 ? currentTipsToFind : ['']
  );
  const [marks, setMarks] = useState<string[]>(
    currentFieldMarks.length > 0 ? currentFieldMarks : ['']
  );
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [drafting, setDrafting] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);

  async function handleDraft() {
    setDrafting(true);
    setDraftError(null);
    const result = await draftBirdAction({ query: `${nameEng} (${nameLatin})` });
    if ('error' in result) {
      setDraftError(result.error);
    } else {
      const { draft } = result;
      setRarity(draft.rarity);
      setFood(draft.food);
      setBiomes(draft.biomes);
      setBehaviour(draft.behaviour);
      setBestMonths(draft.best_months);
      setFieldNote(draft.field_note);
      setTips(draft.tips_to_find.length > 0 ? draft.tips_to_find : ['']);
      setMarks(draft.field_marks.length > 0 ? draft.field_marks : ['']);
    }
    setDrafting(false);
  }

  async function handleSave() {
    setStatus('saving');
    const result = await updateBirdMetadataAction({
      birdId,
      rarity,
      food,
      biomes,
      behaviour,
      best_months: bestMonths,
      field_note: fieldNote,
      tips_to_find: tips.map((t) => t.trim()).filter(Boolean),
      field_marks: marks.map((m) => m.trim()).filter(Boolean),
    });
    setStatus(result && 'error' in result ? 'error' : 'saved');
  }

  return (
    <div className="space-y-6 rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold">Edit metadata</h2>
        <button
          type="button"
          disabled={drafting}
          onClick={handleDraft}
          className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {drafting ? 'Drafting…' : 'Draft with AI'}
        </button>
      </div>
      {draftError && <p className="text-sm text-red-500">{draftError}</p>}

      <SoundUploader birdId={birdId} currentSoundUrl={currentSoundUrl} />

      <BirdMetadataFields
        value={{ rarity, food, biomes, behaviour, bestMonths, fieldNote, tips, marks }}
        onChange={{
          setRarity, setFood, setBiomes, setBehaviour, setBestMonths, setFieldNote, setTips, setMarks,
        }}
        colorRaritySelect
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={status === 'saving' || food.length === 0 || biomes.length === 0 || behaviour.length === 0}
          onClick={handleSave}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'saving' ? 'Saving…' : 'Save'}
        </button>
        {status === 'saved' && <span className="text-sm text-green-600">Saved!</span>}
        {status === 'error' && <span className="text-sm text-red-500">Something went wrong.</span>}
      </div>
    </div>
  );
}
