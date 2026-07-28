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
  PROGRESS_LIKES: `${STORAGE_PREFIX}progress_likes`,
  PREFERENCES: `${STORAGE_PREFIX}preferences`,
  DAILY_QUOTE: "empwru_daily_quote", // Standardized name
  DISCOVERY: `${STORAGE_PREFIX}discovery`,
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

/**
 * Get onboarding state from localStorage
 */
export function getOnboardingState(): OnboardingState {
  if (!isBrowser()) return DEFAULT_ONBOARDING;

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ONBOARDING);
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
  localStorage.setItem(STORAGE_KEYS.ONBOARDING, JSON.stringify(updated));
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
 * Reset all app data (for testing/debugging)
 */
export function resetAllData(): void {
  if (!isBrowser()) return;

  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
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
    const stored = localStorage.getItem(STORAGE_KEYS.BASELINE);
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
  localStorage.setItem(STORAGE_KEYS.BASELINE, JSON.stringify(updated));
}

/**
 * Mark baseline as completed with timestamp
 */
export function completeBaseline(): void {
  saveBaselineResponse({ completedAt: new Date().toISOString() });
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
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("Unable to read Supabase user", userError);
      return null;
    }

    if (user?.id) {
      return user.id;
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Unable to read Supabase session", sessionError);
      return null;
    }

    return session?.user?.id ?? null;
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

  if (remoteGoals.length > 0) {
    saveGoals(remoteGoals);
    return remoteGoals;
  }

  return [];
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
    const stored = localStorage.getItem(STORAGE_KEYS.GOALS);
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
  localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
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
 * Delete a goal
 */
export function deleteGoal(id: string): boolean {
  const goals = getGoals();
  const filtered = goals.filter((g) => g.id !== id);

  if (filtered.length === goals.length) return false;

  saveGoals(filtered);

  if (isBrowser()) {
    void supabase.from("goals").delete().eq("id", id);
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
  createdAt: string; // ISO datetime
}

export interface ProgressLikes {
  achievements: string[]; // CheckIn IDs liked as proud-of
  reflection: string[]; // CheckIn IDs liked as learning
}

const DEFAULT_PROGRESS_LIKES: ProgressLikes = {
  achievements: [],
  reflection: [],
};

/**
 * Get saved progress likes (proud-of / learning) from localStorage.
 */
export function getProgressLikes(): ProgressLikes {
  if (!isBrowser()) return DEFAULT_PROGRESS_LIKES;

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.PROGRESS_LIKES);
    if (!stored) return DEFAULT_PROGRESS_LIKES;
    return JSON.parse(stored) as ProgressLikes;
  } catch {
    return DEFAULT_PROGRESS_LIKES;
  }
}

/**
 * Toggle a liked progress card (proud-of or learning) for a specific check-in.
 */
export function toggleProgressLike(type: keyof ProgressLikes, checkInId: string): ProgressLikes {
  const current = getProgressLikes();
  const list = new Set(current[type]);

  if (list.has(checkInId)) {
    list.delete(checkInId);
  } else {
    list.add(checkInId);
  }

  const updated = { ...current, [type]: Array.from(list) };
  if (isBrowser()) {
    localStorage.setItem(STORAGE_KEYS.PROGRESS_LIKES, JSON.stringify(updated));
  }

  return updated;
}

/**
 * Get all check-ins from localStorage and ensure consistency
 */
export function getCheckIns(): CheckIn[] {
  if (!isBrowser()) return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CHECKINS);
    if (!stored) return [];
    const rawCheckIns = JSON.parse(stored) as CheckIn[];

    // Data Migration: Ensure 'stepsCompleted' exists
    return rawCheckIns.map(c => {
      if (!c.stepsCompleted && c.milestonesCompleted) {
        c.stepsCompleted = c.milestonesCompleted;
      } else if (!c.stepsCompleted) {
        c.stepsCompleted = [];
      }
      return c as CheckIn;
    });
  } catch {
    return [];
  }
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
  checkIn: Omit<CheckIn, "id" | "createdAt" | "stepsCompleted"> & { stepsCompleted?: string[], milestonesCompleted?: string[] }
): CheckIn {
  const newCheckIn: CheckIn = {
    ...checkIn,
    stepsCompleted: checkIn.stepsCompleted || checkIn.milestonesCompleted || [],
    id: generateId(),
    createdAt: new Date().toISOString(),
  };

  const checkIns = getCheckIns();
  checkIns.push(newCheckIn);

  if (!isBrowser()) return newCheckIn;
  localStorage.setItem(STORAGE_KEYS.CHECKINS, JSON.stringify(checkIns));

  return newCheckIn;
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
    const stored = localStorage.getItem(STORAGE_KEYS.DISCOVERY);
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
    localStorage.setItem(STORAGE_KEYS.DISCOVERY, JSON.stringify(remoteData));
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
  localStorage.setItem(STORAGE_KEYS.DISCOVERY, JSON.stringify(updated));
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
