import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Users,
  CalendarCheck,
  ClipboardCheck,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  HeartHandshake,
  Heart,
  UserPlus,
} from "lucide-react";
import { getCurrentUser, hasAnyRole } from "@/lib/roles";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getFacilitatorOverview, type EngagementStatus, type RosterEntry } from "@/lib/facilitator-data";
import FacilitatorSidebar from "./FacilitatorSidebar";

export const dynamic = "force-dynamic";

const STATUS_META: Record<
  EngagementStatus,
  { label: string; text: string; bg: string }
> = {
  thriving: { label: "Thriving", text: "text-[#1e9e6d]", bg: "bg-[#e7f6ef]" },
  steady: { label: "Steady", text: "text-deep-violet", bg: "bg-deep-violet/10" },
  "needs-nudge": { label: "Needs a nudge", text: "text-[#c97c12]", bg: "bg-[#fbf0dc]" },
  "gone-quiet": { label: "Gone quiet", text: "text-[#d23b3b]", bg: "bg-[#fcebec]" },
};

function lastActiveLabel(entry: RosterEntry): string {
  if (entry.daysSinceActive === null) return "Never checked in";
  if (entry.daysSinceActive === 0) return "Today";
  if (entry.daysSinceActive === 1) return "Yesterday";
  return `${entry.daysSinceActive} days ago`;
}

function StatusChip({ status }: { status: EngagementStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${meta.bg} ${meta.text}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {meta.label}
    </span>
  );
}

