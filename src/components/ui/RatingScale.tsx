"use client";

interface RatingScaleProps {
  /** Current selected value (1-5, or null if not selected) */
  value: number | null;
  /** Callback when value changes */
  onChange: (value: number) => void;
  /** Label for low end of scale */
  lowLabel?: string;
  /** Label for high end of scale */
  highLabel?: string;
  /** Question text for screen reader context */
  question?: string;
}

// Labels for each rating level (for screen readers and tooltips)
const RATING_LABELS = [
  "Not at all",
  "A little",
  "Somewhat",
  "Quite a bit",
  "Very much",
];

/**
 * 5-point rating scale with responsive touch targets.
 * Compact on mobile, full size on iPad+.
 * Improved for accessibility:
 * - 40px+ touch targets on mobile, 56px+ on tablet
 * - Descriptive aria-labels for screen readers
 * - Single row layout for easier scanning
 * - Clear visual selection state
 */
export function RatingScale({
  value,
  onChange,
  lowLabel = "Not at all",
  highLabel = "Very much",
  question,
}: RatingScaleProps) {
  return (
    <div 
      className="space-y-2 md:space-y-4"
      role="radiogroup"
      aria-label={question || "Rating scale from 1 to 5"}
    >
      {/* Centered Rating Control Container */}
      <div className="max-w-sm mx-auto">
        {/* Rating buttons - responsive sizing with 44px minimum touch targets */}
        <div className="flex justify-center gap-1.5 xs:gap-2 md:gap-3 mb-2 md:mb-4">
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              onClick={() => onChange(num)}
              role="radio"
              aria-checked={value === num}
              aria-label={`${num} out of 5: ${RATING_LABELS[num - 1]}`}
              className={`
                w-11 h-11 xs:w-12 xs:h-12 md:w-14 md:h-14 rounded-lg font-semibold text-base md:text-lg
                transition-all duration-150
                focus-ring
                ${
                  value === num
                    ? "bg-brand-primary text-white scale-105 shadow-md"
                    : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                }
              `}
            >
              {num}
            </button>
          ))}
        </div>

        {/* Scale labels - uppercase, consistent styling */}
        <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      </div>
    </div>
  );
}
