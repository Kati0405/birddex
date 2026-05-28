'use client';

import { useTransition, useState } from 'react';
import { toggleCollectedAction } from '@/features/collection/actions/collection-mutations';

interface CollectButtonProps {
  birdId: number;
  initialCollected: boolean;
  frameColor: string;
}

export default function CollectButton({ birdId, initialCollected, frameColor }: CollectButtonProps) {
  const [collected, setCollected] = useState(initialCollected);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    setCollected((c) => !c);
    startTransition(async () => {
      const result = await toggleCollectedAction(birdId);
      if ('error' in result) {
        setCollected((c) => !c);
      } else {
        setCollected(result.collected);
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all disabled:opacity-60"
      style={
        collected
          ? { background: `${frameColor}25`, border: `1px solid ${frameColor}70`, color: frameColor }
          : { background: 'transparent', border: '1px solid #c4a87860', color: '#8a6c44' }
      }
    >
      {collected ? '✓ Collected' : '+ Collect'}
    </button>
  );
}
