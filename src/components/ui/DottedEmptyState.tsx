"use client";

import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface DottedEmptyStateProps {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  className?: string;
}

export function DottedEmptyState({
  href,
  title,
  description,
  icon: Icon,
  className = "",
}: DottedEmptyStateProps) {
  return (
    <Link href={href} className={`flex-1 flex flex-col outline-none group ${className}`}>
      <div className="flex-1 border-2 border-dashed border-warm-ivory rounded-[2.5rem] p-12 text-center hover:border-brand-primary hover:bg-brand-primary/5 transition-all duration-300 flex flex-col items-center justify-center h-full">
        <div className="bg-brand-primary text-white p-3 rounded-full mb-6 shadow-brand-primary/20 group-hover:scale-110 transition-transform">
          <Icon className="w-6 h-6 transition-transform duration-300 group-hover:rotate-90" />
        </div>
        <h2 className="text-xl font-light font-montserrat text-brand-primary mb-2 tracking-tight">
          {title}
        </h2>
        <p className="text-text-muted max-w-sm leading-relaxed">
          {description}
        </p>
      </div>
    </Link>
  );
}
