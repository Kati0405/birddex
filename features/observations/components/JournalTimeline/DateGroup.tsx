import { format } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';
import ObservationRow from '@/features/observations/components/ObservationRow/ObservationRow';
import type { JournalObservation } from '@/features/observations/journal-queries';

interface Props {
  date: string; // YYYY-MM-DD
  observations: JournalObservation[];
  onEdit: (o: JournalObservation) => void;
  onDelete: (o: JournalObservation) => void;
}

export default function DateGroup({ date, observations, onEdit, onDelete }: Props) {
  const parsed = new Date(`${date}T00:00:00`);
  const speciesCount = new Set(observations.map((o) => o.birdId)).size;

  return (
    <div className='flex gap-3'>
      <div className='hidden lg:flex flex-col items-center shrink-0 w-10 pt-3'>
        <span className='font-heading text-xl font-bold text-foreground leading-none'>
          {format(parsed, 'dd')}
        </span>
        <span className='text-[9px] uppercase tracking-widest text-muted-foreground font-mono mt-0.5'>
          {format(parsed, 'MMM')}
        </span>
      </div>
      <div className='flex-1 min-w-0'>
        <div className='flex items-center gap-2 px-1 py-2'>
          <span className='text-xs font-medium text-foreground'>{format(parsed, 'EEEE, d MMM')}</span>
          <span className='text-xs text-muted-foreground'>
            &middot; {speciesCount} {speciesCount === 1 ? 'species' : 'species'}
          </span>
        </div>
        <div className='rounded-xl border border-border bg-card divide-y divide-border overflow-hidden'>
          {observations.map((o) => (
            <div key={o.id} className='group'>
              <ObservationRow
                observation={o}
                actions={
                  <div className='flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity'>
                    <button
                      type='button'
                      onClick={() => onEdit(o)}
                      aria-label={`Edit observation of ${o.birdName}`}
                      title='Edit observation'
                      className='flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors'
                    >
                      <Pencil className='h-3.5 w-3.5' />
                    </button>
                    <button
                      type='button'
                      onClick={() => onDelete(o)}
                      aria-label={`Delete observation of ${o.birdName}`}
                      title='Delete observation'
                      className='flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors'
                    >
                      <Trash2 className='h-3.5 w-3.5' />
                    </button>
                  </div>
                }
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
