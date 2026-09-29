"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { isOnboardingCompleted, primeStorageUserScope, saveOnboardingState } from "@/lib/storage";
import { hasCompletedBaselineOnServer } from "@/lib/baseline";
import { hydrateFromSupabase } from "@/lib/hydrate";

// Reachable with no session — the pre-auth marketing/signup chain.
const PUBLIC_ROUTES = ["/welcome", "/onboarding/carousel", "/signIn", "/signUp"];

// Reachable once signed in but before onboarding is complete — the
// post-auth onboarding chain itself. No legitimate reason to revisit these
// once onboarding is done, so they bounce to "/" at that point.
const ONBOARDING_ROUTES = ["/onboarding/welcome", "/onboarding/reminder"];

// Signed-in-only, but reachable both before onboarding completes (the
// initial baseline quiz) and after (it doubles as the "review where you
// started" / retake-baseline screen, linked from the progress page and the
// dashboard's 6-week reminder) — never gated on onboarding-completed state.
const ALWAYS_AUTH_ROUTES = ["/onboarding/baseline"];

// Manages its own data lifecycle (clears localStorage, signs out) — must
// never be redirected away from before it's had a chance to run.
const BYPASS_ROUTES = ["/reset"];

function matches(pathname: string, routes: string[]): boolean {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

/**
 * Single place that decides, for every route in the app, whether the
 * visitor belongs on: the pre-auth marketing/signup pages, the post-auth
 * onboarding chain, or the main app. Replaces the ad-hoc
 * `supabase.auth.getSession()` + `router.replace("/signIn")` checks that
 * used to live in individual pages.
 */
export default function AppGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  // The pathname this guard has most recently cleared for rendering — kept
  // (rather than a plain boolean) so a slow check for a *new* pathname
  // can't render stale content by inheriting the previous pathname's "ready".
  const [readyFor, setReadyFor] = useState<string | null>(null);
  // Which signed-in user's data has already been pulled from Supabase this
  // session, so a route change doesn't re-trigger it — only a fresh sign-in
  // (a different or newly-present user id) does.
  const hydratedUserId = useRef<string | null>(null);

  useEffect(() => {
    let active = true;

    async function evaluate() {
      if (matches(pathname, BYPASS_ROUTES)) {
        if (active) setReadyFor(pathname);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;

      primeStorageUserScope(session?.user?.id ?? null);

      if (!session) {
        hydratedUserId.current = null;
        if (!matches(pathname, PUBLIC_ROUTES)) {
          router.replace("/welcome");
          return;
        }
        setReadyFor(pathname);
        return;
      }

      if (hydratedUserId.current !== session.user.id) {
        await hydrateFromSupabase();
        if (!active) return;

        // Reconcile the local "onboarding completed" flag against the server
        // once per session. It's sticky by design — set once when the wizard
        // finishes on this device and otherwise trusted, so routing doesn't
        // need a server round trip on every navigation — but that means it
        // can go stale in *either* direction: blank for a returning user on
        // a new device (handled below, same as before), or stuck `true` for
        // a user whose baseline was since deleted server-side, who would
        // otherwise never be routed back into onboarding at all. Checking
        // once per sign-in catches both without paying for a check on every
        // route change.
        const completedOnServer = await hasCompletedBaselineOnServer();
        if (!active) return;
        saveOnboardingState({ completed: completedOnServer });

        hydratedUserId.current = session.user.id;
      }

      if (matches(pathname, ALWAYS_AUTH_ROUTES)) {
        setReadyFor(pathname);
        return;
      }

      if (!isOnboardingCompleted()) {
        if (!matches(pathname, ONBOARDING_ROUTES)) {
          router.replace("/onboarding/welcome");
          return;
        }
        setReadyFor(pathname);
        return;
      }

      if (matches(pathname, PUBLIC_ROUTES) || matches(pathname, ONBOARDING_ROUTES)) {
        router.replace("/");
        return;
      }

      setReadyFor(pathname);
    }

    void evaluate();

    return () => {
      active = false;
    };
  }, [pathname, router]);

  if (readyFor !== pathname) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-brand-surface">
        <div className="animate-pulse text-text-subtle">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}
