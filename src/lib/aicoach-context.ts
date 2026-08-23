import type { createSupabaseServerClient } from "@/lib/supabase-server";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

/**
 * Dev-only escape hatch: set AI_COACH_MOCK=true in .env.local to skip every
 * Gemini call and return canned data instead, so UI work doesn't burn API
 * quota. Never set this in a deployed environment.
 */
export const AI_COACH_MOCK = process.env.AI_COACH_MOCK === "true";

export interface GoalRow {
  title: string;
  category: string;
  why_matters: string;
  steps: unknown;
}

export interface DiscoveryPayload {
  skills?: string[];
  qualities?: string[];
  values?: string[];
  interests?: string[];
}

/**
 * Pulls the authenticated user's own active goals + discovery data straight
 * from Supabase (not from anything the client sent) — the DB is the only
 * source of truth for what goes into the AI Coach's context.
 */
export async function fetchAiCoachContext(supabase: SupabaseServerClient, userId: string) {
  const [goalsResult, discoveryResult] = await Promise.all([
    supabase
      .from("goals")
      .select("title, category, why_matters, steps")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(5),
    supabase.from("discovery_data").select("payload").eq("user_id", userId).maybeSingle(),
  ]);

  const goals = (goalsResult.data ?? []) as GoalRow[];
  const discovery = (discoveryResult.data?.payload as DiscoveryPayload | undefined) ?? null;

  return { goals, discovery };
}

// Daily budget: 5 total AI Coach requests/day — 4 regular chat turns, with
// the 5th slot reserved specifically for turning the conversation into a
// goal, so a user can never chat their way through the whole budget and be
// left with no way to save what they talked about.
const DAILY_CHAT_LIMIT = 4;
const DAILY_GOAL_EXTRACT_LIMIT = 1;

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

async function readTodayUsage(
  supabase: SupabaseServerClient,
  userId: string
): Promise<{ chatCount: number; goalExtractCount: number }> {
  const { data, error } = await supabase
    .from("ai_coach_daily_usage")
    .select("chat_count, goal_extract_count")
    .eq("user_id", userId)
    .eq("usage_date", todayDateString())
    .maybeSingle();

  if (error) {
    console.error("Failed to read AI Coach daily usage", error);
    return { chatCount: 0, goalExtractCount: 0 };
  }

  return {
    chatCount: data?.chat_count ?? 0,
    goalExtractCount: data?.goal_extract_count ?? 0,
  };
}

/**
 * Checks the user's regular-chat budget for today and, if there's room,
 * atomically claims one slot. Returns allowed:false without writing
 * anything once the limit is already reached.
 */
export async function checkAndIncrementChatUsage(
  supabase: SupabaseServerClient,
  userId: string
): Promise<{ allowed: boolean; chatCount: number; limit: number }> {
  const { chatCount } = await readTodayUsage(supabase, userId);

  if (chatCount >= DAILY_CHAT_LIMIT) {
    return { allowed: false, chatCount, limit: DAILY_CHAT_LIMIT };
  }

  const nextCount = chatCount + 1;
  const { error } = await supabase
    .from("ai_coach_daily_usage")
    .upsert(
      { user_id: userId, usage_date: todayDateString(), chat_count: nextCount },
      { onConflict: "user_id,usage_date" }
    );

  if (error) {
    console.error("Failed to record AI Coach chat usage", error);
  }

  return { allowed: true, chatCount: nextCount, limit: DAILY_CHAT_LIMIT };
}

/**
 * Same idea as checkAndIncrementChatUsage but for the reserved
 * "turn this into a goal" slot — capped separately so it survives even if
 * the user has used up all their regular chat turns for the day.
 */
export async function checkAndIncrementGoalExtractUsage(
  supabase: SupabaseServerClient,
  userId: string
): Promise<{ allowed: boolean }> {
  const { goalExtractCount } = await readTodayUsage(supabase, userId);

  if (goalExtractCount >= DAILY_GOAL_EXTRACT_LIMIT) {
    return { allowed: false };
  }

  const { error } = await supabase
    .from("ai_coach_daily_usage")
    .upsert(
      {
        user_id: userId,
        usage_date: todayDateString(),
        goal_extract_count: goalExtractCount + 1,
      },
      { onConflict: "user_id,usage_date" }
    );

  if (error) {
    console.error("Failed to record AI Coach goal-extraction usage", error);
  }

  return { allowed: true };
}

/**
 * Read-only look at today's usage — no writes, safe to call on every page
 * load so the UI can reflect an already-spent slot from the start instead
 * of only discovering it reactively after a rejected request.
 */
export async function getTodayAiCoachUsage(
  supabase: SupabaseServerClient,
  userId: string
): Promise<{ chatLimitReached: boolean; goalExtractLimitReached: boolean }> {
  const { chatCount, goalExtractCount } = await readTodayUsage(supabase, userId);
  return {
    chatLimitReached: chatCount >= DAILY_CHAT_LIMIT,
    goalExtractLimitReached: goalExtractCount >= DAILY_GOAL_EXTRACT_LIMIT,
  };
}

export function hasAiCoachContext(goals: GoalRow[], discovery: DiscoveryPayload | null): boolean {
  return (
    goals.length > 0 ||
    Boolean(
      discovery?.skills?.length ||
        discovery?.qualities?.length ||
        discovery?.values?.length ||
        discovery?.interests?.length
    )
  );
}

export function buildContextBlock(goals: GoalRow[], discovery: DiscoveryPayload | null): string {
  const lines: string[] = [
    "## About this user (background only — don't recite this list back verbatim)",
  ];

  if (goals.length === 0) {
    lines.push("This user hasn't set any active goals yet.");
  } else {
    lines.push("Active goals:");
    for (const goal of goals) {
      const steps = Array.isArray(goal.steps) ? goal.steps : [];
      const completed = steps.filter(
        (s): s is { completed: boolean } =>
          typeof s === "object" && s !== null && "completed" in s && Boolean((s as { completed: boolean }).completed)
      ).length;
      const progress = steps.length > 0 ? Math.round((completed / steps.length) * 100) : 0;
      lines.push(
        `- "${goal.title}" (${goal.category}) — ${progress}% of steps complete. Why it matters to them: ${goal.why_matters}`
      );
    }
  }

  const skills = discovery?.skills ?? [];
  const values = discovery?.values ?? [];
  if (skills.length > 0) lines.push(`Identified strengths: ${skills.join(", ")}.`);
  if (values.length > 0) lines.push(`Core values: ${values.join(", ")}.`);

  return lines.join("\n");
}
