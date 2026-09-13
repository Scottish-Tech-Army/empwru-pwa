"use client";

import { useMemo, useRef, useState } from "react";
import { Zap } from "lucide-react";
import type { CheckIn } from "@/lib/storage";

const VIEW_W = 600;
const VIEW_H = 200;
const PAD_LEFT = 32;
const PAD_RIGHT = 16;
const PLOT_TOP = 16;
const PLOT_BOTTOM = 150;
const SCALE_MIN = 1;
const SCALE_MAX = 5;
const MAX_POINTS = 12;

function scaleX(index: number, count: number): number {
  if (count <= 1) return (PAD_LEFT + (VIEW_W - PAD_RIGHT)) / 2;
  return PAD_LEFT + (index / (count - 1)) * (VIEW_W - PAD_RIGHT - PAD_LEFT);
}

function scaleY(value: number): number {
  const clamped = Math.min(SCALE_MAX, Math.max(SCALE_MIN, value));
  return PLOT_BOTTOM - ((clamped - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * (PLOT_BOTTOM - PLOT_TOP);
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function EnergyTrendCard({ checkIns }: { checkIns: CheckIn[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const points = useMemo(() => {
    return [...checkIns]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(-MAX_POINTS);
  }, [checkIns]);

  if (points.length < 2) {
    return (
      <section className="mb-6">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-5 h-5 text-brand-primary" />
            <p className="text-[var(--color-charcoal)] font-semibold text-lg">Energy over time</p>
          </div>
          <p className="text-text-muted text-sm">
            Check in for a couple more weeks to start seeing your energy trend here.
          </p>
        </div>
      </section>
    );
  }

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${scaleX(i, points.length)} ${scaleY(p.energyLevel)}`)
    .join(" ");

  const areaPath = `${linePath} L ${scaleX(points.length - 1, points.length)} ${scaleY(SCALE_MIN)} L ${scaleX(0, points.length)} ${scaleY(SCALE_MIN)} Z`;

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const relativeX = ((event.clientX - rect.left) / rect.width) * VIEW_W;

    let nearest = 0;
    let nearestDist = Infinity;
    points.forEach((_, i) => {
      const dist = Math.abs(scaleX(i, points.length) - relativeX);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });

    setHoverIndex(nearest);
    setTooltipPos({
      x: (scaleX(nearest, points.length) / VIEW_W) * rect.width,
      y: (scaleY(points[nearest].energyLevel) / VIEW_H) * rect.height,
    });
  };

  const first = points[0];
  const last = points[points.length - 1];
  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <section className="mb-6">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-5 h-5 text-brand-primary" />
          <p className="text-[var(--color-charcoal)] font-semibold text-lg">Energy over time</p>
        </div>
        <p className="text-text-muted text-sm mb-4">Your last {points.length} weekly check-ins</p>

        <div ref={containerRef} className="relative">
          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className="w-full h-40"
            preserveAspectRatio="none"
            role="img"
            aria-label={`Energy level across your last ${points.length} check-ins, from ${first.energyLevel} to ${last.energyLevel} out of 5`}
            onPointerMove={handlePointerMove}
            onPointerLeave={() => {
              setHoverIndex(null);
              setTooltipPos(null);
            }}
          >
            {/* Gridlines */}
            {[1, 3, 5].map((tick) => (
              <g key={tick}>
                <line x1={PAD_LEFT} y1={scaleY(tick)} x2={VIEW_W - PAD_RIGHT} y2={scaleY(tick)} stroke="#e1e0d9" strokeWidth={1} />
                <text x={PAD_LEFT - 8} y={scaleY(tick) + 4} textAnchor="end" fontSize={11} fill="#898781">
                  {tick}
                </text>
              </g>
            ))}

            {/* Area wash */}
            <path d={areaPath} fill="var(--color-deep-violet)" fillOpacity={0.1} stroke="none" />

            {/* Line */}
            <path d={linePath} fill="none" stroke="var(--color-deep-violet)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

            {/* Crosshair */}
            {hoverIndex !== null && (
              <line
                x1={scaleX(hoverIndex, points.length)}
                y1={PLOT_TOP}
                x2={scaleX(hoverIndex, points.length)}
                y2={PLOT_BOTTOM}
                stroke="#c3c2b7"
                strokeWidth={1}
              />
            )}

            {/* Points */}
            {points.map((p, i) => (
              <circle
                key={p.id}
                cx={scaleX(i, points.length)}
                cy={scaleY(p.energyLevel)}
                r={hoverIndex === i ? 6 : 4}
                fill="var(--color-deep-violet)"
                stroke="white"
                strokeWidth={2}
              />
            ))}

            {/* Endpoint labels */}
            <text x={scaleX(0, points.length)} y={scaleY(first.energyLevel) - 12} textAnchor="start" fontSize={12} fontWeight={600} fill="var(--color-charcoal)">
              {first.energyLevel}
            </text>
            <text
              x={scaleX(points.length - 1, points.length)}
              y={scaleY(last.energyLevel) - 12}
              textAnchor="end"
              fontSize={12}
              fontWeight={600}
              fill="var(--color-charcoal)"
            >
              {last.energyLevel}
            </text>

            {/* x-axis endpoint dates */}
            <text x={scaleX(0, points.length)} y={PLOT_BOTTOM + 20} textAnchor="start" fontSize={11} fill="#898781">
              {formatShortDate(first.createdAt)}
            </text>
            <text x={scaleX(points.length - 1, points.length)} y={PLOT_BOTTOM + 20} textAnchor="end" fontSize={11} fill="#898781">
              {formatShortDate(last.createdAt)}
            </text>
          </svg>

          {hovered && tooltipPos && (
            <div
              className="absolute pointer-events-none bg-[var(--color-charcoal)] text-white text-xs rounded-lg px-2.5 py-1.5 shadow-lg whitespace-nowrap -translate-x-1/2 -translate-y-full"
              style={{ left: tooltipPos.x, top: tooltipPos.y - 8 }}
            >
              <div className="font-semibold">{hovered.energyLevel}/5 energy</div>
              <div className="text-white/70">{formatShortDate(hovered.createdAt)}</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
