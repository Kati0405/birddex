'use client';

import { useState } from 'react';
import {
  RARITIES, FOODS, foodImage, BIOMES, biomeImage, BEHAVIOURS, behaviourImage,
} from '@/entities/bird-domain';
import type { Rarity, Food, Biome, Behaviour } from '@/entities/bird-domain';
import { draftBirdAction, type DraftedBird } from '@/features/birds/actions/ai-draft-bird';
import { createBirdAction } from '@/features/birds/actions/create-bird-mutation';
import BirdChipPicker from '@/features/birds/components/BirdChipPicker/BirdChipPicker';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

  function toggle<T extends string>(
    arr: T[], set: (v: T[]) => void, value: T, max: number
  ) {
    if (arr.includes(value)) set(arr.filter((v) => v !== value));
    else if (arr.length < max) set([...arr, value]);
  }

  function toggleMonth(m: number) {
    setBestMonths((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m].sort((a, b) => a - b)
    );
  }

  function setTip(i: number, val: string) {
    setTips((prev) => prev.map((t, idx) => (idx === i ? val : t)));
  }
  function removeTip(i: number) {
    setTips((prev) => prev.filter((_, idx) => idx !== i));
  }

  function setMark(i: number, val: string) {
    setMarks((prev) => prev.map((m, idx) => (idx === i ? val : m)));
  }
  function removeMark(i: number) {
    setMarks((prev) => prev.filter((_, idx) => idx !== i));
  }

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

      <section className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rarity</p>
          <select
            value={rarity}
            onChange={(e) => setRarity(e.target.value as Rarity)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {RARITIES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Wingspan (cm)</p>
          <input
            type="number"
            value={wingspan}
            onChange={(e) => setWingspan(Number(e.target.value))}
            min={0}
            step={0.1}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </section>

      <BirdChipPicker label="Food" values={FOODS} imageFor={foodImage} selected={food} max={3}
        onToggle={(v) => toggle(food, setFood, v, 3)} />
      <BirdChipPicker label="Biome" values={BIOMES} imageFor={biomeImage} selected={biomes} max={3}
        onToggle={(v) => toggle(biomes, setBiomes, v, 3)} />
      <BirdChipPicker label="Behaviour" values={BEHAVIOURS} imageFor={behaviourImage} selected={behaviour} max={3}
        onToggle={(v) => toggle(behaviour, setBehaviour, v, 3)} />

      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Best months to observe
        </p>
        <div className="flex flex-wrap gap-1.5">
          {MONTH_LABELS.map((label, i) => {
            const m = i + 1;
            const active = bestMonths.includes(m);
            return (
              <button
                key={m}
                type="button"
                onClick={() => toggleMonth(m)}
                className={`w-10 rounded-md border py-1 text-xs font-mono transition-colors ${
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground hover:border-primary'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Field note</p>
        <textarea
          value={fieldNote}
          onChange={(e) => setFieldNote(e.target.value)}
          maxLength={300}
          rows={3}
          placeholder="Short humorous field note…"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
        <p className="text-xs text-muted-foreground text-right">{fieldNote.length}/300</p>
      </section>

      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          How to find <span className="normal-case font-normal ml-1">({tips.length}/4)</span>
        </p>
        <div className="space-y-1.5">
          {tips.map((tip, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={tip}
                onChange={(e) => setTip(i, e.target.value)}
                maxLength={200}
                placeholder={`Tip ${i + 1}…`}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => removeTip(i)}
                className="shrink-0 px-2 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>
          ))}
          {tips.length < 4 && (
            <button type="button" onClick={() => setTips((prev) => [...prev, ''])} className="text-xs text-primary hover:underline">
              + Add tip
            </button>
          )}
        </div>
      </section>

      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Field marks <span className="normal-case font-normal ml-1">({marks.length}/4)</span>
        </p>
        <div className="space-y-1.5">
          {marks.map((mark, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={mark}
                onChange={(e) => setMark(i, e.target.value)}
                maxLength={200}
                placeholder={`Mark ${i + 1}…`}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => removeMark(i)}
                className="shrink-0 px-2 rounded-lg border border-border text-muted-foreground hover:text-destructive hover:border-destructive transition-colors text-lg leading-none"
              >
                ×
              </button>
            </div>
          ))}
          {marks.length < 4 && (
            <button type="button" onClick={() => setMarks((prev) => [...prev, ''])} className="text-xs text-primary hover:underline">
              + Add mark
            </button>
          )}
        </div>
      </section>

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
