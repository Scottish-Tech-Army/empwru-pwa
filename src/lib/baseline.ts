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
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("baseline_responses")
    .upsert(payload, { onConflict: "user_id" });

  if (error) {
    console.error("Failed to sync baseline to Supabase", error);
    return { savedTo: "local-storage", error: error.message };
  }

  return { savedTo: "supabase" };
}
