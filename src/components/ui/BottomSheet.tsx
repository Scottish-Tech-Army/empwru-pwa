"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
}: BottomSheetProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animateIn, setAnimateIn] = useState(false);

  if (isOpen && !shouldRender) {
    setShouldRender(true);
  }

  if (!isOpen && animateIn) {
    setAnimateIn(false);
  }

  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure the component is in DOM before starting transition
      const timer = setTimeout(() => setAnimateIn(true), 10);
      document.body.style.overflow = "hidden";
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setShouldRender(false);
        document.body.style.overflow = "unset";
      }, 300); // Match transition duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center p-3 transition-opacity duration-300 ease-in-out ${
        animateIn ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[var(--color-charcoal)]/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet Content */}
      <div
        className={`relative w-full max-w-md bg-white rounded-[2rem] px-8 pt-4 pb-6 shadow-2xl transition-transform duration-300 will-change-transform flex flex-col max-h-[90vh] ${
          animateIn ? "translate-y-0" : "translate-y-[120%]"
        }`}
        style={{
          transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {/* Drag handle decoration */}
        <div className="w-12 h-1.5 bg-brand-surface rounded-full mx-auto mb-2 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-[var(--color-charcoal)]">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 bg-brand-surface rounded-full text-text-muted hover:text-brand-primary transition-colors active:scale-95"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto pb-2 custom-scrollbar focus-ring">
          {children}
        </div>
      </div>
    </div>
  );
}
