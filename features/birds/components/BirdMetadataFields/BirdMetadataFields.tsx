'use client';

import {
  RARITIES, RARITY_COLOR, FOODS, foodImage, BIOMES, biomeImage, BEHAVIOURS, behaviourImage,
} from '@/entities/bird-domain';
import type { Rarity, Food, Biome, Behaviour } from '@/entities/bird-domain';
import BirdChipPicker from '@/features/birds/components/BirdChipPicker/BirdChipPicker';
import { toggleInArray } from '@/shared/lib/toggle';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function sectionLabel(text: string, note?: string) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {text}{note && <span className="normal-case font-normal ml-1">{note}</span>}
    </p>
  );
}

function toggle<T extends string>(arr: T[], set: (v: T[]) => void, value: T, max: number) {
  if (arr.includes(value)) set(arr.filter((v) => v !== value));
  else if (arr.length < max) set([...arr, value]);
}

export interface BirdMetadataFieldsValue {
  rarity: Rarity;
  wingspan?: number;
  food: Food[];
  biomes: Biome[];
  behaviour: Behaviour[];
  bestMonths: number[];
  fieldNote: string;
  tips: string[];
  marks: string[];
}

interface BirdMetadataFieldsProps {
  value: BirdMetadataFieldsValue;
  onChange: {
    setRarity: (v: Rarity) => void;
    setWingspan?: (v: number) => void;
    setFood: (v: Food[]) => void;
    setBiomes: (v: Biome[]) => void;
    setBehaviour: (v: Behaviour[]) => void;
    setBestMonths: (v: number[]) => void;
    setFieldNote: (v: string) => void;
    setTips: (v: string[]) => void;
    setMarks: (v: string[]) => void;
  };
  colorRaritySelect?: boolean;
}

export default function BirdMetadataFields({ value, onChange, colorRaritySelect }: BirdMetadataFieldsProps) {
  const {
    rarity, wingspan, food, biomes, behaviour, bestMonths, fieldNote, tips, marks,
  } = value;
  const {
    setRarity, setWingspan, setFood, setBiomes, setBehaviour, setBestMonths, setFieldNote, setTips, setMarks,
  } = onChange;

  function toggleMonth(m: number) {
    setBestMonths(toggleInArray(bestMonths, m).sort((a, b) => a - b));
  }
  function setTip(i: number, val: string) {
    setTips(tips.map((t, idx) => (idx === i ? val : t)));
  }
  function removeTip(i: number) {
    setTips(tips.filter((_, idx) => idx !== i));
  }
  function setMark(i: number, val: string) {
    setMarks(marks.map((m, idx) => (idx === i ? val : m)));
  }
  function removeMark(i: number) {
    setMarks(marks.filter((_, idx) => idx !== i));
  }

  return (
    <>
      <section className={wingspan !== undefined ? 'grid grid-cols-2 gap-4' : 'space-y-2'}>
        <div className="space-y-1">
          {sectionLabel('Rarity')}
          <select
            value={rarity}
            onChange={(e) => setRarity(e.target.value as Rarity)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary"
            style={colorRaritySelect ? { color: RARITY_COLOR[rarity] } : undefined}
          >
            {RARITIES.map((r) => (
              <option key={r} value={r} style={colorRaritySelect ? { color: RARITY_COLOR[r] } : undefined}>{r}</option>
            ))}
          </select>
        </div>
        {wingspan !== undefined && setWingspan && (
          <div className="space-y-1">
            {sectionLabel('Wingspan (cm)')}
            <input
              type="number"
              value={wingspan}
              onChange={(e) => setWingspan(Number(e.target.value))}
              min={0}
              step={0.1}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        )}
      </section>

      <BirdChipPicker label="Food" values={FOODS} imageFor={foodImage} selected={food} max={3}
        onToggle={(v) => toggle(food, setFood, v, 3)} />
      <BirdChipPicker label="Biome" values={BIOMES} imageFor={biomeImage} selected={biomes} max={3}
        onToggle={(v) => toggle(biomes, setBiomes, v, 3)} />
      <BirdChipPicker label="Behaviour" values={BEHAVIOURS} imageFor={behaviourImage} selected={behaviour} max={3}
        onToggle={(v) => toggle(behaviour, setBehaviour, v, 3)} />

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
            <button type="button" onClick={() => setTips([...tips, ''])} className="text-xs text-primary hover:underline">
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
            <button type="button" onClick={() => setMarks([...marks, ''])} className="text-xs text-primary hover:underline">
              + Add mark
            </button>
          )}
        </div>
      </section>
    </>
  );
}
