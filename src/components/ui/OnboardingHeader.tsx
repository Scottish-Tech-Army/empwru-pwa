"use client";

import { BackButton } from "./BackButton";
import { ProgressBar } from "./ProgressBar";

interface OnboardingHeaderProps {
  /** Current step number (1-4) */
  currentStep: number;
  /** Total number of steps */
  totalSteps?: number;
  /** Show back button (default: true) */
  showBack?: boolean;
  /** Custom back navigation path */
  backHref?: string;
  /** Custom back click handler (takes precedence over backHref) */
  onBack?: () => void;
}

/**
 * Consistent header for onboarding screens.
 * Combines back button, progress bar, and step indicator.
 */
export function OnboardingHeader({
  currentStep,
  totalSteps = 7,
  showBack = true,
  backHref,
  onBack,
}: OnboardingHeaderProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="space-y-4 mb-6">
      {/* Top row: Back button */}
      <div className="h-10 flex items-center">
        {showBack && <BackButton href={backHref} onClick={onBack} />}
      </div>

      {/* Progress bar */}
      <ProgressBar progress={progress} />

      {/* Step indicator */}
      <p className="text-sm text-[var(--color-charcoal)]/60 text-center">
        Step {currentStep} of {totalSteps}
      </p>
    </div>
  );
}
