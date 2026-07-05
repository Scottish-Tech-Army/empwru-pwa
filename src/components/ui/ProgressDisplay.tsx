"use client";

import { useEffect, useState, useRef } from "react";

interface ProgressDisplayProps {
  /** Target progress percentage (0-100) */
  progress: number;
  /** Label text shown below the percentage */
  label?: string;
  /** Whether to animate the count-up */
  animate?: boolean;
  /** Animation duration in ms */
  animationDuration?: number;
}

/**
 * Large animated progress percentage display.
 * Shows a prominent percentage that counts up from 0.
 */
export function ProgressDisplay({
  progress,
  label,
  animate = true,
  animationDuration = 800,
}: ProgressDisplayProps) {
  const [displayValue, setDisplayValue] = useState(progress);
  const animationRef = useRef<number | null>(null);
  const previousValueRef = useRef(progress);

  useEffect(() => {
    // Skip animation if disabled - just update ref for next animation start point
    if (!animate) {
      previousValueRef.current = progress;
      return;
    }

    const startTime = performance.now();
    const startValue = previousValueRef.current;

    const animateValue = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progressRatio = Math.min(elapsed / animationDuration, 1);
      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progressRatio, 3);
      setDisplayValue(Math.round(startValue + eased * (progress - startValue)));

      if (progressRatio < 1) {
        animationRef.current = requestAnimationFrame(animateValue);
      } else {
        previousValueRef.current = progress;
      }
    };

    animationRef.current = requestAnimationFrame(animateValue);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [progress, animate, animationDuration]);

  return (
    <div className="text-center py-6">
      <div className="text-6xl font-light text-brand-primary">
        {displayValue}%
      </div>
      {label && (
        <p className="text-sm text-text-muted mt-2">{label}</p>
      )}
    </div>
  );
}
