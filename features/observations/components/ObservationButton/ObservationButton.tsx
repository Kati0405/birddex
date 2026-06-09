'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import binocularsImg from '@/components/icons/ui/binoculars.png';
import checkMarkImg from '@/components/icons/ui/check-mark.png';
import AddObservationModal from '@/features/observations/components/AddObservationModal/AddObservationModal';
import type { SavedLocation } from '@/features/locations/location-queries';

interface ObservationButtonProps {
  birdId: number;
  birdName: string;
  frameColor: string;
  initialObserved: boolean;
  savedLocations?: SavedLocation[];
}

export default function ObservationButton({
  birdId,
  birdName,
  frameColor,
  initialObserved,
  savedLocations = [],
}: ObservationButtonProps) {
  const router = useRouter();
  const [observed, setObserved] = useState(initialObserved);
  const [modalOpen, setModalOpen] = useState(false);

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    setModalOpen(true);
  }

  return (
    <>
      <button
        onClick={handleClick}
        title='Add observation'
        aria-label='Add observation'
        className='relative flex items-center justify-center rounded-full transition-all'
        style={{
          width: 28,
          height: 28,
          background: observed ? `${frameColor}22` : 'rgba(250,246,237,0.85)',
          border: `1px solid ${observed ? frameColor + '70' : '#c4a87840'}`,
          flexShrink: 0,
        }}
      >
        <Image
          src={binocularsImg}
          alt=''
          width={14}
          height={14}
          style={{ opacity: observed ? 0.85 : 0.45 }}
        />
        {observed && (
          <Image
            src={checkMarkImg}
            alt=''
            width={10}
            height={10}
            className='absolute -top-1 -right-1'
          />
        )}
      </button>

      {modalOpen && (
        <AddObservationModal
          birdId={birdId}
          birdName={birdName}
          frameColor={frameColor}
          savedLocations={savedLocations}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setObserved(true); router.refresh(); }}
        />
      )}
    </>
  );
}
