import { Skeleton } from "@/components/ui/skeleton";
import { AppHeader } from "@/components/app-header";

export function PageSkeleton() {
  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-background text-foreground p-4 pt-12 md:pt-20">
      <AppHeader />
      <div className="w-full max-w-2xl mt-8 space-y-4">
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </div>
  );
}
