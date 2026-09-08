import { Badge } from '@/shared/ui/primitives/badge';

export default function StatChip({ icon, label }: { icon: string; label: string }) {
  return (
    <Badge variant="secondary" className="gap-1 font-normal text-muted-foreground">
      <span>{icon}</span>
      <span>{label}</span>
    </Badge>
  );
}
