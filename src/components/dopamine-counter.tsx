'use client';

import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DopamineCounterProps {
  count: number;
}

export function DopamineCounter({ count }: DopamineCounterProps) {
  const [showStreak, setShowStreak] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevCountRef = useRef(count);

  useEffect(() => {
    // Only animate and check for streak when the count increases
    if (count > prevCountRef.current) {
      setIsAnimating(true);
      const animationTimer = setTimeout(() => setIsAnimating(false), 500); // Must match animation duration

      if (count > 0 && count % 5 === 0) {
        setShowStreak(true);
        const streakTimer = setTimeout(() => setShowStreak(false), 2500); // Show for 2.5 seconds
        return () => {
          clearTimeout(animationTimer);
          clearTimeout(streakTimer);
        };
      }
      
      return () => clearTimeout(animationTimer);
    }

    prevCountRef.current = count;
  }, [count]);

  return (
    <div className="relative flex justify-center my-6">
      <div
        className={cn(
          'text-lg font-bold text-center px-4 py-2 rounded-lg transition-all',
          isAnimating && 'animate-pop-flash'
        )}
      >
        Total Micro-Wins: {count}
      </div>
      {showStreak && (
        <Badge
          variant="secondary"
          className="absolute -top-7 animate-fade-in bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:text-green-200 dark:border-green-700"
        >
          Streak Restored!
        </Badge>
      )}
    </div>
  );
}
