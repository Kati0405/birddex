import { getBirds } from '@/lib/birds';
import BirdSearch from '@/components/BirdSearch';
import { getUserRole } from '@/lib/auth';

export default async function Home() {
  const [birds, role] = await Promise.all([getBirds(), getUserRole()]);

  return (
    <main className="min-h-screen" style={{ background: 'var(--background)' }}>
      <BirdSearch birds={birds} isAdmin={role === 'admin'} />
    </main>
  );
}
