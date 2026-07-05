"use client";

import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";

interface TimeOptionProps {
  /** Time display (e.g., "8:00 AM") */
  time: string;
  /** Period label (e.g., "Morning") */
  label: string;
  /** Supporting description */
  description: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Icon color class */
  iconColor?: string;
  /** Whether this option is selected */
  selected: boolean;
  /** Selection handler */
  onSelect: () => void;
}

/**
 * Time selection option for reminder setup.
 * Large touch target with clear selected state.
 */
export function TimeOption({
  time,
  label,
  description,
  icon: Icon,
  iconColor = "text-brand-primary",
  selected,
  onSelect,
}: TimeOptionProps) {
  return (
    <button
      onClick={onSelect}
      role="radio"
      aria-checked={selected}
      className={`
        w-full aspect-[3/1] md:aspect-square p-3 md:p-6 rounded-2xl border transition-all duration-150
        flex flex-row md:flex-col items-center justify-start md:justify-center gap-3 md:gap-3 relative
        ${
          selected
            ? "border-brand-primary bg-brand-primary/5"
            : "border-gray-100 bg-white hover:border-brand-primary/30"
        }
      `}
    >
      {/* Icon */}
      <div className={`w-12 h-12 shrink-0 rounded-full bg-bg-subtle flex items-center justify-center`}>
        <Icon className={`w-6 h-6 ${iconColor}`} />
      </div>

      {/* Text content */}
      <div className="flex flex-col items-start md:items-center gap-1 overflow-hidden">
        <span className="font-medium text-gray-900 text-base md:text-lg whitespace-nowrap">
          {time}
        </span>
        <div className="flex flex-col items-start md:items-center">
          <span className="text-gray-500 text-xs md:text-sm">
            {label}
          </span>
          <p className="text-gray-500 text-xs md:text-base text-left md:text-center line-clamp-1 md:line-clamp-none">
            {description}
          </p>
        </div>
      </div>

      {/* Check indicator - absolute positioned top-right */}
      {selected && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-brand-primary flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}
    </button>
  );
}
