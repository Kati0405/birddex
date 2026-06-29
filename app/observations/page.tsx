import { requireAuth } from '@/features/auth/auth-helpers';
import { getAllUserObservations } from '@/features/observations/observation-queries';
import ObservationList from '@/features/observations/components/ObservationList/ObservationList';

export default async function ObservationsPage() {
  await requireAuth();
  const observations = await getAllUserObservations();

  return (
    <main className='min-h-screen bg-background'>
      <div className='px-0 md:px-6 py-5'>
        <p className='mb-4 text-[10px] text-muted-foreground tracking-widest uppercase font-mono'>
          {observations.length === 0
            ? 'No observations yet'
            : `${observations.length} ${observations.length === 1 ? 'observation' : 'observations'}`}
        </p>
        <ObservationList observations={observations} />
      </div>
    </main>
  );
}
