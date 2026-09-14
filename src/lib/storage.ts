/**
 * localStorage helpers for EmpwrU PWA
 *
 * All keys are prefixed with 'empwru:' to avoid collisions.
 * Data is stored as JSON.
 */

import { supabase } from "@/lib/supabase";

const STORAGE_PREFIX = "empwru:";

// Storage keys
export const STORAGE_KEYS = {
  ONBOARDING: `${STORAGE_PREFIX}onboarding`,
  BASELINE: `${STORAGE_PREFIX}baseline`,
  CATEGORY: `${STORAGE_PREFIX}category`,
  GOALS: `${STORAGE_PREFIX}goals`,
  CHECKINS: `${STORAGE_PREFIX}checkins`,
  CHECKIN_REMINDER_DISMISSED: `${STORAGE_PREFIX}checkin_reminder_dismissed`,
  CHECKIN_REMINDER_INTRO_SEEN: `${STORAGE_PREFIX}checkin_reminder_intro_seen`,
  BASELINE_REMINDER_DISMISSED: `${STORAGE_PREFIX}baseline_reminder_dismissed`,
  BASELINE_REMINDER_INTRO_SEEN: `${STORAGE_PREFIX}baseline_reminder_intro_seen`,
  PREFERENCES: `${STORAGE_PREFIX}preferences`,
  DAILY_QUOTE: "empwru_daily_quote", // Standardized name
  DISCOVERY: `${STORAGE_PREFIX}discovery`,
  AICOACH_WELCOME_SEEN: `${STORAGE_PREFIX}aicoach_welcome_seen`,
} as const;

// Onboarding state
export interface OnboardingState {
  currentStep: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  completed: boolean;
  reminderTime?: "morning" | "evening";
  reminderDate?: string; // ISO date string - one week from setup
}

const DEFAULT_ONBOARDING: OnboardingState = {
  currentStep: 1,
  completed: false,
};

/**
 * Check if code is running in browser (not SSR)
 */
function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function notifyGoalDataChanged(): void {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event("empwru-goals-updated"));
}

// =============================================================================
// Per-user storage scoping
//
// Every key above used to be a single browser-wide key, so switching
// accounts in the same browser (or testing multiple signups) leaked one
// user's local data — onboarding state, dismissed reminders, etc. — into
// the next. Reads/writes are now scoped to whichever user is currently
// signed in (`<key>::<userId>`), tracked here via a small in-memory cache
// kept in sync by Supabase's auth listener (reads stay synchronous
// everywhere else in this file, per the module's existing contract).
//
// Data written before an account exists (pre-signup onboarding) still goes
// to the bare, unscoped key as a "guest bucket". The first time a *new*
// user id signs in in this browser, that guest bucket is claimed into
// their scoped keys and cleared — one-time, and only for keys that could
// legitimately hold pre-signup data. Keys that only ever get written after
// auth (e.g. the check-in reminder dismissal) are deliberately excluded so
// they can never leak from one account into the next.
// =============================================================================

const SCOPE_SEPARATOR = "::";
const CURRENT_USER_ID_KEY = `${STORAGE_PREFIX}__current_user_id`;

const NON_CLAIMABLE_KEYS: string[] = [
  STORAGE_KEYS.CHECKIN_REMINDER_DISMISSED,
  STORAGE_KEYS.CHECKIN_REMINDER_INTRO_SEEN,
  STORAGE_KEYS.BASELINE_REMINDER_DISMISSED,
  STORAGE_KEYS.BASELINE_REMINDER_INTRO_SEEN,
  STORAGE_KEYS.DAILY_QUOTE,
];

let currentUserId: string | null = isBrowser()
  ? localStorage.getItem(CURRENT_USER_ID_KEY)
  : null;

function scopedKey(key: string): string {
  return currentUserId ? `${key}${SCOPE_SEPARATOR}${currentUserId}` : key;
}

function claimGuestDataForUser(userId: string): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    if (NON_CLAIMABLE_KEYS.includes(key)) return;

    const scoped = `${key}${SCOPE_SEPARATOR}${userId}`;
    if (localStorage.getItem(scoped) !== null) return; // this account already has its own data

    const guestValue = localStorage.getItem(key);
    if (guestValue === null) return;

    localStorage.setItem(scoped, guestValue);
    localStorage.removeItem(key);
  });
}

/**
 * Refresh the cached current-user id and react to it changing. Called both
 * reactively (Supabase's auth listener, below) and directly by
 * `getCurrentUserId()` — the listener alone isn't guaranteed to have fired
 * yet the first time a page reads/writes scoped data right after sign-in
 * (e.g. the dashboard's very first load, whose data calls already resolve
 * the real session before anything scoped is read), so callers that already
 * know the authoritative session id feed it back in here directly instead
 * of waiting on the listener.
 */
