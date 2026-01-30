"use client";

import { BrainCircuit, LogOut } from 'lucide-react';
import { useAuth, useUser, initiateSignOut } from '@/firebase';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppHeader() {
  const auth = useAuth();
  const { user } = useUser();

  const handleSignOut = async () => {
    if (auth) {
      initiateSignOut(auth);
    }
  };

  const userInitial = user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U";

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
        <div className="absolute top-0 right-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="overflow-hidden rounded-full">
                <Avatar>
                  <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User Avatar'} />
                  <AvatarFallback>{userInitial}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user.displayName || user.email}
                  </p>
                  {user.displayName && user.email && (
                     <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                     </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </header>
  );
}
