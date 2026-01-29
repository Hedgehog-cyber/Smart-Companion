import { BrainCircuit } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="text-center">
      <div className="flex items-center justify-center gap-3 mb-2">
        <BrainCircuit className="w-10 h-10 text-primary-foreground bg-primary p-1.5 rounded-lg" />
        <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight">
          Smart Companion
        </h1>
      </div>
      <p className="text-lg text-muted-foreground">
        Your neuro-inclusive executive function coach
      </p>
    </header>
  );
}
