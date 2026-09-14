import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { Eye, Music, Camera, Bird, MapPin, Calendar, ChevronRight } from 'lucide-react';
import { RARITY_COLOR, type Rarity } from '@/entities/bird-domain';
import firstTimeBadge from '@/entities/bird-icons/ui/1st-time-badge.png';
import ObservationQualityStars from '@/features/observations/components/ObservationQualityStars/ObservationQualityStars';
import type { ObservationQuality } from '@/features/observations/observation-queries';

export interface ObservationRowData {
  id: string;
  birdId: number;
  birdName: string;
  birdImageUrl: string | null;
  birdRarity?: string;
  isFirstEncounter?: boolean;
  observedAt: string;
  seen: boolean;
  heard: boolean;
  photographed: boolean;
  notes: string | null;
  photoThumbUrl: string | null;
  quality?: ObservationQuality;
  locationName?: string | null;
}

interface ObservationRowProps {
  observation: ObservationRowData;
  actions?: React.ReactNode;
}

export default function ObservationRow({ observation: o, actions }: ObservationRowProps) {
  const frameColor = o.birdRarity ? RARITY_COLOR[o.birdRarity as Rarity] ?? RARITY_COLOR.Common : null;

  return (
    <div className="flex items-center gap-x-3 gap-y-1 px-4 py-3 hover:bg-muted/30 transition-colors first:rounded-t-xl last:rounded-b-xl">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {(o.photoThumbUrl || o.birdImageUrl) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={(o.photoThumbUrl ?? o.birdImageUrl)!}
            alt={o.birdName}
            className="h-9 w-9 rounded-lg object-cover shrink-0"
          />
        ) : (
          <div className="h-9 w-9 rounded-lg bg-muted/30 flex items-center justify-center shrink-0">
            <Bird className="h-4 w-4 text-muted-foreground/40" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 min-w-0">
            {frameColor && (
              <span
                className="w-[7px] h-[7px] shrink-0"
                style={{
                  clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                  background: frameColor,
                }}
                title={`Rarity: ${o.birdRarity}`}
              />
            )}
            <span className="text-sm font-medium text-card-foreground truncate">
              {o.birdName}
            </span>
            {o.isFirstEncounter && (
              <Image
                src={firstTimeBadge}
                alt="First encounter with this species"
                title="First encounter with this species"
                width={16}
                height={16}
                className="shrink-0"
              />
            )}
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 min-w-0">
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
              <Calendar className="h-3 w-3 shrink-0" aria-hidden="true" />
              {format(new Date(o.observedAt), 'd MMM yyyy')}
            </span>
            {(o.seen || o.heard || o.photographed) && (
              <span className="flex items-center gap-1 text-muted-foreground/50 shrink-0">
                {o.seen && <Eye className="h-3 w-3" />}
                {o.heard && <Music className="h-3 w-3" />}
                {o.photographed && <Camera className="h-3 w-3" />}
              </span>
            )}
            {o.quality != null && (
              <span className="shrink-0">
                <ObservationQualityStars rating={o.quality} size="list" className="text-amber-500/70" />
              </span>
            )}
            {o.locationName && (
              <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground/50 truncate min-w-0">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{o.locationName}</span>
              </span>
            )}
          </div>
          {o.notes && (
            <p className="text-[11px] text-muted-foreground/50 truncate mt-0.5">
              {o.notes}
            </p>
          )}
        </div>
      </div>
      {actions}
      <Link
        href={`/birds/${o.birdId}?obs=${o.id}&flipped=1`}
        aria-label={`View ${o.birdName} observation`}
        className="group shrink-0 p-1 -m-1 rounded-md hover:bg-muted/50 transition-colors"
      >
        <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" aria-hidden="true" />
      </Link>
    </div>
  );
}
