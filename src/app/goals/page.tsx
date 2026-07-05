"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Goal, getGoals, getGoalProgress } from "@/lib/storage";
import GoalCard from "@/components/ui/GoalCard";
import BottomNav from "@/components/ui/BottomNav";
import DailyQuote from "@/components/ui/DailyQuote";
import { BottomSheet, GoalFilters, GoalSort } from "@/components";
import { GoalFilterState, DEFAULT_FILTERS, CATEGORIES, STATUS_OPTIONS } from "@/components/ui/GoalFilters";

import { Plus, SlidersHorizontal, RotateCcw, ArrowUpDown, Target } from "lucide-react";
import { DottedEmptyState } from "@/components";

/**
 * Smart "At Risk" logic:
 * A goal is "At Risk" when:
 * 1. Behind pace (time elapsed % > progress %)
 * 2. Running out of time (< 14 days remaining)
 */
function isGoalAtRisk(goal: Goal): boolean {
  if (!goal.targetDate) return false;

  const now = new Date();
  const created = new Date(goal.createdAt);
  const target = new Date(goal.targetDate);

  const totalDuration = target.getTime() - created.getTime();
  const elapsed = now.getTime() - created.getTime();
  const remaining = target.getTime() - now.getTime();

  // If already past due, it's definitely at risk if not completed
  if (remaining <= 0) return goal.status !== "completed";

  const timeElapsedPercent = (elapsed / totalDuration) * 100;
  const progress = getGoalProgress(goal);
  const daysRemaining = remaining / (1000 * 60 * 60 * 24);

  return progress < timeElapsedPercent && daysRemaining < 14;
}

/**
 * Goals list page - Shows all goals with option to create new
 */
