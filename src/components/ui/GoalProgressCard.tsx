"use client";

import { Goal, GoalCategory } from "@/lib/storage";
import {
  Check,
  Calendar,
  Activity,
  Heart,
  Briefcase,
  Coins,
  Sprout,
  Home,
  Tag,
  type LucideIcon
} from "lucide-react";

interface GoalProgressCardProps {
  goal: Goal;
  onStepToggle: (stepId: string) => void;
}

/**
 * GoalProgressCard
 * 
 * Displays a goal with its steps as a toggleable list.
 * Used in the check-in process.
 */
export function GoalProgressCard({
  goal,
  onStepToggle,
}: GoalProgressCardProps) {
  const completedCount = goal.steps.filter((s) => s.completed).length;
  const totalSteps = goal.steps.length;
  const progress = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  // Category icon map
  const iconMap: Record<GoalCategory, LucideIcon> = {
    Wellbeing: Heart,
    Career: Briefcase,
    Finance: Coins,
    "Skills, Education & Learning": Sprout,
    Relationships: Home,
    other: Tag
  };
  const CategoryIcon = iconMap[goal.category] || Activity;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden transition-shadow">
      {/* Goal Header */}
      <div className="p-5 border-b border-gray-50 flex items-center gap-4">
        {/* Category Icon */}
        <div className="w-14 h-14 rounded-xl bg-[var(--color-deep-violet)] flex items-center justify-center shrink-0">
          <CategoryIcon className="w-7 h-7 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-900 truncate">
            {goal.title}
          </h3>
          <p className="text-xs text-brand-primary font-bold mt-1">
            {completedCount} of {totalSteps} steps completed ({progress}%)
          </p>
        </div>

        <div className="flex items-center justify-center shrink-0">
          <div className="text-3xl font-light text-brand-primary">
            {progress}%
          </div>
        </div>
      </div>

      <div className="bg-gray-50/30">
        <div className="p-3 space-y-2">
          {goal.steps.map((step) => (
            <button
              key={step.id}
              onClick={() => onStepToggle(step.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all border ${step.completed
                ? "bg-warm-ivory border-brand-primary/20 text-brand-primary"
                : "bg-white border-gray-100 hover:border-brand-primary/20 text-gray-900"
                }`}
            >
              <div
                className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-colors ${step.completed
                  ? "bg-brand-primary border-brand-primary text-white"
                  : "bg-transparent border-gray-200"
                  }`}
              >
                {step.completed && <Check className="w-4 h-4" />}
              </div>

              <div className="flex-1 text-left min-w-0">
                <p className={`text-sm font-semibold truncate ${step.completed ? "text-brand-primary" : "text-gray-900"
                  }`}>
                  {step.title}
                </p>
                {step.targetDate && (
                  <div className="flex items-center gap-1.5 mt-0.5 opacity-60">
                    <Calendar className="w-3 h-3" />
                    <span className="text-[10px] font-medium">
                      {new Date(step.targetDate).toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>
            </button>
          ))}

          {goal.steps.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-sm text-gray-400">No steps added yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
