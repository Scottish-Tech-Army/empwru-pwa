"use client";

import { ReactNode, useEffect, useRef } from "react";
import { LucideIcon } from "lucide-react";
import confetti from "canvas-confetti";
import { PrimaryButton } from "./PrimaryButton";

interface CelebrationScreenProps {
  /** When true, fires confetti and enables icon bounce animation */
  progress?: number;
  /** Optional Lucide icon to display in the celebration badge */
  icon?: LucideIcon;
  /** Main headline text */
  title: string;
  /** Optional subtitle text */
  subtitle?: string;
  /** Optional custom content (e.g., stats, milestones) */
  children?: ReactNode;
  /** CTA button label */
  buttonText: string;
  /** CTA button action */
  onButtonClick: () => void;
}

/**
 * Full-screen celebration component for completion states.
 * Used for onboarding completion, check-in completion, etc.
 * Features bouncing icon and confetti animation.
 */
export function CelebrationScreen({
  progress,
  icon: Icon,
  title,
  subtitle,
  children,
  buttonText,
  onButtonClick,
}: CelebrationScreenProps) {
  const hasCompletedRef = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fire confetti on mount when progress is set
  useEffect(() => {
    if (progress === undefined) return;
    if (hasCompletedRef.current) return;
    
    // Small delay to ensure canvas is ready
    const timer = setTimeout(() => {
      if (!canvasRef.current) return;
      hasCompletedRef.current = true;
      
      const myConfetti = confetti.create(canvasRef.current, {
        resize: true,
        useWorker: true,
      });
      
      // Fire from left
      myConfetti({
        particleCount: 30,
        angle: 60,
        spread: 70,
        origin: { x: 0, y: 0.5 },
        colors: ["#bc03b9", "#ffffff", "#efebee"],
      });
      // Fire from right
      myConfetti({
        particleCount: 30,
        angle: 120,
        spread: 70,
        origin: { x: 1, y: 0.5 },
        colors: ["#bc03b9", "#ffffff", "#efebee"],
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <div className="min-h-dvh bg-brand-primary flex flex-col">
      {/* Main content - centered */}
      <div 
        ref={contentRef}
        className="flex-1 flex flex-col items-center justify-center px-6 text-center relative"
      >
        {/* Scoped confetti canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* Icon badge with optional bounce animation */}
        {Icon && (
          <div className={`w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-8 relative z-10 ${progress !== undefined ? 'animate-bounce' : ''}`}>
            <Icon className="w-10 h-10 text-white" />
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl text-white mb-6 relative z-10">{title}</h1>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-white/90 mb-8 max-w-xs relative z-10">{subtitle}</p>
        )}

        {/* Custom content slot */}
        {children && <div className="mt-4 relative z-10">{children}</div>}
      </div>

      {/* Sticky bottom CTA */}
      <div className="sticky bottom-0 p-6 pb-safe">
        <div className="max-w-5xl mx-auto w-full">
          <PrimaryButton variant="white" onClick={onButtonClick}>
            {buttonText}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
