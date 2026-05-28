'use client';

import { useState, useTransition } from 'react';
import { addObservationAction } from '@/features/observations/actions/observation-mutations';

interface AddObservationModalProps {
  birdId: number;
  birdName: string;
  frameColor: string;
  onClose: () => void;
  onSaved: () => void;
}

const INK = '#2a1808';
const INK_MED = '#6b5030';
const INK_LIGHT = '#8a6c44';
const PAPER_BG = 'linear-gradient(170deg, #faf6ed 0%, #f0e6cc 45%, #e4d5b0 100%)';

export default function AddObservationModal({
  birdId,
  birdName,
  frameColor,
  onClose,
  onSaved,
}: AddObservationModalProps) {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await addObservationAction({
        birdId,
        observedAt: new Date(date),
      });
      if ('error' in result) {
        setError(result.error);
      } else {
        onSaved();
        onClose();
      }
    });
  }

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center p-4'
      style={{ background: 'rgba(20,16,10,0.55)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className='relative w-full max-w-sm rounded-2xl overflow-hidden'
        style={{
          background: PAPER_BG,
          border: `2px solid ${frameColor}60`,
          boxShadow: `0 8px 40px ${frameColor}25, 0 2px 12px rgba(0,0,0,0.18)`,
        }}
      >
        <div className='h-1 w-full' style={{ background: frameColor }} />

        <div className='px-6 pt-5 pb-6'>
          <div className='mb-5'>
            <h2 className='text-base font-semibold' style={{ color: INK }}>
              Add observation
            </h2>
            <p className='text-xs italic mt-0.5' style={{ color: INK_MED }}>
              {birdName}
            </p>
          </div>

          <div className='mb-6'>
            <label
              className='block text-xs mb-2'
              style={{ color: INK_LIGHT, letterSpacing: '0.04em' }}
            >
              When did you observe this bird?
            </label>
            <input
              type='date'
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value)}
              className='w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors'
              style={{
                background: '#faf6ed',
                border: `1px solid ${frameColor}50`,
                color: INK,
                fontFamily: 'inherit',
              }}
            />
          </div>

          {error && (
            <p className='text-xs mb-4' style={{ color: '#c0392b' }}>
              {error}
            </p>
          )}

          <div className='flex gap-3 justify-end'>
            <button
              onClick={onClose}
              disabled={pending}
              className='px-4 py-2 rounded-lg text-xs transition-colors'
              style={{
                color: INK_LIGHT,
                background: `${frameColor}10`,
                border: `1px solid ${frameColor}30`,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={pending || !date}
              className='px-4 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-50'
              style={{
                background: frameColor,
                color: '#fff',
                border: `1px solid ${frameColor}`,
                boxShadow: `0 2px 8px ${frameColor}40`,
              }}
            >
              {pending ? 'Saving…' : 'Save observation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
