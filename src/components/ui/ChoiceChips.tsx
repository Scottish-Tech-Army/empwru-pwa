"use client";

interface ChoiceOption {
  value: string;
  label: string;
}

interface ChoiceChipsProps {
  /** Available options */
  options: ChoiceOption[];
  /** Currently selected value (or null if none) */
  value: string | null;
  /** Callback when selection changes */
  onChange: (value: string) => void;
  /** Optional additional CSS classes */
  className?: string;
}

/**
 * Horizontal chip selection for Yes/No/Unsure or status options.
 * Responsive: compact on mobile, full size on iPad+.
 */
export function ChoiceChips({ options, value, onChange, className }: ChoiceChipsProps) {
  return (
    <div className={`flex flex-wrap gap-2 md:gap-3 justify-center ${className ?? ""}`}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`
            px-4 py-2.5 xs:px-5 md:px-6 md:py-3 text-xs xs:text-sm md:text-base rounded-full font-medium
            min-h-[44px] flex items-center justify-center
            transition-all duration-150
            focus-ring
            ${
              value === option.value
                ? "bg-[var(--color-magenta)] text-white"
                : "bg-[var(--color-warm-ivory)] text-[var(--color-charcoal)] hover:bg-[var(--color-magenta)]/10"
            }
          `}
          aria-pressed={value === option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
