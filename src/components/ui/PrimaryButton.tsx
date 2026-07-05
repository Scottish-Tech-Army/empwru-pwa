import { ButtonHTMLAttributes, ReactNode } from "react";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  /** Show loading spinner */
  loading?: boolean;
  /** Full width button (default: true) */
  fullWidth?: boolean;
  /** Button variant: 'default' (magenta), 'white' (for gradients), or 'secondary' (outlined) */
  variant?: "default" | "white" | "secondary";
}

/**
 * Primary CTA button.
 * 56px height, pill shape, scale animation on press.
 *
 * @example
 * <PrimaryButton onClick={handleClick}>
 *   Get started
 * </PrimaryButton>
 *
 * // On gradient backgrounds:
 * <PrimaryButton variant="white" onClick={handleClick}>
 *   Get started
 * </PrimaryButton>
 */
export function PrimaryButton({
  children,
  loading = false,
  fullWidth = true,
  variant = "default",
  disabled,
  className = "",
  ...props
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  const variantStyles = {
    default: "bg-[var(--color-magenta)] text-white",
    white: "bg-white text-[var(--color-magenta)]",
    secondary: "bg-transparent border-2 border-[var(--color-magenta)] text-[var(--color-magenta)]",
  }[variant];

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={`
        ${fullWidth ? "w-full" : ""}
        h-14 px-6
        ${variantStyles}
        text-lg uppercase tracking-wide
        rounded-full
        transition-all duration-150
        hover:brightness-110 hover:scale-[1.02]
        active:scale-[0.98]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        focus-ring
        ${className}
      `}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <LoadingSpinner />
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
