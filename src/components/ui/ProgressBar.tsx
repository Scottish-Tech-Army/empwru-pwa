interface ProgressBarProps {
  /** Progress value from 0 to 100 */
  progress: number;
  /** Show percentage label */
  showLabel?: boolean;
}

/**
 * Horizontal progress bar with brand gradient fill.
 * Used for onboarding progress and quiz sections.
 */
export function ProgressBar({ progress, showLabel = false }: ProgressBarProps) {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="w-full">
      <div
        className="h-2 w-full rounded-full bg-[var(--color-warm-ivory)] overflow-hidden"
        role="progressbar"
        aria-valuenow={clampedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-brand-gradient transition-all duration-300 ease-out rounded-full"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-[var(--color-charcoal)]/60 mt-1 text-right">
          {Math.round(clampedProgress)}%
        </p>
      )}
    </div>
  );
}
