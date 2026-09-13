"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Smile, Shield, Sprout, ChevronUp, ChevronDown, Minus, type LucideIcon } from "lucide-react";
import type { BaselineHistoryEntry } from "@/lib/baseline";
import { BASELINE_METRICS } from "@/lib/baseline-insights";

const SCALE_MIN = 1;
const SCALE_MAX = 5;

const ICONS: Record<string, LucideIcon> = {
  energyLevel: Heart,
  situationSatisfaction: Smile,
  confidence: Shield,
  futureClarity: Sprout,
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// Maps a 1-5 score to an x position within a 0-200 viewBox, leaving room
// at both ends for the dot radius and its value label.
function scaleX(value: number): number {
  const clamped = Math.min(SCALE_MAX, Math.max(SCALE_MIN, value));
  return 16 + ((clamped - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * (200 - 32);
}

function DumbbellRow({
  label,
  Icon,
  start,
  now,
}: {
  label: string;
  Icon: LucideIcon;
  start: number;
  now: number;
}) {
  const startX = scaleX(start);
  const nowX = scaleX(now);
  const delta = Math.round(now - start);

  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-brand-primary" />
      </div>

      <div className="w-24 shrink-0 text-sm text-[var(--color-charcoal)] font-medium">{label}</div>

      <svg viewBox="0 0 200 28" className="flex-1 h-7" preserveAspectRatio="none" role="img" aria-label={`${label}: started at ${start}, now ${now}, out of 5`}>
        {/* Track */}
        <line x1={16} y1={14} x2={184} y2={14} stroke="#e1e0d9" strokeWidth={1} />
        {/* Connector */}
        <line x1={startX} y1={14} x2={nowX} y2={14} stroke="#c3c2b7" strokeWidth={2} strokeLinecap="round" />
        {/* Start dot */}
        <circle cx={startX} cy={14} r={5} fill="var(--color-magenta)" fillOpacity={0.35} stroke="white" strokeWidth={2} />
        {/* Now dot */}
        <circle cx={nowX} cy={14} r={5} fill="var(--color-magenta)" stroke="white" strokeWidth={2} />
      </svg>

      <div className="w-10 shrink-0 text-right text-xs text-text-muted tabular-nums">
        {start}→{now}
      </div>

      <div
        className={`w-16 shrink-0 flex items-center justify-end gap-0.5 text-xs font-semibold ${
          delta > 0 ? "text-[#0ca30c]" : delta < 0 ? "text-[#ec835a]" : "text-text-muted"
        }`}
      >
        {delta > 0 ? <ChevronUp className="w-3 h-3" /> : delta < 0 ? <ChevronDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
        {delta === 0 ? "Same" : `${delta > 0 ? "+" : ""}${delta}`}
      </div>
    </div>
  );
}

export function BaselineComparisonCard({ history }: { history: BaselineHistoryEntry[] }) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);

  if (history.length === 0) return null;

  if (history.length === 1) {
    return (
      <section className="mb-6">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <p className="text-[var(--color-charcoal)] font-semibold text-lg mb-1">Where you started</p>
          <p className="text-text-muted text-sm mb-4">
            Completed on {formatDate(history[0].completedAt)}. Retake your baseline questions after a few weeks
            to see how far you&apos;ve come.
          </p>
          <button
            onClick={() => router.push("/onboarding/baseline")}
            className="py-2.5 px-4 bg-brand-primary text-white rounded-2xl text-sm font-semibold hover:bg-brand-primary/90 transition"
          >
            Retake baseline questions
          </button>
        </div>
      </section>
    );
  }

  const start = history[0];
  const now = history[history.length - 1];

  return (
    <section className="mb-6">
      <div
        className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="flex items-center justify-between mb-1">
          <p className="text-[var(--color-charcoal)] font-semibold text-lg">Where you started vs. now</p>
        </div>
        <p className="text-text-muted text-sm mb-5">
          {formatDate(start.completedAt)} → {formatDate(now.completedAt)}
          {hovered && history.length > 2 ? ` · ${history.length} check-ins recorded` : ""}
        </p>

        <div className="space-y-4">
          {BASELINE_METRICS.map(({ key, label }) => {
            const startValue = start.responses[key];
            const nowValue = now.responses[key];
            if (typeof startValue !== "number" || typeof nowValue !== "number") return null;

            return <DumbbellRow key={key} label={label} Icon={ICONS[key] ?? Heart} start={startValue} now={nowValue} />;
          })}
        </div>

        <div className="mt-5 pt-4 border-t border-gray-100 flex items-center gap-4 text-xs text-text-subtle">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "var(--color-magenta)", opacity: 0.35 }} />
            Started
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "var(--color-magenta)" }} />
            Now
          </span>
        </div>
      </div>
    </section>
  );
}
