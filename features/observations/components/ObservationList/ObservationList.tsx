'use client';

import { useState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { format } from 'date-fns';
import { enUS, uk, type Locale as DateFnsLocale } from 'date-fns/locale';
import {
  Eye,
  Music,
  Camera,
  Bird,
  MapPin,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RARITY_COLOR, type Rarity } from '@/entities/bird-domain';
import ConfirmDeleteModal from '@/shared/ui/ConfirmDeleteModal/ConfirmDeleteModal';
import AddObservationModal from '@/features/observations/components/AddObservationModal/AddObservationModal';
import { deleteObservationAction } from '@/features/observations/actions/observation-mutations';
import type { UserObservation } from '@/features/observations/observation-queries';

interface Props {
  observations: UserObservation[];
}

export default function ObservationList({ observations: initialObservations }: Props) {
  const router = useRouter();
  const t = useTranslations('ObservationsPage');
  const locale = useLocale();
  const dateFnsLocale = locale === 'uk' ? uk : enUS;
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
        <p className='text-sm font-medium text-card-foreground'>{t('emptyTitle')}</p>
        <p className='text-xs text-muted-foreground mt-1'>
          {t('emptyDescription')}
        </p>
        <Link href='/birds' className='inline-block mt-3'>
          <Button size='sm' variant='outline'>
            <Plus className='h-3.5 w-3.5' />
            {t('browseBirds')}
          </Button>
        </Link>
      </div>
    );
  }

  const grouped = groupByDate(observations, dateFnsLocale);

  return (
    <div className='flex flex-col gap-5'>
      {grouped.map(({ label, observations: obs }) => (
        <div key={label}>
          <h2 className='text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2'>
            {label}
          </h2>
          <div className='rounded-xl border border-border bg-card divide-y divide-border'>
            {obs.map((o) => (
              <div
                key={o.id}
                className='flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group first:rounded-t-xl last:rounded-b-xl'
              >
                <Link href={`/birds/${o.birdId}?obs=${o.id}&flipped=1`} className='flex items-center gap-3 min-w-0 flex-1'>
                  {(o.photoThumbUrl || o.birdImageUrl) ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={(o.photoThumbUrl ?? o.birdImageUrl)!}
                      alt={o.birdName}
                      className='h-9 w-9 rounded-lg object-cover shrink-0'
                    />
                  ) : (
                    <div className='h-9 w-9 rounded-lg bg-muted/30 flex items-center justify-center shrink-0'>
                      <Bird className='h-4 w-4 text-muted-foreground/40' />
                    </div>
                  )}
                  <div className='min-w-0 flex-1'>
                    <p className='text-sm font-medium text-card-foreground truncate group-hover:text-primary transition-colors'>
                      {o.birdName}
                    </p>
                    <div className='flex items-center gap-2 mt-0.5'>
                      <span className='text-[11px] text-muted-foreground'>
                        {format(new Date(o.observedAt), 'd MMM yyyy', { locale: dateFnsLocale })}
                      </span>
                      <span className='flex items-center gap-1 text-muted-foreground/50'>
                        {o.seen && <Eye className='h-3 w-3' />}
                        {o.heard && <Music className='h-3 w-3' />}
                        {o.photographed && <Camera className='h-3 w-3' />}
                      </span>
                      {o.quality != null && (() => {
                        const q = o.quality;
                        return (
                          <span className='flex gap-px text-amber-500/70' title={`${q}/5`}>
                            {[1, 2, 3, 4, 5].map((i) => (
                              <svg key={i} viewBox='0 0 20 20' className='w-2.5 h-2.5' aria-hidden='true'>
                                <path
                                  d='M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.49L10 14.24l-4.94 2.46.94-5.49-4-3.9 5.53-.8z'
                                  fill={i <= q ? 'currentColor' : 'transparent'}
                                  stroke='currentColor'
                                  strokeWidth='1.2'
                                  strokeLinejoin='round'
                                  style={{ opacity: i <= q ? 1 : 0.25 }}
                                />
                              </svg>
                            ))}
                          </span>
                        );
                      })()}
                      {o.locationName && (
                        <span className='flex items-center gap-0.5 text-[11px] text-muted-foreground/50 truncate'>
                          <MapPin className='h-3 w-3 shrink-0' />
                          <span className='truncate'>{o.locationName}</span>
                        </span>
                      )}
                    </div>
                    {o.notes && (
                      <p className='text-[11px] text-muted-foreground/50 truncate mt-0.5'>
                        {o.notes}
                      </p>
                    )}
                  </div>
                </Link>
                <div className='flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity'>
                  <button
                    type='button'
                    onClick={() => setEditing(o)}
                    aria-label={t('editObservationOf', { name: o.birdName })}
                    title={t('editObservation')}
                    className='flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors'
                  >
                    <Pencil className='h-3.5 w-3.5' />
                  </button>
                  <button
                    type='button'
                    onClick={() => { setDeleteError(null); setDeleting(o); }}
                    aria-label={t('deleteObservationOf', { name: o.birdName })}
                    title={t('deleteObservation')}
                    className='flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors'
                  >
                    <Trash2 className='h-3.5 w-3.5' />
                  </button>
                </div>
              </div>
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
          title={t('deleteObservation')}
          error={deleteError}
          pending={deletePending}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setDeleting(null)}
        >
          {t.rich('deleteObservationConfirm', {
            name: deleting.birdName,
            b: (chunks) => <span className='font-semibold'>{chunks}</span>,
          })}
        </ConfirmDeleteModal>
      )}
    </div>
  );
}

function groupByDate(observations: UserObservation[], dateFnsLocale: DateFnsLocale) {
  const groups: { label: string; observations: UserObservation[] }[] = [];
  const map = new Map<string, UserObservation[]>();

  for (const obs of observations) {
    const label = format(new Date(obs.observedAt), 'MMMM yyyy', { locale: dateFnsLocale });
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
