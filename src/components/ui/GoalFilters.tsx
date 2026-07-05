"use client";

import { GoalCategory } from "@/lib/storage";
import { Check } from "lucide-react";
import { PrimaryButton } from "./PrimaryButton";

export type SortOption =
  | "targetDate"
  | "progressAsc"
  | "progressDesc"
  | "newest"
  | "oldest"
  | "alpha";

export interface GoalFilterState {
  sortBy: SortOption;
  categories: GoalCategory[];
  statuses: ("active" | "paused" | "completed")[];
  atRiskOnly: boolean;
}

export const CATEGORIES: GoalCategory[] = ["Wellbeing", "Career", "Finance", "Skills, Education & Learning", "Relationships"];
export const STATUS_OPTIONS: ("active" | "paused" | "completed")[] = ["active", "paused", "completed"];

export const DEFAULT_FILTERS: GoalFilterState = {
  sortBy: "targetDate",
  categories: [], // Empty means all
  statuses: [], // Empty means all
  atRiskOnly: false,
};

interface GoalFiltersProps {
  filters: GoalFilterState;
  onFiltersChange: (filters: GoalFilterState) => void;
  onApply: () => void;
  totalResults: number;
  categoryCounts: Record<string, number>;
  statusCounts: Record<string, number>;
  atRiskCount: number;
}

export default function GoalFilters({
  filters,
  onFiltersChange,
  onApply,
  totalResults,
  categoryCounts,
  statusCounts,
  atRiskCount,
}: GoalFiltersProps) {

  const toggleCategory = (cat: GoalCategory) => {
    const newCats = filters.categories.includes(cat)
      ? filters.categories.filter((c) => c !== cat)
      : [...filters.categories, cat];
    onFiltersChange({ ...filters, categories: newCats });
  };

  const toggleStatus = (status: "active" | "paused" | "completed") => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onFiltersChange({ ...filters, statuses: newStatuses });
  };


  return (
    <div className="space-y-4">
      {/* Categories Section */}
      <section>
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">
          Categories
        </h3>
        <div className="space-y-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${filters.categories.includes(cat)
                ? "border-[var(--color-deep-violet)] bg-[var(--color-deep-violet)]/5 text-[var(--color-charcoal)]"
                : "border-brand-surface bg-brand-surface text-text-muted"
                }`}
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${filters.categories.includes(cat)
                ? "bg-[var(--color-deep-violet)] border-[var(--color-deep-violet)] text-white"
                : "bg-white border-brand-surface-dark"
                }`}>
                {filters.categories.includes(cat) && <Check className="w-3.5 h-3.5" />}
              </div>
              <span className="text-sm font-semibold">
                {cat} <span className="text-text-muted opacity-60">({categoryCounts[cat] || 0})</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Status Section */}
      <section>
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">
          Status
        </h3>
        <div className="space-y-2">
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              onClick={() => toggleStatus(status)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${filters.statuses.includes(status)
                ? "border-brand-primary bg-brand-primary/5 text-[var(--color-charcoal)]"
                : "border-brand-surface bg-brand-surface text-text-muted"
                }`}
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${filters.statuses.includes(status)
                ? "bg-brand-primary border-brand-primary text-white"
                : "bg-white border-brand-surface-dark"
                }`}>
                {filters.statuses.includes(status) && <Check className="w-3.5 h-3.5" />}
              </div>
              <span className="text-sm font-semibold capitalize">
                {status} <span className="normal-case opacity-60 font-normal">({statusCounts[status] || 0})</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Special Filters */}
      <section>
        <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">
          Focus
        </h3>
        <div className="space-y-1.5">
          <button
            onClick={() =>
              onFiltersChange({ ...filters, atRiskOnly: !filters.atRiskOnly })
            }
            className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${filters.atRiskOnly
              ? "border-brand-primary bg-brand-primary/5 text-[var(--color-charcoal)]"
              : "border-brand-surface bg-brand-surface text-text-muted"
              }`}
          >
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${filters.atRiskOnly
              ? "bg-brand-primary border-brand-primary text-white"
              : "bg-white border-brand-surface-dark"
              }`}>
              {filters.atRiskOnly && <Check className="w-3.5 h-3.5" />}
            </div>
            <span className="text-sm font-semibold text-left flex-1">
              Show only &quot;At Risk&quot; <span className="text-text-muted opacity-60 font-normal">({atRiskCount})</span>
            </span>
          </button>
          <p className="text-[10px] text-text-muted px-1">
            * Behind pace with &lt; 2 weeks left
          </p>
        </div>
      </section>

      {/* Actions */}
      <div className="pt-4">
        <PrimaryButton onClick={onApply} className="w-full">
          Apply Filters ({totalResults})
        </PrimaryButton>
      </div>
    </div>
  );
}
