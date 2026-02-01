'use client';

import { useCallback, useEffect, useRef } from 'react';
import { completionSoundDataUri } from '@/lib/sounds';

export function useCompletionSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize Audio only on the client side
    audioRef.current = new Audio(completionSoundDataUri);
    audioRef.current.preload = 'auto';
  }, []);

  const playSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0; // Rewind to the start
      audioRef.current.play().catch(error => {
        // Autoplay can be blocked by the browser, we'll log it but not bother the user.
        console.error('Audio play failed:', error);
      });
    }
  }, []);

  return playSound;
}
