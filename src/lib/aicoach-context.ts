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
