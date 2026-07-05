import React from "react";

interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  isLoading?: boolean;
}

export const AppButton = ({
  children,
  variant = "primary",
  isLoading = false,
  className = "",
  disabled,
  ...props
}: AppButtonProps) => {
  const baseStyles =
    "w-full py-3.5 px-6 rounded-full font-semibold transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]";

  const variants = {
    primary:
      "bg-[var(--color-magenta)] text-white hover:opacity-90",
    secondary:
      "bg-white border-2 border-[var(--color-magenta)] text-[var(--color-magenta)] hover:bg-[var(--color-magenta)]/5",
    danger:
      "bg-white border border-red-200 text-red-600 hover:bg-red-50",
    ghost: 
      "bg-transparent text-[var(--color-charcoal)] hover:bg-black/5",
  };

  const disabledStyles = "opacity-50 cursor-not-allowed active:scale-100";

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${
        disabled || isLoading ? disabledStyles : ""
      } ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <React.Fragment>
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Loading...</span>
        </React.Fragment>
      ) : (
        children
      )}
    </button>
  );
};
