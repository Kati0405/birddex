import type { Metadata } from 'next';
import BirdGuideFull from '@/features/bird-guide/components/BirdGuideFull/BirdGuideFull';

export const metadata: Metadata = {
  title: 'BirdDex — Bird Guide',
  description: 'Ask anything about birds. Logged-in users get answers based on their own observations.',
};

export default function BirdGuidePage() {
  return (
    <main className="flex flex-col flex-1">
      <BirdGuideFull />
    </main>
  );
}
