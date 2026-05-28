import { getBirds } from '@/features/birds/bird-queries';
import BirdSearch from '@/features/birds/components/BirdSearch/BirdSearch';
import { getUser, getUserRole } from '@/features/auth/auth-helpers';
import { getObservedBirdIds } from '@/features/observations/observation-queries';

export default async function Home() {
  const [birds, role, user] = await Promise.all([getBirds(), getUserRole(), getUser()]);
  const observedIds = user ? await getObservedBirdIds(user.id) : [];

  return (
    <main className="min-h-screen" style={{ background: 'var(--background)' }}>
      <BirdSearch
        birds={birds}
        isAdmin={role === 'admin'}
        isAuthenticated={!!user}
        observedIds={observedIds}
      />
    </main>
  );
}
