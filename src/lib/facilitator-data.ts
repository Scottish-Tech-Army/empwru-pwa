import type { createSupabaseServerClient } from "@/lib/supabase-server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { capitalizeWords, getDisplayNameFromEmail } from "@/lib/user-display";
import { isPendingInvite } from "@/lib/invite-status";

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export type EngagementStatus = "thriving" | "steady" | "needs-nudge" | "gone-quiet";

export interface RosterEntry {
  id: string;
  name: string;
  email: string;
  lastActiveAt: string | null;
  daysSinceActive: number | null;
  baselineCompleted: boolean;
  activeGoals: number;
  status: EngagementStatus;
  /** Checked in that week, oldest (5 weeks ago) to newest (this week). */
  weeklyStreak: boolean[];
}

export interface FacilitatorOverview {
  totalAlumni: number;
  activeThisWeek: number;
  weeklyCheckInRate: number;
  baselineCompletionRate: number;
  roster: RosterEntry[];
  needsEncouragement: RosterEntry[];
  dataWarnings: string[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS));
}

const STREAK_WEEKS = 6;

/** One bar per week, oldest first, true if any check-in landed in that week. */
function computeWeeklyStreak(checkinDates: string[]): boolean[] {
  const streak = Array<boolean>(STREAK_WEEKS).fill(false);
  for (const iso of checkinDates) {
    const days = daysSince(iso);
    if (days === null) continue;
    const weekIndex = STREAK_WEEKS - 1 - Math.floor(days / 7);
    if (weekIndex >= 0 && weekIndex < STREAK_WEEKS) {
      streak[weekIndex] = true;
    }
  }
  return streak;
}

function statusFor(days: number | null): EngagementStatus {
  if (days === null) return "gone-quiet";
  if (days <= 7) return "thriving";
  if (days <= 14) return "steady";
  if (days <= 21) return "needs-nudge";
  return "gone-quiet";
}

function nameFor(user: {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
}): string {
  const displayName =
    typeof user.user_metadata?.display_name === "string"
      ? (user.user_metadata.display_name as string)
      : undefined;
  const firstName = displayName?.trim().split(/\s+/)[0];
  return firstName ? capitalizeWords(firstName) : getDisplayNameFromEmail(user.email);
}

/**
 * Aggregates alumni engagement across every user for the facilitator
 * overview. `supabase` must be the caller's own RLS-scoped server client
 * (from createSupabaseServerClient) — the `user_roles`-aware policies on
 * goals/checkins/baseline_responses are what actually grant cross-user
 * reads to admins and facilitators, so this has no access control of its
 * own beyond whatever role the caller's session genuinely holds.
 *
 * The one exception is the alumni list itself: `auth.users` isn't a table
 * RLS policies can target from client queries, so that one read still goes
 * through the service-role admin client. Callers MUST still verify the
 * requester holds an admin/facilitator role (see src/lib/roles.ts) before
 * calling this, since listUsers() has no row-level access control at all.
 */
export async function getFacilitatorOverview(
  supabase: SupabaseServerClient
): Promise<FacilitatorOverview> {
  const admin = createSupabaseAdminClient();

  const { data: usersPage, error: usersError } = await admin.auth.admin.listUsers({
    perPage: 1000,
  });
  if (usersError) {
    throw new Error(`Failed to list users: ${usersError.message}`);
  }
  // Invitees who haven't accepted yet aren't alumni — they're listed on the
  // invite page instead, not here as "gone quiet".
  const users = usersPage.users.filter((user) => !isPendingInvite(user));

  const [
    { data: checkins, error: checkinsError },
    { data: baselineRows, error: baselineError },
    { data: goalRows, error: goalsError },
  ] = await Promise.all([
    supabase.from("checkins").select("user_id, created_at"),
    supabase.from("baseline_responses").select("user_id, completed_at"),
    supabase.from("goals").select("user_id, status"),
  ]);

  const dataWarnings: string[] = [];
  if (checkinsError) {
    console.error("facilitator overview: checkins query failed", checkinsError);
    dataWarnings.push("Check-in activity couldn't be loaded.");
  }
  if (baselineError) {
    console.error("facilitator overview: baseline query failed", baselineError);
    dataWarnings.push("Baseline completion couldn't be loaded.");
  }
  if (goalsError) {
    console.error("facilitator overview: goals query failed", goalsError);
    dataWarnings.push("Goal counts couldn't be loaded.");
  }

  const checkinDatesByUser = new Map<string, string[]>();
  for (const row of (checkins ?? []) as { user_id: string; created_at: string }[]) {
    const dates = checkinDatesByUser.get(row.user_id) ?? [];
    dates.push(row.created_at);
    checkinDatesByUser.set(row.user_id, dates);
  }

  const baselineDoneByUser = new Set<string>();
  for (const row of (baselineRows ?? []) as { user_id: string; completed_at: string | null }[]) {
    if (row.completed_at) baselineDoneByUser.add(row.user_id);
  }

  const activeGoalsByUser = new Map<string, number>();
  for (const row of (goalRows ?? []) as { user_id: string; status: string }[]) {
    if (row.status === "active") {
      activeGoalsByUser.set(row.user_id, (activeGoalsByUser.get(row.user_id) ?? 0) + 1);
    }
  }

  const roster: RosterEntry[] = users.map((user) => {
    const checkinDates = checkinDatesByUser.get(user.id) ?? [];
    const lastActiveAt = checkinDates.length
      ? checkinDates.reduce((latest, iso) => (new Date(iso) > new Date(latest) ? iso : latest))
      : null;
    const days = daysSince(lastActiveAt);
    return {
      id: user.id,
      name: nameFor(user),
      email: user.email ?? "",
      lastActiveAt,
      daysSinceActive: days,
      baselineCompleted: baselineDoneByUser.has(user.id),
      activeGoals: activeGoalsByUser.get(user.id) ?? 0,
      status: statusFor(days),
      weeklyStreak: computeWeeklyStreak(checkinDates),
    };
  });

  roster.sort((a, b) => {
    if (a.daysSinceActive === null && b.daysSinceActive === null) {
      return a.name.localeCompare(b.name);
    }
    if (a.daysSinceActive === null) return 1;
    if (b.daysSinceActive === null) return -1;
    return a.daysSinceActive - b.daysSinceActive;
  });

  const totalAlumni = users.length;
  const activeThisWeek = roster.filter(
    (r) => r.daysSinceActive !== null && r.daysSinceActive <= 7
  ).length;
  const baselineCompletionCount = roster.filter((r) => r.baselineCompleted).length;

  const needsEncouragement = roster
    .filter((r) => r.status === "needs-nudge" || r.status === "gone-quiet")
    .sort(
      (a, b) =>
        (b.daysSinceActive ?? Number.MAX_SAFE_INTEGER) -
        (a.daysSinceActive ?? Number.MAX_SAFE_INTEGER)
    )
    .slice(0, 8);

  return {
    totalAlumni,
    activeThisWeek,
    weeklyCheckInRate: totalAlumni ? Math.round((activeThisWeek / totalAlumni) * 100) : 0,
    baselineCompletionRate: totalAlumni
      ? Math.round((baselineCompletionCount / totalAlumni) * 100)
      : 0,
    roster,
    needsEncouragement,
    dataWarnings,
  };
}
