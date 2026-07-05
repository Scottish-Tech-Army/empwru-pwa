"use client";

interface WizardHeaderProps {
  title: string;
}

/**
 * Reusable header for wizard flows.
 * Title left-aligned to match other tab/wizard headings.
 */
export function WizardHeader({ title }: WizardHeaderProps) {
  return (
    <div className="pt-6 pb-4">
      <div className="max-w-5xl mx-auto px-6 flex items-center justify-center">
        <p className="text-2xl text-[var(--color-charcoal)]">
          {title}
        </p>
      </div>
    </div>
  );
}