function updateCurrentUserId(nextUserId: string | null): void {
  if (nextUserId === currentUserId) return;

  if (nextUserId) {
    claimGuestDataForUser(nextUserId);
  }

  currentUserId = nextUserId;

  if (nextUserId) {
    localStorage.setItem(CURRENT_USER_ID_KEY, nextUserId);
  } else {
    localStorage.removeItem(CURRENT_USER_ID_KEY);
  }
}

if (isBrowser()) {
  supabase.auth.onAuthStateChange((_event, session) => {
    updateCurrentUserId(session?.user?.id ?? null);
  });
}

/**
 * Prime per-user storage scoping from a session already resolved elsewhere
 * (the top-level auth/onboarding guard), so a scoped read like
 * `isOnboardingCompleted()` reflects the right account immediately instead
 * of waiting on the `onAuthStateChange` listener to catch up — the same
 * race `getCurrentUserId()` above guards against for this module's own
 * calls.
 */
export function primeStorageUserScope(userId: string | null): void {
  updateCurrentUserId(userId);
}

/**
 * Whether `key` is still within its "first day seen" grace period for the
 * current user — the calendar day it was first checked, recorded once and
 * never overwritten again.
 *
 * Used to suppress a reminder popup the first time it would ever be shown,
 * without a plain boolean "seen" flag: the dashboard evaluates these
 * reminders more than once on a fresh load (mount + the `focus`/
 * `visibilitychange` listeners re-running shortly after), and a flag that
 * flips itself true on the very first check would suppress on that first
 * call but then show the real popup on the second one moments later. A
 * day-marker gives the same answer regardless of how many times it's
 * checked that day, since only the write is one-time — the read is a pure
 * comparison against a value that doesn't change out from under it.
 */
function isWithinFirstSeenDay(key: string): boolean {
  if (!isBrowser()) return false;

  const storageKey = scopedKey(key);
  const today = new Date().toDateString();
  const firstSeenDay = localStorage.getItem(storageKey);

  if (!firstSeenDay) {
    localStorage.setItem(storageKey, today);
    return true;
  }

  return firstSeenDay === today;
}

/**
 * Get onboarding state from localStorage
 */
export function getOnboardingState(): OnboardingState {
  if (!isBrowser()) return DEFAULT_ONBOARDING;

  try {
    const stored = localStorage.getItem(scopedKey(STORAGE_KEYS.ONBOARDING));
    if (!stored) return DEFAULT_ONBOARDING;
    return JSON.parse(stored) as OnboardingState;
  } catch {
    return DEFAULT_ONBOARDING;
  }
}

/**
 * Save onboarding state to localStorage
 */
export function saveOnboardingState(state: Partial<OnboardingState>): void {
  if (!isBrowser()) return;

  const current = getOnboardingState();
  const updated = { ...current, ...state };
  localStorage.setItem(scopedKey(STORAGE_KEYS.ONBOARDING), JSON.stringify(updated));
}

/**
 * Check if onboarding is completed
 */
export function isOnboardingCompleted(): boolean {
  return getOnboardingState().completed;
}

/**
 * Mark onboarding as completed
 */
export function completeOnboarding(): void {
  saveOnboardingState({ completed: true });
}

/**
 * Check if the AI Coach welcome intro has already been shown
 */
export function hasSeenAiCoachWelcome(): boolean {
  if (!isBrowser()) return false;
  return localStorage.getItem(scopedKey(STORAGE_KEYS.AICOACH_WELCOME_SEEN)) === "true";
}

/**
 * Mark the AI Coach welcome intro as shown, so it doesn't reappear
 */
export function markAiCoachWelcomeSeen(): void {
  if (!isBrowser()) return;
  localStorage.setItem(scopedKey(STORAGE_KEYS.AICOACH_WELCOME_SEEN), "true");
}

/**
 * Reset all app data (for testing/debugging)
 */
export function resetAllData(): void {
  if (!isBrowser()) return;

  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
    localStorage.removeItem(scopedKey(key));
  });
}

// =============================================================================
// Baseline Quiz Responses
// =============================================================================

export type WorkStatus =
  | "unemployed"
  | "employed"
  | "self-employed"
  | "studying"
  | "other";

export type SkillsCurrentStatus =
  | "I’m actively learning or upskilling"
  | "I’ve done learning in the past but not recently"
  | "I want to learn but don’t know where to start"
  | "Learning or upskilling isn’t a focus for me right now";

export interface BaselineResponse {
  // Section 1: Current Situation
  workStatus?: WorkStatus;
  situationSatisfaction?: number; // 1-5

  // Section 2: Wellbeing
  energyLevel?: number; // 1-5
  stressLevel?: number; // 1-5 (inverted: 1=high stress, 5=low stress)
  lifeBalance?: number; // 1-5
  hasBalance?: "yes" | "no" | "unsure"; // Legacy field

  // Section 3: Skills, Education & Learning
  skillsConfidence?: number; // 1-5
  skillsCurrentStatus?: SkillsCurrentStatus

  // Section 4: Confidence
  confidence?: number; // 1-5

