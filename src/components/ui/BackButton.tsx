"use client";

import { useRouter } from "next/navigation";

interface BackButtonProps {
  /** Override default back behavior with custom path */
  href?: string;
  /** Custom onClick handler (takes precedence over href) */
  onClick?: () => void;
  /** Accessible label for the button */
  label?: string;
}

/**
 * Back navigation button for onboarding flow.
 * Uses router.back() by default, or navigates to specified href, or calls onClick.
 */
export function BackButton({ href, onClick, label = "Go back" }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <button
      onClick={handleClick}
      aria-label={label}
      className="p-2 -ml-2 text-[var(--color-charcoal)] hover:bg-[var(--color-warm-ivory)] rounded-full transition-colors focus-ring"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  );
}
