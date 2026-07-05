"use client";

import { ReactNode } from "react";

interface QuoteCardProps {
  children: ReactNode;
  label?: string;
  variant?: "quote" | "ripple";
  className?: string;
}

/**
 * QuoteCard - A prominent card for coaching messages and inspirational text.
 * 
 * Styled based on the Daily Inspiration pattern.
 */
export function QuoteCard({ 
  children, 
  label = "Coaching", 
  variant = "quote",
  className = "" 
}: QuoteCardProps) {
  return (
    <section className={`flex flex-col h-full ${className}`}>
      <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-100 shadow-[0_0_15px_rgba(0,0,0,0.08)] flex flex-col justify-between relative overflow-hidden h-full">
        <div className="relative z-10">
          <p className="text-xs font-bold text-brand-primary uppercase tracking-widest mb-6">
            {label}
          </p>
          
          {variant === "quote" ? (
            <svg
              className="h-10 w-10 text-brand-primary/10 absolute -top-2 -left-4 -z-10"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.570 9-10.609l.996 2.151c-2.433.917-4.001 3.638-4.001 5.849h4v10h-10z" />
            </svg>
          ) : (
            <svg 
              className="absolute -top-5 -left-4 w-12 h-12 text-brand-primary/10 -z-10" 
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            >
              <path d="M0 8c4-4 8 4 12 0s8-4 12 0" />
              <path d="M0 15c4-4 8 4 12 0s8-4 12 0" />
            </svg>
          )}

          <blockquote className="text-xl md:text-2xl font-sans font-medium text-[var(--color-charcoal)] leading-snug">
            {children}
          </blockquote>
        </div>
      </div>
    </section>
  );
}
