import Link from 'next/link';
import { format } from 'date-fns';
import { Sparkles, Calendar } from 'lucide-react';
import BirdCardMini from '@/features/birds/components/BirdCardMini/BirdCardMini';
import type { Bird } from '@/entities/bird-domain';
import type { JournalMonthData } from '@/features/observations/journal-queries';

interface Props {
  newSpecies: JournalMonthData['newSpecies'];
}

export default function NewToCollection({ newSpecies }: Props) {
  return (
    <div className='rounded-xl border border-border bg-card p-4'>
      <h2 className='font-heading text-sm font-bold text-card-foreground mb-1'>
        New to your collection
      </h2>
      <p className='text-xs text-muted-foreground mb-3'>
        Specied you added to your collection for the first time this month.
      </p>

      {newSpecies.length === 0 ? (
        <div className='flex flex-col items-center text-center py-6'>
          <Sparkles className='h-6 w-6 text-muted-foreground/20 mb-2' />
          <p className='text-xs text-muted-foreground'>
            No new species this month yet.
          </p>
        </div>
      ) : (
        <div
          className='flex gap-4 overflow-x-auto no-scrollbar-mobile -mx-4 px-4'
          style={{ '--mini-card-w': '120px' } as React.CSSProperties}
        >
          {newSpecies.map((s) => {
            const miniBird: Bird = {
              id: s.birdId,
              name_eng: s.birdName,
              name_latin: s.birdNameLatin,
              rarity: (s.birdRarity as Bird['rarity']) ?? 'Common',
              biomes: s.birdBiomes,
              food: s.birdFood,
              behaviour: [],
              wingspan: 0,
              field_note: '',
              image_url: s.birdImageUrl ?? undefined,
              selected_image: s.birdSelectedImage,
              best_months: [],
              tips_to_find: [],
              field_marks: [],
            };
            return (
              <Link
                key={s.birdId}
                href={`/birds/${s.birdId}`}
                className='block w-(--mini-card-w) shrink-0'
              >
                <BirdCardMini bird={miniBird} hideAttribution />
                <p className='flex items-center justify-center gap-1 text-[10px] text-muted-foreground mt-1'>
                  <Calendar className='h-3 w-3 shrink-0' aria-hidden='true' />
                  {format(new Date(s.firstEncounterAt), 'd MMM yyyy')}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
