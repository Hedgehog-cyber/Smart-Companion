"use client";

import { BrainCircuit, History, UserCog } from 'lucide-react';
import { Button } from './ui/button';
import Link from 'next/link';

export function AppHeader() {

  return (
    <header className="w-full max-w-4xl relative text-left">
      <div className="flex items-center justify-start gap-3 mb-2">
        <BrainCircuit className="w-10 h-10 text-primary-foreground bg-primary p-1.5 rounded-lg" />
        <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight">
          Smart Companion
        </h1>
      </div>
      <p className="text-lg text-muted-foreground">
        Your neuro-inclusive executive function coach
      </p>

      <div className="absolute top-0 right-0 flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/history">
                <History className="mr-2 h-4 w-4" />
                <span>History</span>
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/profile">
                <UserCog className="mr-2 h-4 w-4" />
                <span>Profile</span>
            </Link>
          </Button>
      </div>
    </header>
  );
}
