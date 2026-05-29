'use client';

import { useState } from 'react';
import type React from 'react';
import { updateBirdMetadataAction } from '@/features/birds/actions/bird-mutations';
import { FOODS, foodImage, BIOMES, biomeImage, BEHAVIOURS, behaviourImage } from '@/entities/bird-domain';
import type { Food, Biome, Behaviour } from '@/entities/bird-domain';
import HexIcon from '@/shared/ui/HexIcon/HexIcon';
import type { StaticImageData } from 'next/image';

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

interface Props {
  birdId: number;
  currentFood: Food[];
  currentBiomes: Biome[];
  currentBehaviour: Behaviour[];
  currentBestMonths: number[];
  currentFieldNote: string;
  currentTipsToFind: string[];
  currentFieldMarks: string[];
}

function ToggleChip<T extends string>({
  value, imageSrc, label, selected, max, count, onToggle,
}: {
  value: T; imageSrc: StaticImageData; label: string;
  selected: boolean; max: number; count: number; onToggle: (v: T) => void;
}) {
  const disabled = !selected && count >= max;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onToggle(value)}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition-colors
        ${selected
          ? 'border-primary bg-primary text-primary-foreground'
          : disabled
          ? 'border-border bg-muted text-muted-foreground opacity-40 cursor-not-allowed'
          : 'border-border bg-background hover:border-primary'
        }`}
    >
      <HexIcon imageSrc={imageSrc} label={undefined} size={22} />
      {label}
    </button>
  );
}

export default function BirdMetadataEditor({
  birdId,
  currentFood,
  currentBiomes,
  currentBehaviour,
  currentBestMonths,
  currentFieldNote,
  currentTipsToFind,
  currentFieldMarks,
}: Props) {
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

  function toggle<T extends string>(
    arr: T[], set: React.Dispatch<React.SetStateAction<T[]>>, value: T, max: number
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
    const result = await updateBirdMetadataAction({
      birdId,
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

  const sectionLabel = (text: string, note?: string) => (
    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {text}{note && <span className="normal-case font-normal ml-1">{note}</span>}
    </p>
  );

  return (
    <div className="space-y-6 rounded-xl border border-border bg-card p-6">
      <h2 className="text-base font-bold">Edit metadata</h2>

      <section className="space-y-2">
        {sectionLabel('Food', '(1–3)')}
        <div className="flex flex-wrap gap-2">
          {FOODS.map((f) => (
            <ToggleChip key={f} value={f} imageSrc={foodImage[f]} label={f}
              selected={food.includes(f)} max={3} count={food.length}
              onToggle={(v) => toggle(food, setFood, v, 3)} />
          ))}
        </div>
      </section>

      <section className="space-y-2">
        {sectionLabel('Biome', '(1–3)')}
        <div className="flex flex-wrap gap-2">
          {BIOMES.map((b) => (
            <ToggleChip key={b} value={b} imageSrc={biomeImage[b]} label={b}
              selected={biomes.includes(b)} max={3} count={biomes.length}
              onToggle={(v) => toggle(biomes, setBiomes, v, 3)} />
          ))}
        </div>
      </section>

      <section className="space-y-2">
        {sectionLabel('Behaviour', '(1–3)')}
        <div className="flex flex-wrap gap-2">
          {BEHAVIOURS.map((beh) => (
            <ToggleChip key={beh} value={beh} imageSrc={behaviourImage[beh]} label={beh}
              selected={behaviour.includes(beh)} max={3} count={behaviour.length}
              onToggle={(v) => toggle(behaviour, setBehaviour, v, 3)} />
          ))}
        </div>
      </section>

      <section className="space-y-2">
        {sectionLabel('Best months to observe')}
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
        {sectionLabel('Field note')}
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
        {sectionLabel('How to find', `(${tips.length}/4)`)}
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
            <button
              type="button"
              onClick={() => setTips((prev) => [...prev, ''])}
              className="text-xs text-primary hover:underline"
            >
              + Add tip
            </button>
          )}
        </div>
      </section>

      <section className="space-y-2">
        {sectionLabel('Field marks', `(${marks.length}/4)`)}
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
            <button
              type="button"
              onClick={() => setMarks((prev) => [...prev, ''])}
              className="text-xs text-primary hover:underline"
            >
              + Add mark
            </button>
          )}
        </div>
      </section>

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
