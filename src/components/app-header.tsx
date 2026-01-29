"use client";

import { BrainCircuit, LogOut } from 'lucide-react';
import { useAuth, useUser, initiateSignOut } from '@/firebase';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export function AppHeader() {
  const auth = useAuth();
  const { user } = useUser();

  const handleSignOut = async () => {
    if (auth) {
      initiateSignOut(auth);
    }
  };

  const userInitial = user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <header className="w-full max-w-4xl text-center relative">
      <div className="flex items-center justify-center gap-3 mb-2">
        <BrainCircuit className="w-10 h-10 text-primary-foreground bg-primary p-1.5 rounded-lg" />
        <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight">
          Smart Companion
        </h1>
      </div>
      <p className="text-lg text-muted-foreground">
        Your neuro-inclusive executive function coach
      </p>

      {user && (
        <div className="absolute top-0 right-0 flex items-center gap-4">
           <div className="text-right">
             <p className="text-sm font-medium">{user.displayName || user.email}</p>
          </div>
          <Avatar>
            <AvatarImage src={user.photoURL || undefined} alt="User avatar" />
            <AvatarFallback>{userInitial}</AvatarFallback>
          </Avatar>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Sign out</span>
          </Button>
        </div>
      )}
    </header>
  );
}