  // Section 5: Aspirations
  futureClarity?: number; // 1-5
  futureHope?: number; // 1-5

  // Section 6: Skills & Learning
  buildingSkills?: "yes" | "no";
  learningMotivation?: number; // 1-5

  // Metadata
  completedAt?: string; // ISO date string
}

const DEFAULT_BASELINE: BaselineResponse = {};

/**
 * Get baseline responses from localStorage
 */
export function getBaselineResponse(): BaselineResponse {
  if (!isBrowser()) return DEFAULT_BASELINE;

  try {
    const stored = localStorage.getItem(scopedKey(STORAGE_KEYS.BASELINE));
    if (!stored) return DEFAULT_BASELINE;
    return JSON.parse(stored) as BaselineResponse;
  } catch {
    return DEFAULT_BASELINE;
  }
}

/**
 * Save baseline responses to localStorage
 */
export function saveBaselineResponse(response: Partial<BaselineResponse>): void {
  if (!isBrowser()) return;

  const current = getBaselineResponse();
  const updated = { ...current, ...response };
  localStorage.setItem(scopedKey(STORAGE_KEYS.BASELINE), JSON.stringify(updated));
}

/**
 * Mark baseline as completed with timestamp
 */
export function completeBaseline(): void {
  saveBaselineResponse({ completedAt: new Date().toISOString() });
}

export const BASELINE_REMINDER_INTERVAL_DAYS = 42; // 6 weeks

/**
 * Days elapsed since the baseline quiz was last completed, or null if it's
 * never been completed.
 */
