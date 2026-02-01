'use client';

import { useCallback, useEffect, useRef } from 'react';
import { playSuccessSound } from '@/lib/sounds';

/**
 * @deprecated This hook is deprecated. Use the `playSuccessSound` function from `@/lib/sounds` instead.
 */
export function useCompletionSound() {
  console.warn(
    'useCompletionSound is deprecated. Please use playSuccessSound from @/lib/sounds instead.'
  );
  
  const playSound = useCallback(() => {
    playSuccessSound();
  }, []);

  return playSound;
}