export default async function FacilitatorPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || !hasAnyRole(currentUser, ["admin", "facilitator"])) {
    redirect("/");
  }

  const supabase = await createSupabaseServerClient();
  const overview = await getFacilitatorOverview(supabase);
  const checkedInRate = overview.totalAlumni
    ? Math.round((overview.activeThisWeek / overview.totalAlumni) * 100)
    : 0;

  const missedThisWeek = overview.totalAlumni - overview.activeThisWeek;
  const ringRadius = 38;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const completedArc = overview.totalAlumni
    ? (overview.activeThisWeek / overview.totalAlumni) * ringCircumference
    : 0;

  return (
    <div className="min-h-screen bg-bg-subtle">
      <header className="flex items-center justify-between border-b border-deep-violet/10 bg-white px-5 py-4 sm:px-8">
        <div className="flex items-center gap-1 sm:gap-2">
          <FacilitatorSidebar email={currentUser.email} />
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted hover:bg-warm-ivory hover:text-deep-violet transition-colors"
            aria-label="Back to empwrU"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="ml-1">
            <h1 className="text-lg text-deep-violet">Facilitator view</h1>
            <p className="text-xs text-text-muted">Signed in as {currentUser.email}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        {overview.dataWarnings.length > 0 && (
          <div className="mb-6 flex items-start gap-2 rounded-2xl border border-[#c97c12]/20 bg-[#fbf0dc] px-4 py-3 text-sm text-[#c97c12]">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{overview.dataWarnings.join(" ")}</span>
          </div>
        )}

        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-deep-violet/10 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-xs text-text-muted">
              <Users className="h-3.5 w-3.5" />
              Total alumni
            </div>
            <div className="text-3xl tabular-nums text-deep-violet">{overview.totalAlumni}</div>
          </div>

          <div className="rounded-2xl border border-deep-violet/10 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-xs text-text-muted">
              <CalendarCheck className="h-3.5 w-3.5" />
              Checked in this week
            </div>
            <div className="text-3xl tabular-nums text-deep-violet">
              {overview.activeThisWeek}
              <span className="ml-2 text-base text-text-muted">{checkedInRate}%</span>
            </div>
          </div>

          <div className="rounded-2xl border border-deep-violet/10 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-xs text-text-muted">
              <ClipboardCheck className="h-3.5 w-3.5" />
              Baseline completed
            </div>
            <div className="text-3xl tabular-nums text-deep-violet">
              {overview.baselineCompletionRate}%
            </div>
          </div>
        </section>

        <section className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_260px]">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <HeartHandshake className="h-4 w-4 text-brand-primary" />
              <h2 className="text-sm text-text-muted">
                Needs encouragement
                <span className="ml-1.5 text-text-subtle">({overview.needsEncouragement.length})</span>
              </h2>
            </div>

            {overview.needsEncouragement.length === 0 ? (
              <div className="rounded-2xl border border-deep-violet/10 bg-white p-5 text-sm text-text-muted shadow-sm">
                Nobody needs a nudge right now — everyone&apos;s checked in within the last two weeks.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {overview.needsEncouragement.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-2xl border border-deep-violet/10 bg-white p-4 shadow-sm"
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm">{entry.name}</div>
                        <div className="truncate text-xs text-text-subtle">{entry.email}</div>
                      </div>
                      <StatusChip status={entry.status} />
                    </div>
                    <div className="mb-3 flex items-center gap-1.5 text-xs text-[#d23b3b]">
                      <Clock3 className="h-3 w-3" />
                      {lastActiveLabel(entry)}
                    </div>
                    <button
                      type="button"
                      className="flex w-full items-center justify-center gap-1.5 rounded-full bg-brand-primary px-3 py-2 text-xs text-white transition hover:brightness-110 active:scale-[0.98]"
                    >
                      <Heart className="h-3 w-3" />
                      Nudge
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-deep-violet/10 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm text-text-muted">This week&apos;s check-ins</h2>
            <div className="flex items-center gap-4">
              <svg width="92" height="92" viewBox="0 0 92 92" className="shrink-0">
                <circle cx="46" cy="46" r={ringRadius} fill="none" stroke="#f1f1f3" strokeWidth="12" />
                {overview.totalAlumni > 0 && (
                  <circle
                    cx="46"
                    cy="46"
                    r={ringRadius}
                    fill="none"
                    stroke="var(--color-deep-violet)"
                    strokeWidth="12"
                    strokeDasharray={`${completedArc} ${ringCircumference}`}
                    strokeLinecap="round"
                    transform="rotate(-90 46 46)"
                  />
                )}
                <text x="46" y="42" textAnchor="middle" fontSize="19" fill="var(--color-deep-violet)">
                  {checkedInRate}%
                </text>
                <text x="46" y="58" textAnchor="middle" fontSize="9" fill="rgba(3,3,3,.42)">
                  of {overview.totalAlumni}
                </text>
              </svg>
              <div className="flex flex-1 flex-col gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-text-muted">
                  <span className="h-2 w-2 shrink-0 rounded-sm bg-deep-violet" />
                  Checked in
                  <span className="ml-auto tabular-nums">{overview.activeThisWeek}</span>
                </div>
                <div className="flex items-center gap-1.5 text-text-muted">
                  <span className="h-2 w-2 shrink-0 rounded-sm bg-[#f1f1f3]" />
                  Missed
                  <span className="ml-auto tabular-nums">{missedThisWeek}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm text-text-muted">
              Alumni roster
              <span className="ml-1.5 text-text-subtle">({overview.roster.length})</span>
            </h2>
            <Link
              href="/facilitator/invite"
              className="flex items-center gap-1.5 rounded-full bg-brand-primary px-3.5 py-2 text-xs text-white transition hover:brightness-110 active:scale-[0.98]"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Invite participant
            </Link>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-deep-violet/10 bg-white shadow-sm">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-deep-violet/10 text-left text-xs uppercase tracking-wide text-text-subtle">
                  <th className="px-5 py-3 font-normal">Alumna</th>
                  <th className="px-5 py-3 font-normal">Status</th>
                  <th className="px-5 py-3 font-normal">Last active</th>
                  <th className="px-5 py-3 font-normal">6-week streak</th>
                  <th className="px-5 py-3 font-normal">Baseline</th>
                  <th className="px-5 py-3 font-normal">Active goals</th>
                </tr>
              </thead>
              <tbody>
                {overview.roster.map((entry) => (
                  <tr key={entry.id} className="border-b border-deep-violet/10 last:border-0 hover:bg-bg-card">
                    <td className="px-5 py-3">
                      <div>{entry.name}</div>
                      <div className="text-xs text-text-subtle">{entry.email}</div>
                    </td>
                    <td className="px-5 py-3">
                      <StatusChip status={entry.status} />
                    </td>
                    <td className="px-5 py-3 text-text-muted">{lastActiveLabel(entry)}</td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1">
                        {entry.weeklyStreak.map((checkedIn, i) => (
                          <span
                            key={i}
                            className={`h-4 w-1.5 rounded-sm ${
                              checkedIn ? "bg-deep-violet" : "bg-[#f1f1f3]"
                            }`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {entry.baselineCompleted ? (
                        <span className="inline-flex items-center gap-1 text-xs text-[#1e9e6d]">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Done
                        </span>
                      ) : (
                        <span className="text-xs text-text-subtle">Pending</span>
                      )}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-text-muted">{entry.activeGoals}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
