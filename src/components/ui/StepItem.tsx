"use client";

import { X, Calendar } from "lucide-react";

interface StepItemProps {
  title: string;
  targetDate?: string;
  onRemove: () => void;
}

export function StepItem({
  title,
  targetDate,
  onRemove,
}: StepItemProps) {
  const formattedDate = targetDate
    ? new Date(targetDate).toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-gray-100 animate-in fade-in slide-in-from-right-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">
          {title}
        </p>
        {formattedDate && (
          <div className="flex items-center gap-1.5 mt-1">
            <Calendar className="w-3 h-3 text-[var(--color-magenta)]/60" />
            <span className="text-[10px] text-gray-500 font-medium">
              Due {formattedDate}
            </span>
          </div>
        )}
      </div>
      
      <button
        onClick={onRemove}
        className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-90"
        aria-label="Remove step"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
