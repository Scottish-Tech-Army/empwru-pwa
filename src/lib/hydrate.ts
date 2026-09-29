import {
  loadGoalsFromSupabase,
  loadCheckInsFromSupabase,
  loadDiscoveryDataFromSupabase,
} from "@/lib/storage";
import { loadBaselineForCurrentUser } from "@/lib/baseline";

/**
 * Pulls every Supabase-backed data type for the current user and mirrors it
 * into localStorage in one pass. Each of these already re-fetches on its own
 * page's mount, but nothing previously refreshed baseline completion status
 * on the dashboard — so a baseline row deleted server-side kept reading as
 * "completed" there until localStorage was cleared by hand. Called once per
 * signed-in session from AppGuard, before the first authenticated route is
 * allowed to render, so whichever page the user lands on first already has
 * fresh data rather than racing its own mount-time fetch against this one.
 */
export async function hydrateFromSupabase(): Promise<void> {
  await Promise.all([
    loadGoalsFromSupabase(),
    loadCheckInsFromSupabase(),
    loadDiscoveryDataFromSupabase(),
    loadBaselineForCurrentUser(),
  ]);
}
