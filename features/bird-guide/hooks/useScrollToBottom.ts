'use client';

import { useEffect, useRef } from 'react';

const NEAR_BOTTOM_PX = 120;

// Returns a ref for a sentinel element at the very end of the page content.
// When `deps` change, scrolls it into view — but only if the reader is still
// near the bottom (or `force` is set), so scrolling up mid-stream is respected.
export function useScrollToBottom<T extends HTMLElement>(
  deps: unknown[],
  enabled: boolean,
  force = false,
) {
  const ref = useRef<T>(null);
  const followRef = useRef(true);

  useEffect(() => {
    function onScroll() {
      const el = ref.current;
      if (!el) return;
      followRef.current = el.getBoundingClientRect().bottom - window.innerHeight < NEAR_BOTTOM_PX;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!enabled || !(force || followRef.current)) return;
    ref.current?.scrollIntoView({ block: 'end' });
    followRef.current = true;
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return ref;
}
