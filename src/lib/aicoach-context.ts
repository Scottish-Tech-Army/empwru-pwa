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

// One combined daily budget for every AI Coach request — chatting, goal
// extraction, and discovery extraction all draw from the same pool, read
// from AICOACH_DAILY_LIMIT (defaults to 5 if unset or invalid), and are
// capped identically here: allowed as long as the combined total is under
// the limit, full stop. There's no server-side notion of "reserve the last
// request for extraction" — the daily usage row is just aggregate counts,
// with no concept of separate conversations, so it can't fairly decide that
// on its own (an earlier, unrelated conversation extracting today shouldn't
// silently strip a later conversation's chance to save itself).
//
// That reservation — "don't let this conversation burn its very last
// request on chat before it's had a chance to save itself" — is instead a
// client-side UX decision: the chat page already knows both numbers it
// needs (how many requests are left, from `remaining` below, and whether
// *this* conversation has extracted yet, from its own local state) and
// disables its own send button accordingly. The server just reports
// `remaining` and enforces the hard cap; it never needs to know why a
// request wasn't sent.
const DEFAULT_DAILY_LIMIT = 5;

function resolveDailyLimit(): number {
  const raw = Number(process.env.AICOACH_DAILY_LIMIT);
  return Number.isInteger(raw) && raw > 0 ? raw : DEFAULT_DAILY_LIMIT;
}

const DAILY_TOTAL_LIMIT = resolveDailyLimit();

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

interface DailyUsage {
  chatCount: number;
  goalExtractCount: number;
  discoveryExtractCount: number;
}

function totalUsage(usage: DailyUsage): number {
  return usage.chatCount + usage.goalExtractCount + usage.discoveryExtractCount;
}

async function readTodayUsage(supabase: SupabaseServerClient, userId: string): Promise<DailyUsage> {
  const { data, error } = await supabase
    .from("ai_coach_daily_usage")
    .select("chat_count, goal_extract_count, discovery_extract_count")
    .eq("user_id", userId)
    .eq("usage_date", todayDateString())
    .maybeSingle();

  if (error) {
    console.error("Failed to read AI Coach daily usage", error);
    return { chatCount: 0, goalExtractCount: 0, discoveryExtractCount: 0 };
  }

  return {
    chatCount: data?.chat_count ?? 0,
    goalExtractCount: data?.goal_extract_count ?? 0,
    discoveryExtractCount: data?.discovery_extract_count ?? 0,
  };
}

export type UsageStatus = { remaining: number; limitReached: boolean };

function statusFor(total: number): UsageStatus {
  return { remaining: Math.max(DAILY_TOTAL_LIMIT - total, 0), limitReached: total >= DAILY_TOTAL_LIMIT };
}

/**
 * Checks the combined daily budget and, if there's room, atomically claims
 * one slot. Returns allowed:false without writing anything once the limit
 * is already reached.
 */
export async function checkAndIncrementChatUsage(
  supabase: SupabaseServerClient,
  userId: string
): Promise<{ allowed: boolean } & UsageStatus> {
  const usage = await readTodayUsage(supabase, userId);
  const total = totalUsage(usage);

  if (total >= DAILY_TOTAL_LIMIT) {
    return { allowed: false, ...statusFor(total) };
  }

  const { error } = await supabase
    .from("ai_coach_daily_usage")
    .upsert(
      { user_id: userId, usage_date: todayDateString(), chat_count: usage.chatCount + 1 },
      { onConflict: "user_id,usage_date" }
    );

  if (error) {
    console.error("Failed to record AI Coach chat usage", error);
  }

  return { allowed: true, ...statusFor(total + 1) };
}

/**
 * Same combined daily budget as checkAndIncrementChatUsage — draws from the
 * same pool as checkAndIncrementDiscoveryExtractUsage, so using one eats
 * into what's left for the other.
 */
export async function checkAndIncrementGoalExtractUsage(
  supabase: SupabaseServerClient,
  userId: string
): Promise<{ allowed: boolean } & UsageStatus> {
  const usage = await readTodayUsage(supabase, userId);
  const total = totalUsage(usage);

  if (total >= DAILY_TOTAL_LIMIT) {
    return { allowed: false, ...statusFor(total) };
  }

  const { error } = await supabase
    .from("ai_coach_daily_usage")
    .upsert(
      { user_id: userId, usage_date: todayDateString(), goal_extract_count: usage.goalExtractCount + 1 },
      { onConflict: "user_id,usage_date" }
    );

  if (error) {
    console.error("Failed to record AI Coach goal-extraction usage", error);
  }

  return { allowed: true, ...statusFor(total + 1) };
}

/**
 * Same idea as checkAndIncrementGoalExtractUsage but for the "turn this into
 * discovery notes" action — see that function's doc comment.
 */
export async function checkAndIncrementDiscoveryExtractUsage(
  supabase: SupabaseServerClient,
  userId: string
): Promise<{ allowed: boolean } & UsageStatus> {
  const usage = await readTodayUsage(supabase, userId);
  const total = totalUsage(usage);

  if (total >= DAILY_TOTAL_LIMIT) {
    return { allowed: false, ...statusFor(total) };
  }

  const { error } = await supabase
    .from("ai_coach_daily_usage")
    .upsert(
      { user_id: userId, usage_date: todayDateString(), discovery_extract_count: usage.discoveryExtractCount + 1 },
      { onConflict: "user_id,usage_date" }
    );

  if (error) {
    console.error("Failed to record AI Coach discovery-extraction usage", error);
  }

  return { allowed: true, ...statusFor(total + 1) };
}

/**
 * Read-only look at today's usage — no writes, safe to call on every page
 * load so the UI can reflect an already-spent budget from the start instead
 * of only discovering it reactively after a rejected request.
 */
export async function getTodayAiCoachUsage(supabase: SupabaseServerClient, userId: string): Promise<UsageStatus> {
  const usage = await readTodayUsage(supabase, userId);
  return statusFor(totalUsage(usage));
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
  const qualities = discovery?.qualities ?? [];
  const values = discovery?.values ?? [];
  const interests = discovery?.interests ?? [];
  if (skills.length > 0) lines.push(`Identified strengths: ${skills.join(", ")}.`);
  if (qualities.length > 0) lines.push(`Personal qualities: ${qualities.join(", ")}.`);
  if (values.length > 0) lines.push(`Core values: ${values.join(", ")}.`);
  if (interests.length > 0) lines.push(`Interests: ${interests.join(", ")}.`);

  return lines.join("\n");
}
