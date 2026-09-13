"use client";

import { Heart, Smile, Shield, Sprout, type LucideIcon } from "lucide-react";
import type { MetricDelta } from "@/lib/baseline-insights";

const ICONS: Record<string, LucideIcon> = {
  energyLevel: Heart,
  situationSatisfaction: Smile,
  confidence: Shield,
  futureClarity: Sprout,
};

const SCALE_MAX = 5;
const RADIUS = 44;
const CENTER = 60;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function ringDash(value: number): number {
  return (value / SCALE_MAX) * CIRCUMFERENCE;
}

function markerPosition(value: number): { x: number; y: number } {
  const angle = (value / SCALE_MAX) * 2 * Math.PI;
  return {
    x: CENTER + RADIUS * Math.sin(angle),
    y: CENTER - RADIUS * Math.cos(angle),
  };
}

function Ring({ label, delta }: { label: string; delta: MetricDelta }) {
  const Icon = ICONS[delta.key] ?? Heart;
  const dash = ringDash(delta.now);
  const marker = markerPosition(delta.start);
  const isFull = delta.now >= SCALE_MAX;

  return (
    <div className="flex flex-col items-center gap-1.5 py-3">
      <svg width="112" height="112" viewBox="0 0 120 120" role="img" aria-label={`${label}: started at ${delta.start}, now ${delta.now}, out of 5`}>
        <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="#f1f1f1" strokeWidth={10} />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="var(--color-magenta)"
          strokeWidth={10}
          strokeLinecap={isFull ? "butt" : "round"}
          strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
          transform={`rotate(-90 ${CENTER} ${CENTER})`}
        />
        <circle cx={marker.x} cy={marker.y} r={4.5} fill="white" stroke="var(--color-deep-violet)" strokeWidth={2.5} />
        <text x={CENTER} y={CENTER + 6} textAnchor="middle" fontSize={24} fill="#030303">
          {delta.now}
        </text>
      </svg>
      <div className="flex items-center gap-1.5 text-sm text-[var(--color-charcoal)]">
        <Icon className="w-3.5 h-3.5 text-brand-primary" />
        {label}
      </div>
      <div className={`text-xs ${delta.delta > 0 ? "text-[#0ca30c]" : delta.delta < 0 ? "text-[#ec835a]" : "text-text-muted"}`}>
        {delta.delta === 0 ? "No change" : `${delta.delta > 0 ? "+" : ""}${delta.delta} since start`}
      </div>
    </div>
  );
}

export function BaselineRingsGrid({ deltas }: { deltas: MetricDelta[] }) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {deltas.map((d) => (
          <Ring key={d.key} label={d.label} delta={d} />
        ))}
      </div>
      <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-text-subtle">
        <span className="w-2 h-2 rounded-full border-2 border-[var(--color-deep-violet)] bg-white inline-block" />
        Marker = where you started
      </div>
    </div>
  );
}
