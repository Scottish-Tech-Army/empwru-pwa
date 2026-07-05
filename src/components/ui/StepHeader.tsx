"use client";

import { Tooltip } from "./Tooltip";

interface StepHeaderProps {
  title: string;
  subtitle?: string;
  tooltip?: string;
}

/**
 * Reusable centered header for wizard steps.
 * Used in goal creation, check-in, and onboarding flows.
 */
export function StepHeader({ title, subtitle, tooltip }: StepHeaderProps) {
  return (
    <div className="text-center mb-6">
      <div className="flex items-center justify-center gap-2 mb-2">
        <p className="text-[18px] font-medium text-[var(--color-charcoal)]">{title}</p>
        {tooltip && <Tooltip content={tooltip} />}
      </div>
      {subtitle && (
        <p className="text-[var(--color-text-muted)]">{subtitle}</p>
      )}
    </div>
  );
}
