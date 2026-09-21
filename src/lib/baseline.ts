import { supabase } from "@/lib/supabase";
import {
  getBaselineResponse,
  saveBaselineResponse,
  type BaselineResponse,
} from "@/lib/storage";

export interface BaselineSyncResult {
  savedTo: "supabase" | "local-storage";
  error?: string;
}

export interface BaselineLoadResult {
  baseline: BaselineResponse;
  source: "supabase" | "local-storage";
}

export interface BaselineHistoryEntry {
  responses: BaselineResponse;
  completedAt: string | null;
}

async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("Unable to read Supabase session", error);
    return null;
  }

  return session?.user?.id ?? null;
}

/**
 * The most recent baseline completion — one user now has many rows (every
 * retake keeps its own), so this is the "current" snapshot: used for the
 * onboarding gate, the dashboard reminder, and anywhere that only cares
 * about where things stand today rather than the full history.
 */
export async function loadBaselineForCurrentUser(): Promise<BaselineLoadResult> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return {
      baseline: getBaselineResponse(),
      source: "local-storage",
    };
  }

  const { data, error } = await supabase
    .from("baseline_responses")
    .select("responses, completed_at, reminder_day, reminder_time")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to load baseline from Supabase", error);
    return {
      baseline: getBaselineResponse(),
      source: "local-storage",
    };
  }

  if (data?.responses) {
    const baseline = data.responses as BaselineResponse;
    saveBaselineResponse(baseline);
    return {
      baseline,
      source: "supabase",
    };
  }

  return {
    baseline: getBaselineResponse(),
    source: "local-storage",
  };
}

/**
 * Whether the current user has ever completed the baseline quiz, per
 * Supabase — independent of the local `empwru:onboarding` flag AppGuard
 * normally checks. Used to recognise a returning user on a device that
 * never had that flag set (new device, cleared storage, etc.) instead of
 * routing them back into onboarding despite already having a baseline.
 */
export async function hasCompletedBaselineOnServer(): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) return false;

  const { data, error } = await supabase
    .from("baseline_responses")
    .select("completed_at")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to check baseline completion on Supabase", error);
    return false;
  }

  return data != null;
}

/**
 * Every baseline completion for the current user, oldest first — the very
 * first entry is "where you started"; the last is "where you are now".
 * Used by the progress page's start-vs-now comparison.
 */
export async function loadBaselineHistoryForCurrentUser(): Promise<BaselineHistoryEntry[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("baseline_responses")
    .select("responses, completed_at")
    .eq("user_id", userId)
    .order("completed_at", { ascending: true, nullsFirst: true });

  if (error) {
    console.error("Failed to load baseline history from Supabase", error);
    return [];
  }

  return (data ?? []).map((row) => ({
    responses: row.responses as BaselineResponse,
    completedAt: row.completed_at,
  }));
}

export async function saveBaselineToSupabase(
  response: Partial<BaselineResponse>,
  reminderDay?: string | null,
  reminderTime?: string | null
): Promise<BaselineSyncResult> {
  saveBaselineResponse(response);

  const userId = await getCurrentUserId();
  if (!userId) {
    return { savedTo: "local-storage" };
  }

  const payload = {
    user_id: userId,
    responses: {
      ...getBaselineResponse(),
      ...response,
      completedAt: response.completedAt ?? new Date().toISOString(),
    },
    completed_at: response.completedAt ?? new Date().toISOString(),
    reminder_day: reminderDay ?? null,
    reminder_time: reminderTime ?? null,
  };

  // A fresh row per completion (not an upsert) — every retake is its own
  // point in the user's history rather than overwriting the last one.
  const { error } = await supabase
    .from("baseline_responses")
    .insert(payload);

  if (error) {
    console.error("Failed to sync baseline to Supabase", error);
    return { savedTo: "local-storage", error: error.message };
  }

  return { savedTo: "supabase" };
}