export default function GoalsPage() {
  const [goals] = useState<Goal[]>(() => getGoals());
  const [isLoading] = useState(() => false);

  // Filter and Sort state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [filters, setFilters] = useState<GoalFilterState>(DEFAULT_FILTERS);
  const [period, setPeriod] = useState<"week" | "month" | "year">("week");

  // Apply filters and sort to goals
  const processedGoals = useMemo(() => {
    // 1. Filter
    const filtered = goals.filter((g) => {
      // Status filter (empty = all)
      if (filters.statuses.length > 0 && !filters.statuses.includes(g.status))
        return false;

      // Category filter (empty = all)
      if (
        filters.categories.length > 0 &&
        !filters.categories.includes(g.category)
      )
        return false;

      // At Risk filter
      if (filters.atRiskOnly && !isGoalAtRisk(g)) return false;

      return true;
    });

    // 2. Sort
    return [...filtered].sort((a, b) => {
      switch (filters.sortBy) {
        case "targetDate":
          // Sort by date soonest first, but keep "No Date" at the end
          if (!a.targetDate) return 1;
          if (!b.targetDate) return -1;
          return a.targetDate.localeCompare(b.targetDate);

        case "progressAsc":
          return getGoalProgress(a) - getGoalProgress(b);

        case "progressDesc":
          return getGoalProgress(b) - getGoalProgress(a);

        case "newest":
          return b.createdAt.localeCompare(a.createdAt);

        case "oldest":
          return a.createdAt.localeCompare(b.createdAt);

        case "alpha":
          return a.title.localeCompare(b.title);

        default:
          return 0;
      }
    });
  }, [goals, filters]);

  // Group by status for grouped rendering
  const activeGoals = processedGoals.filter((g) => g.status === "active");
  const pausedGoals = processedGoals.filter((g) => g.status === "paused");
  const completedGoals = processedGoals.filter((g) => g.status === "completed");

  const activeFilterCount =
    filters.categories.length +
    filters.statuses.length +
    (filters.atRiskOnly ? 1 : 0);

  const isSorted = filters.sortBy !== DEFAULT_FILTERS.sortBy;

  const facetCounts = useMemo(() => {
    return {
      categories: CATEGORIES.reduce((acc, cat) => {
        acc[cat] = goals.filter(g => 
          (filters.statuses.length === 0 || filters.statuses.includes(g.status)) &&
          (!filters.atRiskOnly || isGoalAtRisk(g)) &&
          g.category === cat
        ).length;
        return acc;
      }, {} as Record<string, number>),
      statuses: STATUS_OPTIONS.reduce((acc, status) => {
        acc[status] = goals.filter(g => 
          (filters.categories.length === 0 || filters.categories.includes(g.category)) &&
          (!filters.atRiskOnly || isGoalAtRisk(g)) &&
          g.status === status
        ).length;
        return acc;
      }, {} as Record<string, number>),
      atRisk: goals.filter(g => 
        (filters.categories.length === 0 || filters.categories.includes(g.category)) &&
        (filters.statuses.length === 0 || filters.statuses.includes(g.status)) &&
        isGoalAtRisk(g)
      ).length
    };
  }, [goals, filters.categories, filters.statuses, filters.atRiskOnly]);

  if (isLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-brand-surface">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg-card flex flex-col">
      {/* Header */}
      <header className="pt-6 pb-4 bg-white sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-brand-primary" />
              <h1 className="text-2xl text-[var(--color-charcoal)]">Goals</h1>
            </div>
            <p className="text-text-muted mt-1">Step into your potential</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSortOpen(true)}
              className={`w-10 h-10 flex items-center justify-center rounded-full border-2 transition-all ${
                isSorted
                  ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                  : "border-brand-surface bg-white text-text-muted"
              }`}
              aria-label="Sort goals"
            >
              <ArrowUpDown className="w-5 h-5" />
            </button>

            <button
              onClick={() => setIsFilterOpen(true)}
              className={`relative w-10 h-10 flex items-center justify-center rounded-full border-2 transition-all ${
                activeFilterCount > 0
                  ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                  : "border-brand-surface bg-white text-text-muted"
              }`}
              aria-label="Filter goals"
            >
              <SlidersHorizontal className="w-5 h-5" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-primary text-white text-[10px] flex items-center justify-center rounded-full font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <Link
              href="/goals/new"
              className="w-10 h-10 flex items-center justify-center rounded-full border-2 border-brand-primary text-brand-primary hover:bg-brand-primary/5 transition-colors"
              aria-label="Create new goal"
            >
              <Plus className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </header>

      <div className="px-6 flex-1 flex flex-col max-w-5xl mx-auto w-full pt-4">
        {/* Inspirational Quote */}
        <div className="mb-6">
          <DailyQuote 
            quote="Whatever the mind can conceive and believe, it can achieve!"
            author="Napoleon Hill"
          />
        </div>

        {/* Divider */}
        <hr className="border-gray-200 mb-6" />

        {goals.length === 0 ? (
          /* Initial Empty State (No goals created) */
          <section className="flex-1 flex flex-col pb-8 h-full">
            <DottedEmptyState
              href="/goals/new"
              title="Set your first goal"
              description="Start with something meaningful to you and track your journey to potential."
              icon={Plus}
              className="flex-1 h-full"
            />
          </section>
        ) : processedGoals.length === 0 ? (
          /* Filtered Empty State (No matches) */
          <section className="py-12 text-center">
            <div className="bg-white rounded-2xl p-8 border-2 border-brand-surface">
              <p className="text-text-muted mb-6">No goals match your current filters.</p>
              <button
                onClick={() => setFilters(DEFAULT_FILTERS)}
                className="flex items-center justify-center gap-2 mx-auto px-6 py-3 rounded-xl bg-brand-surface text-brand-primary font-medium hover:bg-brand-primary/5 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Clear All Filters
              </button>
            </div>
          </section>
        ) : (
          <>
            {/* Section Header */}
            <div className="mb-4 mx-4">
              <h2 className="text-lg font-semibold text-[var(--color-charcoal)]">
                Your Goals
              </h2>
              <p className="text-sm text-text-muted">Track your journey to potential</p>
            </div>

            {/* Active Goals */}
            {activeGoals.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center justify-between mb-3 mx-4">
                  <h3 className="text-sm text-text-muted uppercase tracking-wide">
                    Active ({activeGoals.length})
                  </h3>
                  <div className="flex gap-1 bg-gray-100 rounded-lg p-1 shadow-[0_0_15px_rgba(0,0,0,0.08)]">
                    {(["week", "month", "year"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${
                          period === p
                            ? "bg-white text-[var(--color-charcoal)] shadow-sm"
                            : "text-text-muted hover:text-[var(--color-charcoal)]"
                        }`}
                      >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  {activeGoals.map((goal) => (
                    <GoalCard key={goal.id} goal={goal} />
                  ))}
                </div>
              </section>
            )}

            {/* Paused Goals */}
            {pausedGoals.length > 0 && (
              <section className="mb-8">
                <h2 className="text-sm text-text-muted uppercase tracking-wide mb-3">
                  Paused ({pausedGoals.length})
                </h2>
                <div className="space-y-4">
                  {pausedGoals.map((goal) => (
                    <GoalCard key={goal.id} goal={goal} />
                  ))}
                </div>
              </section>
            )}

            {/* Completed Goals */}
            {completedGoals.length > 0 && (
              <section>
                <h2 className="text-sm text-text-muted uppercase tracking-wide mb-3">
                  Completed ({completedGoals.length})
                </h2>
                <div className="space-y-4">
                  {completedGoals.map((goal) => (
                    <GoalCard key={goal.id} goal={goal} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* Spacer for BottomNav */}
      <div className="h-20" />

      {/* Sorting BottomSheet */}
      <BottomSheet
        isOpen={isSortOpen}
        onClose={() => setIsSortOpen(false)}
        title="Sort Goals"
      >
        <GoalSort
          currentSort={filters.sortBy}
          onSortChange={(sortBy) => setFilters({ ...filters, sortBy })}
          onApply={() => setIsSortOpen(false)}
        />
      </BottomSheet>

      {/* Filters BottomSheet */}
      <BottomSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Filter Goals"
      >
        <GoalFilters
          filters={filters}
          onFiltersChange={setFilters}
          onApply={() => setIsFilterOpen(false)}
          totalResults={processedGoals.length}
          categoryCounts={facetCounts.categories}
          statusCounts={facetCounts.statuses}
          atRiskCount={facetCounts.atRisk}
        />
      </BottomSheet>

      {!isFilterOpen && !isSortOpen && <BottomNav />}
    </div>
  );
}
