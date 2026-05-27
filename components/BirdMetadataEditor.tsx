"use client";

import { useState } from "react";
import type React from "react";
import { updateBirdMetadataAction } from "@/app/birds/[id]/edit/actions";
import { FOODS, foodImage } from "@/lib/food";
import { BIOMES, biomeImage } from "@/lib/biome";
import { BEHAVIOURS, behaviourImage } from "@/lib/behaviour";
import type { Food, Biome, Behaviour } from "@/lib/types";
import HexIcon from "@/components/HexIcon";
import type { StaticImageData } from "next/image";

interface Props {
  birdId: number;
  currentFood: Food[];
  currentBiomes: Biome[];
  currentBehaviour: Behaviour[];
}

function ToggleChip<T extends string>({
  value,
  imageSrc,
  label,
  selected,
  max,
  count,
  onToggle,
}: {
  value: T;
  imageSrc: StaticImageData;
  label: string;
  selected: boolean;
  max: number;
  count: number;
  onToggle: (v: T) => void;
}) {
  const disabled = !selected && count >= max;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onToggle(value)}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition-colors
        ${selected
          ? "border-primary bg-primary text-primary-foreground"
          : disabled
          ? "border-border bg-muted text-muted-foreground opacity-40 cursor-not-allowed"
          : "border-border bg-background hover:border-primary"
        }`}
    >
      <HexIcon imageSrc={imageSrc} label={undefined} size={22} />
      {label}
    </button>
  );
}

export default function BirdMetadataEditor({ birdId, currentFood, currentBiomes, currentBehaviour }: Props) {
  const [food, setFood] = useState<Food[]>(currentFood);
  const [biomes, setBiomes] = useState<Biome[]>(currentBiomes);
  const [behaviour, setBehaviour] = useState<Behaviour[]>(currentBehaviour);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  function toggle<T extends string>(
    arr: T[],
    set: React.Dispatch<React.SetStateAction<T[]>>,
    value: T,
    max: number
  ) {
    if (arr.includes(value)) {
      set(arr.filter((v) => v !== value));
    } else if (arr.length < max) {
      set([...arr, value]);
    }
  }

  async function handleSave() {
    setStatus("saving");
    const result = await updateBirdMetadataAction({ birdId, food, biomes, behaviour });
    if (result && "error" in result) {
      setStatus("error");
    } else {
      setStatus("saved");
    }
  }

  return (
    <div className="space-y-6 rounded-xl border border-border bg-card p-6">
      <h2 className="text-base font-bold">Edit metadata</h2>

      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Food <span className="normal-case font-normal">(1–3)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {FOODS.map((f) => (
            <ToggleChip
              key={f}
              value={f}
              imageSrc={foodImage[f]}
              label={f}
              selected={food.includes(f)}
              max={3}
              count={food.length}
              onToggle={(v) => toggle(food, setFood, v, 3)}
            />
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Biome <span className="normal-case font-normal">(1–3)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {BIOMES.map((b) => (
            <ToggleChip
              key={b}
              value={b}
              imageSrc={biomeImage[b]}
              label={b}
              selected={biomes.includes(b)}
              max={3}
              count={biomes.length}
              onToggle={(v) => toggle(biomes, setBiomes, v, 3)}
            />
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Behaviour <span className="normal-case font-normal">(1–3)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {BEHAVIOURS.map((beh) => (
            <ToggleChip
              key={beh}
              value={beh}
              imageSrc={behaviourImage[beh]}
              label={beh}
              selected={behaviour.includes(beh)}
              max={3}
              count={behaviour.length}
              onToggle={(v) => toggle(behaviour, setBehaviour, v, 3)}
            />
          ))}
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={status === "saving" || food.length === 0 || biomes.length === 0 || behaviour.length === 0}
          onClick={handleSave}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "saving" ? "Saving…" : "Save metadata"}
        </button>
        {status === "saved" && <span className="text-sm text-green-600">Saved!</span>}
        {status === "error" && <span className="text-sm text-red-500">Something went wrong.</span>}
      </div>
    </div>
  );
}
