import type { Metadata } from 'next';
import { getUser } from '@/features/auth/auth-helpers';
import { buildUserContext } from '@/features/bird-guide/bird-guide-context';
import AskRobinFull from '@/features/bird-guide/components/AskRobinFull/AskRobinFull';
import PageBackdrop from '@/shared/ui/PageBackdrop';
import PageHero from '@/shared/ui/PageHero';

export const metadata: Metadata = {
  title: 'birds.in.ua — Ask Robin',
  description: 'Ask Robin anything about birds. Logged-in users get answers based on their own observations.',
};

export default async function AskRobinPage() {
  const user = await getUser();
  const userContext = user ? await buildUserContext(user.id) : null;

  return (
    <PageBackdrop showUpper={false} className="flex flex-col flex-1">
      <div className="max-w-2xl mx-auto w-full px-4 pt-6">
        <PageHero
          title="Ask Robin"
          subtitle="Your friendly neighborhood bird expert."
          bgImage="/hero/background_robin.png"
          bgPosition="70% 45%"
          birdImage=""
          textAlign="left"
        />
      </div>
      <div className="flex flex-col flex-1 min-h-0">
        <AskRobinFull userContext={userContext} />
      </div>
    </PageBackdrop>
  );
}
