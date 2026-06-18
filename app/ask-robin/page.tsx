import type { Metadata } from 'next';
import { getUser } from '@/features/auth/auth-helpers';
import { buildUserContext } from '@/features/bird-guide/bird-guide-context';
import AskRobinFull from '@/features/bird-guide/components/AskRobinFull/AskRobinFull';

export const metadata: Metadata = {
  title: 'BirdDex — Ask Robin',
  description: 'Ask Robin anything about birds. Logged-in users get answers based on their own observations.',
};

export default async function AskRobinPage() {
  const user = await getUser();
  const userContext = user ? await buildUserContext(user.id) : null;

  return (
    <main className="flex flex-col flex-1">
      <AskRobinFull userContext={userContext} />
    </main>
  );
}
