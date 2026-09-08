import type { Bird } from '@/entities/bird-domain';
import BirdCardMini from '@/features/birds/components/BirdCardMini';

export default function LandingBirdCardPreview({ bird }: { bird: Bird }) {
  return <BirdCardMini bird={bird} />;
}