export function getDaysSinceBaselineCompleted(): number | null {
  const { completedAt } = getBaselineResponse();
  if (!completedAt) return null;

  const diffMs = Date.now() - new Date(completedAt).getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Which 6-week period we're currently in relative to the last baseline
 * completion (0 = the 6 weeks right after completing it, not yet due).
 */
function getBaselineReminderPeriod(daysSinceCompleted: number): number {
  return Math.floor(daysSinceCompleted / BASELINE_REMINDER_INTERVAL_DAYS);
}

/**
 * Whether the "retake your baseline quiz" reminder popup should be shown:
 * due every 6 weeks since it was last completed, and not already dismissed
 * for this specific 6-week period (re-prompts once the next period starts).
 *
 * Like the weekly check-in reminder, the first calendar day this would ever
 * become due for a given user is skipped entirely, so a brand-new account
 * isn't hit with another popup on top of everything else from onboarding.
 */
export function shouldShowBaselineReminder(): boolean {
  if (!isBrowser()) return false;

  const daysSinceCompleted = getDaysSinceBaselineCompleted();
  if (daysSinceCompleted === null) return false;

  const currentPeriod = getBaselineReminderPeriod(daysSinceCompleted);
  if (currentPeriod < 1) return false;

  if (isWithinFirstSeenDay(STORAGE_KEYS.BASELINE_REMINDER_INTRO_SEEN)) return false;

  const dismissedPeriod = localStorage.getItem(scopedKey(STORAGE_KEYS.BASELINE_REMINDER_DISMISSED));
  return dismissedPeriod !== String(currentPeriod);
}

/**
 * Dismiss the baseline reminder popup for the current 6-week period only —
 * it reappears once the next period starts and a retake is still due.
 */
export function dismissBaselineReminder(): void {
  if (!isBrowser()) return;

  const daysSinceCompleted = getDaysSinceBaselineCompleted();
  if (daysSinceCompleted === null) return;

  const currentPeriod = getBaselineReminderPeriod(daysSinceCompleted);
  localStorage.setItem(scopedKey(STORAGE_KEYS.BASELINE_REMINDER_DISMISSED), String(currentPeriod));
}

// =============================================================================
// Goals
// =============================================================================

export type GoalCategory = "Wellbeing" | "Career" | "Finance" | "Skills, Education & Learning" | "Relationships" | "other";

export interface Action {
  id: string;
  title: string;
  completed: boolean;
}

export interface Step {
  id: string;
  title: string;
  targetDate?: string; // ISO date
  completed: boolean;
}

/** Legacy support */
export type Milestone = Step;

export interface Goal {
  id: string;
  title: string;
  category: GoalCategory;

  // SMART Framework fields
  whyMatters: string;        // Relevant - why this goal matters
  successCriteria?: string;  // Measurable - how they'll know they achieved it
  confidence?: number;       // Achievable - 1-5 confidence rating
  targetDate?: string;       // Time-bound - ISO date

  // Legacy fields (kept for backwards compatibility)
  feelWhenDone: string;
  holdingBack?: string;

  // Timeline
  createdAt: string; // ISO date

  // Progress
  status: "active" | "completed" | "paused";
  steps: Step[];
  milestones?: Step[]; // Keep for data migration/compatibility
  actions: Action[];
}

/**
 * Generate a unique ID for goals/steps
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function getCurrentUserId(): Promise<string | null> {
  if (!isBrowser()) return null;

  try {
    // getSession() reads the already-cached client-side session and simply
    // returns null when logged out. auth.getUser() forces a server
    // revalidation instead, and throws AuthSessionMissingError when there's
    // no session — noisy for callers like this one that just want to know
    // "is anyone signed in right now" for local/Supabase sync bookkeeping.
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Unable to read Supabase session", sessionError);
      return null;
    }

    const userId = session?.user?.id ?? null;
    updateCurrentUserId(userId);
    return userId;
  } catch (error) {
    console.error("Unable to resolve Supabase user", error);
    return null;
  }
}

function mapGoalFromSupabase(row: Record<string, unknown>): Goal {
  return {
    id: String(row.id ?? ""),
    title: String(row.title ?? ""),
    category: (row.category as GoalCategory) ?? "other",
    whyMatters: String(row.why_matters ?? ""),
    successCriteria: row.success_criteria ? String(row.success_criteria) : undefined,
    confidence: row.confidence !== null && row.confidence !== undefined ? Number(row.confidence) : undefined,
    targetDate: row.target_date ? String(row.target_date) : undefined,
    feelWhenDone: String(row.feel_when_done ?? ""),
    holdingBack: row.holding_back ? String(row.holding_back) : undefined,
    createdAt: String(row.created_at ?? new Date().toISOString()),
    status: (row.status as Goal["status"]) ?? "active",
    steps: Array.isArray(row.steps) ? (row.steps as Step[]) : [],
    milestones: Array.isArray(row.steps) ? (row.steps as Step[]) : [],
    actions: Array.isArray(row.actions) ? (row.actions as Action[]) : [],
  };
}

function mapGoalForSupabase(goal: Goal, userId: string) {
  return {
    id: goal.id,
    user_id: userId,
    title: goal.title,
    category: goal.category,
    why_matters: goal.whyMatters,
    success_criteria: goal.successCriteria ?? null,
    confidence: goal.confidence ?? null,
    target_date: goal.targetDate ?? null,
    feel_when_done: goal.feelWhenDone ?? "",
    holding_back: goal.holdingBack ?? null,
    created_at: goal.createdAt,
    updated_at: new Date().toISOString(),
    status: goal.status,
    steps: goal.steps ?? [],
    actions: goal.actions ?? [],
  };
}

export async function syncGoalToSupabase(goal: Goal): Promise<void> {
  if (!isBrowser()) return;

  const userId = await getCurrentUserId();
  if (!userId) return;

  const { error } = await supabase
    .from("goals")
    .upsert(mapGoalForSupabase(goal, userId), { onConflict: "id" });

  if (error) {
    console.error("Failed to sync goal to Supabase", error);
  }
}

export async function loadGoalsFromSupabase(): Promise<Goal[]> {
  if (!isBrowser()) return [];

  const userId = await getCurrentUserId();
  if (!userId) {
    console.debug("loadGoalsFromSupabase: no userId available");
    return [];
  }

  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to load goals from Supabase", error);
    return [];
  }

  const remoteGoals = (data ?? []).map((row) => mapGoalFromSupabase(row as Record<string, unknown>));
  console.debug("loadGoalsFromSupabase: userId=", userId, "rows=", (data ?? []).length, "mapped=", remoteGoals.length);

  // Always mirror the remote result locally, including empty results —
  // otherwise a deleted-down-to-zero goal list leaves a stale cached goal behind.
  saveGoals(remoteGoals);
  return remoteGoals;
}

export async function loadGoalByIdFromSupabase(id: string): Promise<Goal | null> {
  if (!isBrowser()) return null;

  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load goal from Supabase", error);
    return null;
  }

  if (!data) {
    return null;
  }

  const remoteGoal = mapGoalFromSupabase(data as Record<string, unknown>);
  saveGoals([remoteGoal]);
  return remoteGoal;
}

/**
 * Get all goals from localStorage and ensure consistency
 */
export function getGoals(): Goal[] {
  if (!isBrowser()) return [];

  try {
    const stored = localStorage.getItem(scopedKey(STORAGE_KEYS.GOALS));
    if (!stored) return [];
    const rawGoals = JSON.parse(stored) as Goal[];

    // Data Migration: Ensure 'steps' property exists
    return rawGoals.map(g => {
      if (!g.steps && g.milestones) {
        g.steps = g.milestones;
      } else if (!g.steps) {
        g.steps = [];
      }
      return g as Goal;
    });
  } catch {
    return [];
  }
}

/**
 * Get a single goal by ID
 */
export function getGoalById(id: string): Goal | null {
  const goals = getGoals();
  return goals.find((g) => g.id === id) || null;
}

/**
 * Save all goals to localStorage
 */
function saveGoals(goals: Goal[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(scopedKey(STORAGE_KEYS.GOALS), JSON.stringify(goals));
  notifyGoalDataChanged();
}

/**
 * Create a new goal
 */
export function createGoal(
  goalData: Omit<Goal, "id" | "createdAt" | "status" | "steps"> & { steps?: Step[] }
): Goal {
  const newGoal: Goal = {
    ...goalData,
    steps: goalData.steps || [],
    id: generateId(),
    createdAt: new Date().toISOString(),
    status: "active",
    actions: goalData.actions || [],
    feelWhenDone: goalData.feelWhenDone || "",
  } as Goal;

  const goals = getGoals();
  goals.push(newGoal);
  saveGoals(goals);
  void syncGoalToSupabase(newGoal);

  return newGoal;
}

/**
 * Update an existing goal
 */
export function updateGoal(id: string, updates: Partial<Goal>): Goal | null {
  const goals = getGoals();
  const index = goals.findIndex((g) => g.id === id);

  if (index === -1) return null;

  goals[index] = { ...goals[index], ...updates };
  saveGoals(goals);
  void syncGoalToSupabase(goals[index]);

  return goals[index];
}

/**
 * Delete a goal. Removes it locally immediately, then awaits the remote
 * delete so callers can navigate only once Supabase is consistent —
 * otherwise a subsequent loadGoalsFromSupabase() can re-fetch the
 * not-yet-deleted row and resurrect it into localStorage.
 */
export async function deleteGoal(id: string): Promise<boolean> {
  const goals = getGoals();
  const filtered = goals.filter((g) => g.id !== id);

  if (filtered.length === goals.length) return false;

  saveGoals(filtered);

  if (isBrowser()) {
    const userId = await getCurrentUserId();
    if (userId) {
      const { error } = await supabase
        .from("goals")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        console.error("Failed to delete goal from Supabase", error);
        // Roll back the optimistic local removal so a retry actually
        // re-attempts the remote delete instead of silently no-op'ing.
        saveGoals(goals);
        throw error;
      }
    }
  }

  return true;
}

/**
 * Helper to sync goal status based on steps completion
 */
function syncGoalStatus(goal: Goal): Goal {
  if (goal.steps.length === 0) {
    if (goal.status === "completed") {
      goal.status = "active";
    }
    return goal;
  }

  const allCompleted = goal.steps.every((s) => s.completed);

  // If all steps are completed, we used to automatically mark the goal as complete.
  // We've modified this to wait for explicit user confirmation.
  // HOWEVER, we still automatically revert from 'completed' to 'active'
  // if a step is UNCHECKED, to ensure the status remains accurate.
  if (!allCompleted && goal.status === "completed") {
    goal.status = "active";
  }

  return goal;
}

/**
 * Add a step to a goal
 */
export function addMilestone(
  goalId: string,
  stepData: Omit<Step, "id" | "completed">
): Step | null {
  const goal = getGoalById(goalId);
  if (!goal) return null;

  const newStep: Step = {
    ...stepData,
    id: generateId(),
    completed: false,
  };

  goal.steps.push(newStep);
  syncGoalStatus(goal);

  updateGoal(goalId, {
    steps: goal.steps,
    status: goal.status
  });

  return newStep;
}

/** Legacy alias */
export const addStep = addMilestone;

/**
 * Toggle step completion
 */
export function toggleMilestone(
  goalId: string,
  stepId: string
): boolean {
  const goal = getGoalById(goalId);
  if (!goal) return false;

  const step = goal.steps.find((s) => s.id === stepId);
  if (!step) return false;

  step.completed = !step.completed;
  syncGoalStatus(goal);

  updateGoal(goalId, {
    steps: goal.steps,
    status: goal.status
  });

  return true;
}

/** Legacy alias */
export const toggleStep = toggleMilestone;

/**
 * Delete a step from a goal
 */
export function deleteMilestone(goalId: string, stepId: string): boolean {
  const goal = getGoalById(goalId);
  if (!goal) return false;

  const initialLength = goal.steps.length;
  goal.steps = goal.steps.filter((s) => s.id !== stepId);

  if (goal.steps.length === initialLength) return false;

  syncGoalStatus(goal);

  updateGoal(goalId, {
    steps: goal.steps,
    status: goal.status
  });
  return true;
}

/** Legacy alias */
export const deleteStep = deleteMilestone;

/**
 * Update a step's details
 */
export function updateMilestone(
  goalId: string,
  stepId: string,
  updates: Partial<Omit<Step, "id">>
): boolean {
  const goal = getGoalById(goalId);
  if (!goal) return false;

  const step = goal.steps.find((s) => s.id === stepId);
  if (!step) return false;

  Object.assign(step, updates);
  syncGoalStatus(goal);

  updateGoal(goalId, {
    steps: goal.steps,
    status: goal.status
  });
  return true;
}

/** Legacy alias */
export const updateStep = updateMilestone;

/**
 * Add an action to a goal
 */
export function addAction(
  goalId: string,
  action: Omit<Action, "id" | "completed">
): Action | null {
  const goal = getGoalById(goalId);
  if (!goal) return null;

  const newAction: Action = {
    ...action,
    id: generateId(),
    completed: false,
  };

  goal.actions.push(newAction);
  updateGoal(goalId, { actions: goal.actions });

  return newAction;
}

/**
 * Toggle action completion
 */
export function toggleAction(goalId: string, actionId: string): boolean {
  const goal = getGoalById(goalId);
  if (!goal) return false;

  const action = goal.actions.find((a) => a.id === actionId);
  if (!action) return false;

  action.completed = !action.completed;
  updateGoal(goalId, { actions: goal.actions });

  return true;
}

/**
 * Get active goals count
 */
export function getActiveGoalsCount(): number {
  return getGoals().filter((g) => g.status === "active").length;
}

/**
 * Calculate goal progress (percentage of steps completed)
 */
export function getGoalProgress(goal: Goal): number {
  if (goal.steps.length === 0) return 0;
  const completed = goal.steps.filter((s) => s.completed).length;
  return Math.round((completed / goal.steps.length) * 100);
}

// =============================================================================
// Weekly Check-ins
// =============================================================================

export interface CheckIn {
  id: string;
  date: string; // ISO date (YYYY-MM-DD)
  energyLevel: number; // 1-5 scale
  achievements?: string; // User's self-reported achievements
  reflection?: string; // Optional weekly reflection
  stepsCompleted: string[]; // IDs of steps marked complete this session (legacy)
  milestonesCompleted?: string[]; // Legacy
  likedAchievement?: boolean; // Saved as a "proud of" memory on the progress page
  likedReflection?: boolean; // Saved as a "learning" memory on the progress page
  createdAt: string; // ISO datetime
}

function mapCheckInFromSupabase(row: Record<string, unknown>): CheckIn {
  return {
    id: String(row.id ?? ""),
    date: String(row.date ?? ""),
    energyLevel: Number(row.energy_level ?? 0),
    achievements: row.achievements ? String(row.achievements) : undefined,
    reflection: row.reflection ? String(row.reflection) : undefined,
    stepsCompleted: Array.isArray(row.steps_completed) ? (row.steps_completed as string[]) : [],
    likedAchievement: Boolean(row.liked_achievement),
    likedReflection: Boolean(row.liked_reflection),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function mapCheckInForSupabase(checkIn: CheckIn, userId: string) {
  return {
    id: checkIn.id,
    user_id: userId,
    date: checkIn.date,
    energy_level: checkIn.energyLevel,
    achievements: checkIn.achievements ?? null,
    reflection: checkIn.reflection ?? null,
    steps_completed: checkIn.stepsCompleted ?? [],
    liked_achievement: checkIn.likedAchievement ?? false,
    liked_reflection: checkIn.likedReflection ?? false,
    created_at: checkIn.createdAt,
  };
}

export async function syncCheckInToSupabase(checkIn: CheckIn): Promise<void> {
  if (!isBrowser()) return;

  const userId = await getCurrentUserId();
  if (!userId) return;

  const { error } = await supabase
    .from("checkins")
    .upsert(mapCheckInForSupabase(checkIn, userId), { onConflict: "id" });

  if (error) {
    console.error("Failed to sync check-in to Supabase", error);
  }
}

export async function loadCheckInsFromSupabase(): Promise<CheckIn[]> {
  if (!isBrowser()) return [];

  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("checkins")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to load check-ins from Supabase", error);
    return [];
  }

  const remoteCheckIns = (data ?? []).map((row) => mapCheckInFromSupabase(row as Record<string, unknown>));

  // Always mirror the remote result locally, including empty results —
  // otherwise a deleted-down-to-zero checkin list leaves a stale cached entry behind.
  saveCheckIns(remoteCheckIns);
  return remoteCheckIns;
}

/**
 * Get all check-ins from localStorage and ensure consistency
 */
export function getCheckIns(): CheckIn[] {
  if (!isBrowser()) return [];

  try {
    const stored = localStorage.getItem(scopedKey(STORAGE_KEYS.CHECKINS));
    if (!stored) return [];
    const rawCheckIns = JSON.parse(stored) as CheckIn[];

    // Data Migration: Ensure 'stepsCompleted' exists
    return rawCheckIns.map(c => {
      if (!c.stepsCompleted && c.milestonesCompleted) {
        c.stepsCompleted = c.milestonesCompleted;
      } else if (!c.stepsCompleted) {
        c.stepsCompleted = [];
      }
      if (c.likedAchievement === undefined) c.likedAchievement = false;
      if (c.likedReflection === undefined) c.likedReflection = false;
      return c as CheckIn;
    });
  } catch {
    return [];
  }
}

/**
 * Save all check-ins to localStorage
 */
function saveCheckIns(checkIns: CheckIn[]): void {
  if (!isBrowser()) return;
  localStorage.setItem(scopedKey(STORAGE_KEYS.CHECKINS), JSON.stringify(checkIns));
}

/**
 * Get the most recent check-in
 */
export function getLastCheckIn(): CheckIn | null {
  const checkIns = getCheckIns();
  if (checkIns.length === 0) return null;

  return checkIns.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];
}

/**
 * Save a new check-in to localStorage
 */
export function saveCheckIn(
  checkIn: Omit<CheckIn, "id" | "createdAt" | "stepsCompleted" | "likedAchievement" | "likedReflection"> & { stepsCompleted?: string[], milestonesCompleted?: string[] }
): CheckIn {
  const newCheckIn: CheckIn = {
    ...checkIn,
    stepsCompleted: checkIn.stepsCompleted || checkIn.milestonesCompleted || [],
    likedAchievement: false,
    likedReflection: false,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };

  const checkIns = getCheckIns();
  checkIns.push(newCheckIn);
  saveCheckIns(checkIns);
  void syncCheckInToSupabase(newCheckIn);

  return newCheckIn;
}

/**
 * Toggle a liked memory (proud-of or learning) on a specific check-in.
 */
export function toggleCheckInLike(
  type: "achievements" | "reflection",
  checkInId: string
): CheckIn[] {
  const checkIns = getCheckIns();
  const checkIn = checkIns.find((c) => c.id === checkInId);
  if (!checkIn) return checkIns;

  if (type === "achievements") {
    checkIn.likedAchievement = !checkIn.likedAchievement;
  } else {
    checkIn.likedReflection = !checkIn.likedReflection;
  }

  saveCheckIns(checkIns);
  void syncCheckInToSupabase(checkIn);

  return checkIns;
}

/**
 * Get the start of the current week (Monday)
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Check if user has checked in during the current week
 */
export function hasCheckedInThisWeek(): boolean {
  const lastCheckIn = getLastCheckIn();
  if (!lastCheckIn) return false;

  const now = new Date();
  const weekStart = getWeekStart(now);
  const checkInDate = new Date(lastCheckIn.createdAt);

  return checkInDate >= weekStart;
}

/**
 * Days elapsed since the user's last check-in, or null if they've never
 * checked in.
 */
export function getDaysSinceLastCheckIn(): number | null {
  const lastCheckIn = getLastCheckIn();
  if (!lastCheckIn) return null;

  const diffMs = Date.now() - new Date(lastCheckIn.createdAt).getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Whether the weekly check-in reminder popup should be shown: due this week
 * and not already dismissed for this specific week (re-prompts next week).
 *
 * The first calendar day this would ever show for a given user is skipped
 * entirely — they've just been through onboarding, so one more popup right
 * away would be overwhelming. It behaves normally (reappearing every week
 * it's due) from the next day on.
 */
export function shouldShowCheckInReminder(): boolean {
  if (!isBrowser()) return false;
  if (hasCheckedInThisWeek()) return false;
  if (isWithinFirstSeenDay(STORAGE_KEYS.CHECKIN_REMINDER_INTRO_SEEN)) return false;

  const dismissedWeek = localStorage.getItem(scopedKey(STORAGE_KEYS.CHECKIN_REMINDER_DISMISSED));
  const currentWeekKey = getWeekStart(new Date()).toISOString();
  return dismissedWeek !== currentWeekKey;
}

/**
 * Dismiss the check-in reminder popup for the current week only — it
 * reappears once a new week starts and a check-in is still due.
 */
export function dismissCheckInReminder(): void {
  if (!isBrowser()) return;
  const currentWeekKey = getWeekStart(new Date()).toISOString();
  localStorage.setItem(scopedKey(STORAGE_KEYS.CHECKIN_REMINDER_DISMISSED), currentWeekKey);
}

/**
 * Calculate momentum weeks (consecutive weeks with check-ins)
 */
export function getMomentumDays(): number {
  const checkIns = getCheckIns();
  if (checkIns.length === 0) return 0;

  const sorted = checkIns.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  let momentum = 0;
  let currentWeekStart = getWeekStart(new Date());

  for (const checkIn of sorted) {
    const checkInDate = new Date(checkIn.createdAt);
    const checkInWeekStart = getWeekStart(checkInDate);

    if (checkInWeekStart.getTime() === currentWeekStart.getTime()) {
      momentum++;
      currentWeekStart = new Date(currentWeekStart);
      currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    } else if (checkInWeekStart.getTime() < currentWeekStart.getTime()) {
      break;
    }
  }

  return momentum;
}

// =============================================================================
// Weekly Momentum Data for Charts
// =============================================================================

export interface WeeklyMomentumData {
  weekStart: Date;
  weekLabel: string;
  hasCheckIn: boolean;
  avgEnergy: number | null;
  stepsCompleted: number;
  score: number;
}

/**
 * Get weekly momentum data for the past N weeks
 */
export function getWeeklyMomentumData(weeksCount: number = 8): WeeklyMomentumData[] {
  const checkIns = getCheckIns();
  const goals = getGoals();
  const totalSteps = goals.reduce((sum, g) => sum + g.steps.length, 0);

  const weeks: WeeklyMomentumData[] = [];
  const now = new Date();

  for (let i = weeksCount - 1; i >= 0; i--) {
    const weekStart = getWeekStart(new Date(now));
    weekStart.setDate(weekStart.getDate() - (i * 7));

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const weekCheckIns = checkIns.filter(c => {
      const checkInDate = new Date(c.createdAt);
      return checkInDate >= weekStart && checkInDate < weekEnd;
    });

    const hasCheckIn = weekCheckIns.length > 0;
    const avgEnergy = hasCheckIn
      ? weekCheckIns.reduce((sum, c) => sum + c.energyLevel, 0) / weekCheckIns.length
      : null;

    const stepsCompleted = weekCheckIns.reduce(
      (sum, c) => sum + c.stepsCompleted.length,
      0
    );

    let score = 0;
    if (hasCheckIn) {
      score += 40;
      score += avgEnergy ? ((avgEnergy - 1) / 4) * 30 : 0;
      score += totalSteps > 0
        ? Math.min(30, (stepsCompleted / totalSteps) * 100 * 0.3)
        : 0;
    }

    const weekLabel = weekStart.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
    });

    weeks.push({
      weekStart,
      weekLabel,
      hasCheckIn,
      avgEnergy,
      stepsCompleted,
      score: Math.round(score),
    });
  }

  return weeks;
}

// =============================================================================
// Discovery (Self-Awareness Pillars)
// =============================================================================

export type DiscoveryPillar = "skills" | "qualities" | "values" | "interests";

export interface DiscoveryData {
  skills: string[];
  qualities: string[];
  values: string[];
  interests: string[];
  updatedAt?: string; // ISO date string
}

const DEFAULT_DISCOVERY: DiscoveryData = {
  skills: [],
  qualities: [],
  values: [],
  interests: [],
};

/**
 * Get discovery data from localStorage
 */
export function getDiscoveryData(): DiscoveryData {
  if (!isBrowser()) return DEFAULT_DISCOVERY;

  try {
    const stored = localStorage.getItem(scopedKey(STORAGE_KEYS.DISCOVERY));
    if (!stored) return DEFAULT_DISCOVERY;
    return JSON.parse(stored) as DiscoveryData;
  } catch {
    return DEFAULT_DISCOVERY;
  }
}

async function getDiscoveryDataFromSupabase(): Promise<DiscoveryData | null> {
  if (!isBrowser()) return null;

  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from("discovery_data")
    .select("payload")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load discovery data from Supabase", error);
    return null;
  }

  if (!data?.payload) return null;

  return data.payload as DiscoveryData;
}

