"use client";

import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";

interface FocusCardProps {
  /** Lucide icon component */
  icon: LucideIcon;
  /** Icon color class */
  iconColor?: string;
  /** Category title */
  title: string;
  /** Brief description */
  description: string;
  /** Value to pass on selection */
  value: string;
  /** Selection handler - auto-advances on tap */
  onSelect: (value: string) => void;
}

/**
 * Focus category selection card.
 * Large touch target with icon, title, and description.
 * Auto-advances to next screen on selection.
 */
export function FocusCard({
  icon: Icon,
  iconColor = "text-brand-primary",
  title,
  description,
  value,
  onSelect,
}: FocusCardProps) {
  return (
    <button
      onClick={() => onSelect(value)}
      className="w-full p-4 bg-white rounded-2xl border border-gray-100 
        hover:border-brand-primary/30 
        active:scale-[0.98] transition-all duration-150 text-left group"
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-full bg-bg-subtle flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[var(--color-charcoal)] text-base">
            {title}
          </h3>
          <p className="text-text-muted text-sm">
            {description}
          </p>
        </div>

        {/* Arrow indicator */}
        <ChevronRight className="w-5 h-5 text-text-subtle group-hover:text-brand-primary transition-colors flex-shrink-0" />
      </div>
    </button>
  );
}
