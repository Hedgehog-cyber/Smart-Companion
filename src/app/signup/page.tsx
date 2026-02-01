"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

// This page is no longer needed in the local-first version of the app.
// It will redirect to the main page.
export default function SignupPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
}