export async function syncDiscoveryDataToSupabase(data: DiscoveryData): Promise<void> {
  if (!isBrowser()) return;

  const userId = await getCurrentUserId();
  if (!userId) return;

  const payload = {
    user_id: userId,
    payload: {
      ...data,
      updatedAt: new Date().toISOString(),
    },
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("discovery_data")
    .upsert(payload, { onConflict: "user_id" });

  if (error) {
    console.error("Failed to sync discovery data to Supabase", error);
  }
}

export async function loadDiscoveryDataFromSupabase(): Promise<DiscoveryData> {
  const remoteData = await getDiscoveryDataFromSupabase();
  if (remoteData) {
    localStorage.setItem(scopedKey(STORAGE_KEYS.DISCOVERY), JSON.stringify(remoteData));
    return remoteData;
  }

  return getDiscoveryData();
}

/**
 * Save discovery data to localStorage
 */
export function saveDiscoveryData(data: Partial<DiscoveryData>): void {
  if (!isBrowser()) return;

  const current = getDiscoveryData();
  const updated = {
    ...current,
    ...data,
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem(scopedKey(STORAGE_KEYS.DISCOVERY), JSON.stringify(updated));
  void syncDiscoveryDataToSupabase(updated);
}

/**
 * Add an item to a discovery pillar
 */
export function addDiscoveryItem(pillar: DiscoveryPillar, item: string): void {
  const data = getDiscoveryData();
  const trimmed = item.trim();

  // Avoid duplicates (case-insensitive)
  if (data[pillar].some(i => i.toLowerCase() === trimmed.toLowerCase())) {
    return;
  }

  data[pillar] = [...data[pillar], trimmed];
  saveDiscoveryData(data);
}

/**
 * Remove an item from a discovery pillar
 */
export function removeDiscoveryItem(pillar: DiscoveryPillar, item: string): void {
  const data = getDiscoveryData();
  data[pillar] = data[pillar].filter(i => i !== item);
  saveDiscoveryData(data);
}
/**
 * Check if the discovery hub has been populated with any items
 */
export function isDiscoveryPopulated(): boolean {
  const data = getDiscoveryData();
  return (
    data.skills.length > 0 ||
    data.qualities.length > 0 ||
    data.values.length > 0 ||
    data.interests.length > 0
  );
}
