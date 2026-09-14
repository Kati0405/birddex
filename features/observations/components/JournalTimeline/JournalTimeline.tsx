'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Bird } from 'lucide-react';
import { RARITY_COLOR, type Rarity } from '@/entities/bird-domain';
import ConfirmDeleteModal from '@/shared/ui/ConfirmDeleteModal/ConfirmDeleteModal';
import AddObservationModal from '@/features/observations/components/AddObservationModal/AddObservationModal';
import QuickAddObservationButton from '@/features/observations/components/QuickAddObservation/QuickAddObservationButton';
import { deleteObservationAction } from '@/features/observations/actions/observation-mutations';
import DateGroup from './DateGroup';
import type { JournalObservation } from '@/features/observations/journal-queries';
import type { SavedLocation } from '@/features/locations/location-queries';

const GROUPS_PAGE_SIZE = 5;

interface Props {
  monthLabel: string;
  observations: JournalObservation[];
  savedLocations: SavedLocation[];
}

export default function JournalTimeline({ monthLabel, observations: initialObservations, savedLocations }: Props) {
  const router = useRouter();
  const [observations, setObservations] = useState(initialObservations);
  useEffect(() => {
    setObservations(initialObservations);
  }, [initialObservations]);
  const [editing, setEditing] = useState<JournalObservation | null>(null);
  const [deleting, setDeleting] = useState<JournalObservation | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletePending, startDeleteTransition] = useTransition();
  const [visibleGroups, setVisibleGroups] = useState(GROUPS_PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const grouped = useMemo(() => groupByDate(observations), [observations]);
  const visible = grouped.slice(0, visibleGroups);

  const loadMore = useCallback(() => {
    setVisibleGroups((n) => Math.min(n + GROUPS_PAGE_SIZE, grouped.length));
  }, [grouped.length]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

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

  return (
    <div>
      <h2 className='font-heading text-lg font-bold text-card-foreground mb-3'>
        {monthLabel} encounters
      </h2>

      {observations.length === 0 ? (
        <div className='rounded-xl border border-dashed border-border bg-card/50 px-6 py-10 text-center'>
          <Bird className='h-8 w-8 text-muted-foreground/20 mx-auto mb-2' />
          <p className='text-sm font-medium text-card-foreground'>No observations this month</p>
          <p className='text-xs text-muted-foreground mt-1'>
            Log a new sighting, or add a past encounter you forgot to record.
          </p>
          <QuickAddObservationButton
            savedLocations={savedLocations}
            variant='inline'
            className='mt-3'
          />
        </div>
      ) : (
        <div className='flex flex-col gap-5'>
          {visible.map(({ date, observations: obs }) => (
            <DateGroup
              key={date}
              date={date}
              observations={obs}
              onEdit={setEditing}
              onDelete={(o) => { setDeleteError(null); setDeleting(o); }}
            />
          ))}
          <div ref={sentinelRef} className='h-4' />
          {visibleGroups < grouped.length && (
            <p className='py-2 text-center text-[10px] text-muted-foreground tracking-widest uppercase font-mono'>
              Loading&hellip;
            </p>
          )}
        </div>
      )}

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

function groupByDate(observations: JournalObservation[]) {
  const groups: { date: string; observations: JournalObservation[] }[] = [];
  const map = new Map<string, JournalObservation[]>();

  for (const obs of observations) {
    // Grouped by the browser's local calendar date, matching how ObservationRow
    // displays observedAt via date-fns format() — not the raw UTC date slice.
    const date = format(new Date(obs.observedAt), 'yyyy-MM-dd');
    const existing = map.get(date);
    if (existing) {
      existing.push(obs);
    } else {
      const arr = [obs];
      map.set(date, arr);
      groups.push({ date, observations: arr });
    }
  }

  return groups;
}
