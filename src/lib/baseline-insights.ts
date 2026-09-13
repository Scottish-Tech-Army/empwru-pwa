import type { BaselineHistoryEntry } from "@/lib/baseline";
import type { BaselineResponse } from "@/lib/storage";

export const BASELINE_METRICS: { key: keyof BaselineResponse; label: string }[] = [
  { key: "energyLevel", label: "Wellbeing" },
  { key: "situationSatisfaction", label: "Satisfaction" },
  { key: "confidence", label: "Confidence" },
  { key: "futureClarity", label: "Future Clarity" },
];

export interface MetricDelta {
  key: keyof BaselineResponse;
  label: string;
  start: number;
  now: number;
  delta: number;
}

export function getMetricDeltas(start: BaselineResponse, now: BaselineResponse): MetricDelta[] {
  return BASELINE_METRICS.map(({ key, label }) => ({ key, label, start: start[key] as number, now: now[key] as number, delta: (now[key] as number) - (start[key] as number) }))
    .filter((d) => typeof d.start === "number" && typeof d.now === "number");
}

function cap(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** A run of plain text, or a metric mention colored by whether it rose or fell. */
export interface InsightSegment {
  text: string;
  tone?: "riser" | "decliner";
}

/**
 * Renders a list of metric labels as "A", "A and B", or "A, B and C"
 * segments — always starts a new sentence, so the first label is
 * capitalized.
 */
function labelSegments(deltas: MetricDelta[], tone: "riser" | "decliner"): InsightSegment[] {
  const segments: InsightSegment[] = [];
  deltas.forEach((d, i) => {
    if (i > 0) {
      segments.push({ text: i === deltas.length - 1 ? " and " : ", " });
    }
    const label = d.label.toLowerCase();
    segments.push({ text: i === 0 ? cap(label) : label, tone });
  });
  return segments;
}

export interface BaselineInsight {
  biggestGrowth: MetricDelta | null;
  segments: InsightSegment[];
}

/**
 * A plain-English summary of how a user's baseline metrics have moved
 * between their first completion and their latest one, as a sequence of
 * text/colored-mention segments so the UI can render each metric name in
 * its riser/decliner color inline with the sentence.
 */
export function generateBaselineInsight(history: BaselineHistoryEntry[]): BaselineInsight | null {
  if (history.length < 2) return null;

  const deltas = getMetricDeltas(history[0].responses, history[history.length - 1].responses);
  if (deltas.length === 0) return null;

  const risers = deltas.filter((d) => d.delta > 0).sort((a, b) => b.delta - a.delta);
  const decliners = deltas.filter((d) => d.delta < 0).sort((a, b) => a.delta - b.delta);

  if (risers.length === 0 && decliners.length === 0) {
    return {
      biggestGrowth: null,
      segments: [{ text: "Nothing's changed since you started — check back in after your next About U checkin." }],
    };
  }

  const segments: InsightSegment[] = [];

  if (risers.length > 0) {
    const [biggest, ...rest] = risers;
    segments.push({ text: "Since you started, your " });
    segments.push({ text: biggest.label.toLowerCase(), tone: "riser" });
    segments.push({ text: ` has grown the most — up ${biggest.delta} point${biggest.delta === 1 ? "" : "s"}.` });

    if (rest.length > 0) {
      segments.push({ text: " " });
      segments.push(...labelSegments(rest, "riser"));
      segments.push({ text: " climbed too." });
    }
  }

  if (decliners.length > 0) {
    segments.push({ text: risers.length > 0 ? " " : "Since you started, " });
    segments.push(...labelSegments(decliners, "decliner"));
    segments.push({
      text:
        risers.length > 0
          ? " dipped a little on your last check-in — worth a look next time you retake."
          : " dipped since you started — worth a look next time you retake.",
    });
  }

  return { biggestGrowth: risers[0] ?? null, segments };
}
