import Link from 'next/link';
import { format } from 'date-fns';
import { Eye, Music, Camera, Bird, MapPin } from 'lucide-react';
import ObservationQualityStars from '@/features/observations/components/ObservationQualityStars/ObservationQualityStars';
import type { ObservationQuality } from '@/features/observations/observation-queries';

export interface ObservationRowData {
  id: string;
  birdId: number;
  birdName: string;
  birdImageUrl: string | null;
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
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors group first:rounded-t-xl last:rounded-b-xl">
      <Link href={`/birds/${o.birdId}?obs=${o.id}&flipped=1`} className="flex items-center gap-3 min-w-0 flex-1">
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
          <p className="text-sm font-medium text-card-foreground truncate group-hover:text-primary transition-colors">
            {o.birdName}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-muted-foreground">
              {format(new Date(o.observedAt), 'd MMM yyyy')}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground/50">
              {o.seen && <Eye className="h-3 w-3" />}
              {o.heard && <Music className="h-3 w-3" />}
              {o.photographed && <Camera className="h-3 w-3" />}
            </span>
            {o.quality != null && (
              <ObservationQualityStars rating={o.quality} size="list" className="text-amber-500/70" />
            )}
            {o.locationName && (
              <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground/50 truncate">
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
      </Link>
      {actions}
    </div>
  );
}
