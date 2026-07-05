"use client";

import React, { useState, useRef, useEffect } from "react";
import { Info } from "lucide-react";

interface TooltipProps {
  content: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

/**
 * A lightweight Tooltip component that shows content on hover (desktop) 
 * or toggle on tap (mobile).
 */
export function Tooltip({ content, children, className = "" }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Close tooltip when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsVisible(false);
      }
    }

    if (isVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isVisible]);

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      ref={tooltipRef}
    >
      <button
        type="button"
        onClick={() => setIsVisible(!isVisible)}
        className="focus:outline-none focus-ring rounded-full"
        aria-label="More information"
      >
        {children || (
          <span className="flex items-center justify-center w-5 h-5 bg-[var(--color-purple)] rounded">
            <Info className="w-3 h-3 text-white" />
          </span>
        )}
      </button>

      {isVisible && (
        <div 
          className="absolute z-[100] bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-4 
                     bg-white border border-slate-100 rounded-2xl shadow-xl animate-fade-in
                     text-sm text-[var(--color-charcoal)] font-normal leading-relaxed text-left"
        >
          {content}
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-white" />
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[9px] border-transparent border-t-slate-100 -z-10" />
        </div>
      )}
    </div>
  );
}
