import type { Metadata } from 'next';
import { getUser } from '@/features/auth/auth-helpers';
import { buildUserContext } from '@/features/bird-guide/bird-guide-context';
import BirdGuideFull from '@/features/bird-guide/components/BirdGuideFull/BirdGuideFull';

export const metadata: Metadata = {
  title: 'BirdDex — Bird Guide',
  description: 'Ask anything about birds. Logged-in users get answers based on their own observations.',
};

export default async function BirdGuidePage() {
  const user = await getUser();
  const userContext = user ? await buildUserContext(user.id) : null;

  return (
    <main className="flex flex-col flex-1">
      <BirdGuideFull userContext={userContext} />
    </main>
  );
}
