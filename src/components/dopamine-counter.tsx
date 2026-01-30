'use client';

import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DopamineCounterProps {
  count: number;
}

export function DopamineCounter({ count }: DopamineCounterProps) {
  const [showStreak, setShowStreak] = useState(false);
  const prevCountRef = useRef(count);

  useEffect(() => {
    // Only check for streak when the count increases
    if (count > prevCountRef.current) {
      if (count > 0 && count % 5 === 0) {
        setShowStreak(true);
        const streakTimer = setTimeout(() => setShowStreak(false), 2500); // Show for 2.5 seconds
        return () => {
          clearTimeout(streakTimer);
        };
      }
    }

    prevCountRef.current = count;
  }, [count]);

  return (
    <div className="relative flex justify-center my-6">
      <div
        className='text-lg font-bold text-center px-4 py-2 rounded-lg transition-all'
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
