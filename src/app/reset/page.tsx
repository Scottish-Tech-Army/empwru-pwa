"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { resetAllData } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import { RefreshCw } from "lucide-react";

/**
 * Development route to reset all app data
 * Navigate to /reset to clear localStorage and restart onboarding
 */
export default function ResetPage() {
  const router = useRouter();

  useEffect(() => {
    async function reset() {
      // Clear all localStorage data
      resetAllData();

      // Sign out too — otherwise a still-valid cached session (e.g. the
      // user row was deleted directly in the DB rather than through the
      // app) leaves the auth guard thinking you're still signed in, and
      // it sends you into onboarding instead of the actual fresh start.
      await supabase.auth.signOut();

      router.replace("/welcome");
    }

    setTimeout(() => {
      void reset();
    }, 500);
  }, [router]);

  return (
    <div className="min-h-dvh flex items-center justify-center bg-brand-surface">
      <div className="text-center">
        <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <RefreshCw className="w-8 h-8 text-brand-primary animate-spin" />
        </div>
        <h1 className="text-xl text-gray-900 mb-2">Resetting app data...</h1>
        <p className="text-gray-500">Redirecting to onboarding</p>
      </div>
    </div>
  );
}

