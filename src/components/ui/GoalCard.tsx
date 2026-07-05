"use client";

import Link from "next/link";
import { Goal, getGoalProgress, GoalCategory } from "@/lib/storage";
import {
  Activity,
  Heart,
  Briefcase,
  Coins,
  Sprout,
  Home,
  Tag,
  type LucideIcon
} from "lucide-react";

interface GoalCardProps {
  goal: Goal;
}

export default function GoalCard({ goal }: GoalCardProps) {
  const progress = getGoalProgress(goal);

  // Format date: e.g. "Oct 20"
  const formattedDate = goal.targetDate
    ? new Date(goal.targetDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "No date";

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
    <Link
      href={`/goals/${goal.id}`}
      className={`block rounded-2xl p-4 group transition-all ${goal.status === "active"
        ? "bg-white border border-gray-100 shadow-[0_0_15px_rgba(0,0,0,0.08)]"
        : "bg-warm-ivory"
        } hover:bg-[var(--color-magenta)]/5`}
    >
      <div className="flex items-center gap-4">
        {/* Left: Category Icon in colored square */}
        <div className="w-14 h-14 rounded-xl bg-[var(--color-deep-violet)] flex items-center justify-center shrink-0">
          <CategoryIcon className="w-7 h-7 text-white" />
        </div>

        {/* Middle: Title & Date */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {goal.status === "paused" && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 uppercase tracking-wide">
                Paused
              </span>
            )}
            {goal.status === "completed" && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700 uppercase tracking-wide">
                Completed
              </span>
            )}
          </div>
          <h3 className={`text-lg font-medium truncate group-hover:text-[var(--color-magenta)] transition-colors mb-0.5 ${goal.status === "completed" ? "text-brand-primary" : "text-[var(--color-charcoal)]"
            }`}>
            {goal.title}
          </h3>
          <p className="text-xs text-text-muted">
            Target: {formattedDate}
          </p>
        </div>

        {/* Right: Percentage - vertically centered and large */}
        <div className="flex items-center justify-center shrink-0">
          <div className="text-4xl font-light text-brand-primary leading-none">
            {progress}%
          </div>
        </div>
      </div>
    </Link>
  );
}
