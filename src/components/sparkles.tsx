'use client';

import { useState, useEffect } from 'react';
import { Sparkle as SparkleIcon } from 'lucide-react';

const SPARKLE_COUNT = 20;

interface SparkleData {
  id: string;
  top: string;
  left: string;
  size: number;
  duration: number;
  delay: number;
}

function random(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function Sparkles() {
  const [sparkles, setSparkles] = useState<SparkleData[]>([]);

  useEffect(() => {
    const generateSparkles = () => {
      return Array.from({ length: SPARKLE_COUNT }).map((_, i) => ({
        id: `sparkle-${i}`,
        top: `${random(5, 95)}%`,
        left: `${random(5, 95)}%`,
        size: random(8, 20),
        duration: random(700, 1500),
        delay: random(0, 300),
      }));
    };
    setSparkles(generateSparkles());
  }, []);

  if (sparkles.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      {sparkles.map(({ id, top, left, size, duration, delay }) => (
        <SparkleIcon
          key={id}
          className="absolute text-yellow-400 animate-sparkle-fade"
          style={{
            top,
            left,
            width: size,
            height: size,
            animationDuration: `${duration}ms`,
            animationDelay: `${delay}ms`,
          }}
        />
      ))}
    </div>
  );
}
