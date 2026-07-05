"use client";

import { Check } from "lucide-react";
import { SortOption } from "./GoalFilters";
import { PrimaryButton } from "./PrimaryButton";

interface GoalSortProps {
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  onApply: () => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "targetDate", label: "Target Date" },
  { value: "progressDesc", label: "Progress (High to Low)" },
  { value: "progressAsc", label: "Progress (Low to High)" },
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "alpha", label: "Alphabetical" },
];

export default function GoalSort({
  currentSort,
  onSortChange,
  onApply,
}: GoalSortProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {SORT_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              onSortChange(option.value);
            }}
            className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
              currentSort === option.value
                ? "border-brand-primary bg-brand-primary/5 text-[var(--color-charcoal)]"
                : "border-brand-surface bg-brand-surface text-text-muted"
            }`}
          >
            <span className="text-sm font-semibold">{option.label}</span>
            {currentSort === option.value && (
              <div className="w-5 h-5 rounded-full bg-brand-primary flex items-center justify-center text-white">
                <Check className="w-3.5 h-3.5" />
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="pt-2">
        <PrimaryButton onClick={onApply} className="w-full">
          Apply Sort
        </PrimaryButton>
      </div>
    </div>
  );
}
