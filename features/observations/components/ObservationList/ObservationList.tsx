'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Bird, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RARITY_COLOR, type Rarity } from '@/entities/bird-domain';
import ConfirmDeleteModal from '@/shared/ui/ConfirmDeleteModal/ConfirmDeleteModal';
import AddObservationModal from '@/features/observations/components/AddObservationModal/AddObservationModal';
import ObservationRow from '@/features/observations/components/ObservationRow/ObservationRow';
import { deleteObservationAction } from '@/features/observations/actions/observation-mutations';
import type { UserObservation } from '@/features/observations/observation-queries';

interface Props {
  observations: UserObservation[];
}

export default function ObservationList({ observations: initialObservations }: Props) {
  const router = useRouter();
  const [observations, setObservations] = useState(initialObservations);
  const [editing, setEditing] = useState<UserObservation | null>(null);
  const [deleting, setDeleting] = useState<UserObservation | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletePending, startDeleteTransition] = useTransition();

  function handleDeleteConfirmed() {
    if (!deleting) return;
    const target = deleting;
    startDeleteTransition(async () => {
      const result = await deleteObservationAction({ id: target.id });
      if ('error' in result) {
        setDeleteError(result.error);
        return;
      }
      setObservations((prev) => prev.filter((o) => o.id !== target.id));
      setDeleting(null);
      router.refresh();
    });
  }

  if (observations.length === 0) {
    return (
      <div className='rounded-xl border border-dashed border-border bg-card/50 px-6 py-8 text-center'>
        <Bird className='h-8 w-8 text-muted-foreground/20 mx-auto mb-2' />
        <p className='text-sm font-medium text-card-foreground'>No observations yet</p>
        <p className='text-xs text-muted-foreground mt-1'>
          Find a bird in the catalog and log your first sighting.
        </p>
        <Link href='/birds' className='inline-block mt-3'>
          <Button size='sm' variant='outline'>
            <Plus className='h-3.5 w-3.5' />
            Browse birds
          </Button>
        </Link>
      </div>
    );
  }

  const grouped = groupByDate(observations);

  return (
    <div className='flex flex-col gap-5'>
      {grouped.map(({ label, observations: obs }) => (
        <div key={label}>
          <h2 className='text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2'>
            {label}
          </h2>
          <div className='rounded-xl border border-border bg-card divide-y divide-border'>
            {obs.map((o) => (
              <ObservationRow
                key={o.id}
                observation={o}
                actions={
                  <div className='flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity'>
                    <button
                      type='button'
                      onClick={() => setEditing(o)}
                      aria-label={`Edit observation of ${o.birdName}`}
                      title='Edit observation'
                      className='flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors'
                    >
                      <Pencil className='h-3.5 w-3.5' />
                    </button>
                    <button
                      type='button'
                      onClick={() => { setDeleteError(null); setDeleting(o); }}
                      aria-label={`Delete observation of ${o.birdName}`}
                      title='Delete observation'
                      className='flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors'
                    >
                      <Trash2 className='h-3.5 w-3.5' />
                    </button>
                  </div>
                }
              />
            ))}
          </div>
        </div>
      ))}

      {editing && (
        <AddObservationModal
          birdId={editing.birdId}
          birdName={editing.birdName}
          frameColor={RARITY_COLOR[editing.birdRarity as Rarity] ?? RARITY_COLOR.Common}
          initialData={{
            observationId: editing.id,
            date: new Date(editing.observedAt),
            seen: editing.seen,
            heard: editing.heard,
            photographed: editing.photographed,
            quality: editing.quality,
            notes: editing.notes,
            photoUrl: editing.photoUrl,
            lat: editing.lat,
            lng: editing.lng,
            locationName: editing.locationName,
          }}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            if (!updated) return;
            setObservations((prev) =>
              prev.map((o) =>
                o.id === updated.observationId
                  ? {
                      ...o,
                      observedAt: updated.date.toISOString(),
                      seen: updated.seen,
                      heard: updated.heard,
                      photographed: updated.photographed,
                      quality: updated.quality,
                      notes: updated.notes,
                      photoUrl: updated.photoUrl,
                      lat: updated.lat,
                      lng: updated.lng,
                      locationName: updated.locationName,
                    }
                  : o
              )
            );
            router.refresh();
          }}
        />
      )}

      {deleting && (
        <ConfirmDeleteModal
          title='Delete observation'
          error={deleteError}
          pending={deletePending}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setDeleting(null)}
        >
          Delete this observation of <span className='font-semibold'>{deleting.birdName}</span>? This cannot be undone.
        </ConfirmDeleteModal>
      )}
    </div>
  );
}

function groupByDate(observations: UserObservation[]) {
  const groups: { label: string; observations: UserObservation[] }[] = [];
  const map = new Map<string, UserObservation[]>();

  for (const obs of observations) {
    const label = format(new Date(obs.observedAt), 'MMMM yyyy');
    const existing = map.get(label);
    if (existing) {
      existing.push(obs);
    } else {
      const arr = [obs];
      map.set(label, arr);
      groups.push({ label, observations: arr });
    }
  }

  return groups;
}
