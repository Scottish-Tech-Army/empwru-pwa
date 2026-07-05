"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/ui/BottomNav";
import DailyQuote from "@/components/ui/DailyQuote";

import {
  getBaselineResponse,
  getCheckIns,
  getGoals,
  getLastCheckIn,
  getMomentumDays,
  getProgressLikes,
  toggleProgressLike,
  hasCheckedInThisWeek,
  CheckIn,
  Goal,
  GoalCategory,
  BaselineResponse,
} from "@/lib/storage";
import {
  Flame,
  Sparkles,
  Target,
  Zap,
  Trophy,
  BarChart3,
  X,
  Sprout,
  Smile,
  Shield,
  Heart,
  ChevronRight,
  Check,
  Lightbulb,
} from "lucide-react";

/**
 * Progress page - Visual progress across impact measures
 *
 * Shows:
 * - Baseline vs current comparison
 * - Energy trend from check-ins
 * - Goals/steps completion stats
 * - Celebrate wins
 */
function GoalRing({
  label,
  value,
  total,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  total: number;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  const [mounted, setMounted] = useState(false);
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;
  const ringStyle = {
    background: `conic-gradient(${accent} ${percent}%, rgba(0,0,0,0.08) ${percent}% 100%)`,
  };

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  return (
    <div
      className={`flex flex-col items-center text-center transition-all duration-500 ${
        mounted ? "opacity-100 scale-100" : "opacity-0 scale-95"
      }`}
    >
      <div className="relative w-20 h-20" style={ringStyle}>
        <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-[var(--color-charcoal)]">{value}</span>
            <span className="text-[10px] text-text-muted uppercase tracking-widest">{label}</span>
          </div>
        </div>
        <div className="absolute top-1 left-1">
          <Icon className="w-5 h-5 text-[var(--color-charcoal)]" />
        </div>
      </div>
      <p className="mt-2 text-xs text-text-muted">{total > 0 ? `${percent}% of goals` : "No goals yet"}</p>
    </div>
  );
}

export default function ProgressPage() {
  const router = useRouter();
  
  // Use lazy initializers that are safe for SSR
  const [baseline] = useState<BaselineResponse>(() => 
    typeof window !== 'undefined' ? getBaselineResponse() : {}
  );
  const [checkIns] = useState<CheckIn[]>(() => 
    typeof window !== 'undefined' ? getCheckIns() : []
  );
  const [goals] = useState<Goal[]>(() => 
    typeof window !== 'undefined' ? getGoals() : []
  );
  const [momentum] = useState(() => 
    typeof window !== 'undefined' ? getMomentumDays() : 0
  );
  const [checkInDue] = useState(() => 
    typeof window !== 'undefined' ? !hasCheckedInThisWeek() : false
  );
  const [progressLikes, setProgressLikes] = useState(() =>
    typeof window !== "undefined" ? getProgressLikes() : { achievements: [], reflection: [] }
  );
  const thisWeekCheckIn = !checkInDue ? getLastCheckIn() : null;
  const [celebrationDismissed, setCelebrationDismissed] = useState(false);
  const [period, setPeriod] = useState<"week" | "month" | "year">("week");



  // Calculate stats
  const completedGoals = goals.filter((g) => g.status === "completed");
  const inProgressGoals = goals.filter((g) => g.status === "active");
  const totalSteps = goals.reduce((sum, g) => sum + g.steps.length, 0);
  const completedSteps = goals.reduce(
    (sum, g) => sum + g.steps.filter((s) => s.completed).length,
    0
  );

  const goalCategoryCounts = completedGoals.reduce((acc, g) => {
    acc[g.category] = (acc[g.category] || 0) + 1;
    return acc;
  }, {} as Record<GoalCategory, number>);
  const topCategory = (Object.entries(goalCategoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as GoalCategory) || null;

  const likedProuds = checkIns.filter((c) => progressLikes.achievements.includes(c.id));
  const likedLearnings = checkIns.filter((c) => progressLikes.reflection.includes(c.id));

  const toggleLike = (type: "achievements" | "reflection", checkInId: string) =>
    setProgressLikes(toggleProgressLike(type, checkInId));

  // Get recent energy levels from check-ins
  const recentCheckIns = [...checkIns]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);
  
  const latestEnergy = recentCheckIns.length > 0 ? recentCheckIns[0].energyLevel : null;
  const previousEnergy = recentCheckIns.length > 1 ? recentCheckIns[1].energyLevel : null;

  const hasBaseline = baseline.completedAt;
  const hasData = checkIns.length > 0 || goals.length > 0;

  return (
    <div className="min-h-dvh bg-bg-card pb-32 overflow-y-auto">
      {/* SVG Gradient Definition */}
      <svg width="0" height="0">
        <defs>
          <linearGradient id="heartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4a0f7e" />
            <stop offset="45%" stopColor="#bc03b9" />
            <stop offset="100%" stopColor="#f27321" />
          </linearGradient>
        </defs>
      </svg>

      {/* Header */}
      <header className="pt-6 pb-4 bg-white sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-brand-primary" />
            <h1 className="text-2xl text-[var(--color-charcoal)]">Progress</h1>
          </div>
          <p className="text-text-muted mt-1">Step into your potential</p>
        </div>
      </header>

      <div className="px-6 pb-4 max-w-5xl mx-auto w-full pt-4">
        {/* Inspirational Quote */}
        <div className="mb-6">
          <DailyQuote 
            quote="The smallest of actions is always better than the noblest of intentions."
            author="Robin Sharma"
          />
        </div>

        {/* Divider */}
        <hr className="border-gray-200 mb-6" />

        {!hasData && !hasBaseline ? (
          /* Empty State */
          <section className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mb-4">
              <BarChart3 className="w-8 h-8 text-brand-primary" />
            </div>
            <h2 className="text-xl text-[var(--color-charcoal)] mb-2">Your journey starts here</h2>
            <p className="text-text-muted max-w-xs">
              Set a goal and do your first check-in to start tracking your progress.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 w-full max-w-md">
              <button
                onClick={() => router.push("/goals/new")}
                className="py-3 px-4 bg-brand-primary text-white rounded-2xl font-semibold hover:bg-brand-primary/90 transition"
              >
                Set your first goal
              </button>
              <button
                onClick={() => router.push("/checkin")}
                className="py-3 px-4 bg-white border border-gray-200 rounded-2xl font-semibold text-[var(--color-charcoal)] hover:bg-gray-50 transition"
              >
                Start weekly check-in
              </button>
            </div>
          </section>
        ) : (
          <>
            {/* Celebration - dismissible */}
            {!celebrationDismissed && (completedSteps > 0 || completedGoals.length > 0) && (
              <section className="mb-6">
                <div className="bg-brand-gradient rounded-2xl p-4 text-center relative shadow-[0_0_15px_rgba(0,0,0,0.08)]">
                  <button
                    onClick={() => setCelebrationDismissed(true)}
                    className="absolute top-2 right-2 p-1 text-white/70 hover:text-white transition-colors"
                    aria-label="Dismiss"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-white font-medium">
                    {completedGoals.length > 0
                      ? `You've achieved ${completedGoals.length} goal${
                          completedGoals.length !== 1 ? "s" : ""
                        }!`
                      : `You've hit ${completedSteps} step${
                          completedSteps !== 1 ? "s" : ""
                        }!`}
                  </p>
                  <p className="text-white/80 text-sm mt-1">
                    Keep up the amazing work!
                  </p>
                </div>
              </section>
            )}

            {/* Section 2: This week's win */}
            <section className="mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--color-charcoal)]">This week&apos;s win</h2>
                  <p className="text-sm text-text-muted">Celebrate what you&apos;ve moved forward this week.</p>
                </div>
                {checkInDue && (
                  <button
                    onClick={() => router.push("/checkin")}
                    className="py-2 px-4 bg-brand-primary text-white rounded-xl text-xs font-semibold hover:bg-brand-primary/90 transition"
                  >
                    Do this week&apos;s check-in
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Goals summary */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
                  {goals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="w-12 h-12 bg-brand-primary/10 rounded-full flex items-center justify-center mb-3">
                        <Trophy className="w-6 h-6 text-brand-primary" />
                      </div>
                      <p className="text-sm font-medium text-brand-primary mb-2">You haven&apos;t set a goal yet.</p>
                      <button
                        onClick={() => router.push("/goals/new")}
                        className="px-4 py-2 bg-brand-primary text-white rounded-xl text-sm font-semibold hover:bg-brand-primary/90 transition"
                      >
                        Set your first goal
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Completed goals section */}
                      {completedGoals.length > 0 && (
                        <div className="space-y-3">
                          {completedGoals.map((goal) => {
                            const totalSteps = goal.steps.length;
                            const completedSteps = goal.steps.filter((s) => s.completed).length;
                            const percent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
                            const ringStyle = {
                              background: `conic-gradient(rgba(188, 3, 185, 0.85) ${percent}%, rgba(0,0,0,0.08) ${percent}% 100%)`,
                            };

                            return (
                              <div key={goal.id}>
                                {/* Goal Completed Badge */}
                                <div className="bg-brand-gradient rounded-xl p-3 text-white text-center mb-3 flex items-center justify-center gap-2">
                                  <Sparkles className="w-4 h-4" />
                                  <span className="text-sm font-medium">Goal Completed</span>
                                </div>

                                {/* Goal name and progress ring */}
                                <div className="flex flex-col items-center text-center">
                                  <p className="text-sm font-semibold text-[var(--color-charcoal)] mb-4">{goal.title}</p>
                                  <div className="relative w-24 h-24 rounded-full" style={ringStyle}>
                                    <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                                      <span className="text-2xl font-bold text-[var(--color-charcoal)]">{percent}%</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* In-progress goals section */}
                      {inProgressGoals.length > 0 && (
                        <div className="mt-4 bg-[#4a0f7e]/5 rounded-xl p-4">
                          <p className="text-sm font-bold text-[var(--color-charcoal)] mb-4">
                            {inProgressGoals.length} goal{inProgressGoals.length !== 1 ? "s" : ""} in progress
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            {inProgressGoals.map((goal) => {
                              const totalSteps = goal.steps.length;
                              const completedSteps = goal.steps.filter((s) => s.completed).length;
                              const percent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
                              const ringStyle = {
                                background: `conic-gradient(rgba(74, 15, 126, 0.85) ${percent}%, rgba(0,0,0,0.08) ${percent}% 100%)`,
                              };

                              return (
                                <div
                                  key={goal.id}
                                  className="bg-white rounded-xl p-4 flex flex-col items-center text-center border border-gray-100"
                                >
                                  <p className="text-xs font-semibold text-[var(--color-charcoal)] mb-3">{goal.title}</p>
                                  <div className="relative w-20 h-20 rounded-full" style={ringStyle}>
                                    <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                                      <span className="text-lg font-bold text-[var(--color-charcoal)]">{percent}%</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Weekly check-in win */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-semibold text-[var(--color-charcoal)]">This week&apos;s win</h3>
                      <p className="text-xs text-text-muted">Capture what went well and what you learned.</p>
                    </div>
                    {thisWeekCheckIn && (
                      <span className="text-xs text-text-muted uppercase tracking-wide">
                        {new Date(thisWeekCheckIn.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    )}
                  </div>

                  {checkInDue ? (
                    <div className="flex flex-col gap-3">
                      <div className="p-4 bg-gray-50 rounded-2xl text-center">
                        <p className="text-sm text-text-muted">
                          Complete a check-in to capture your proud moments and learnings.
                        </p>
                      </div>
                      <button
                        onClick={() => router.push("/checkin")}
                        className="w-full py-3 bg-brand-primary text-white rounded-2xl font-semibold hover:bg-brand-primary/90 transition"
                      >
                        Do this week&apos;s check-in
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="relative p-4 bg-white rounded-2xl border border-gray-100">
                          <button
                            onClick={() => thisWeekCheckIn && toggleLike("achievements", thisWeekCheckIn.id)}
                            className={`absolute top-3 right-3 p-1 rounded-full transition-colors ${
                              thisWeekCheckIn && progressLikes.achievements.includes(thisWeekCheckIn.id)
                                ? "text-brand-primary"
                                : "text-gray-300 hover:text-gray-400"
                            }`}
                            aria-label="Save proud moment"
                          >
                            <Heart 
                              className="w-5 h-5" 
                              fill={thisWeekCheckIn && progressLikes.achievements.includes(thisWeekCheckIn.id) ? "url(#heartGradient)" : "none"}
                              stroke={thisWeekCheckIn && progressLikes.achievements.includes(thisWeekCheckIn.id) ? "url(#heartGradient)" : "currentColor"}
                              strokeWidth={thisWeekCheckIn && progressLikes.achievements.includes(thisWeekCheckIn.id) ? 0 : 2}
                            />
                          </button>

                          <p className="text-xs font-bold text-brand-primary uppercase tracking-wide mb-2">Proud of</p>
                          <p className="text-sm text-[var(--color-charcoal)] leading-relaxed">
                            {thisWeekCheckIn?.achievements?.trim() || "No proud moments recorded yet."}
                          </p>
                        </div>

                        <div className="relative p-4 bg-white rounded-2xl border border-gray-100">
                          <button
                            onClick={() => thisWeekCheckIn && toggleLike("reflection", thisWeekCheckIn.id)}
                            className={`absolute top-3 right-3 p-1 rounded-full transition-colors ${
                              thisWeekCheckIn && progressLikes.reflection.includes(thisWeekCheckIn.id)
                                ? "text-brand-primary"
                                : "text-gray-300 hover:text-gray-400"
                            }`}
                            aria-label="Save learning"
                          >
                            <Heart 
                              className="w-5 h-5" 
                              fill={thisWeekCheckIn && progressLikes.reflection.includes(thisWeekCheckIn.id) ? "url(#heartGradient)" : "none"}
                              stroke={thisWeekCheckIn && progressLikes.reflection.includes(thisWeekCheckIn.id) ? "url(#heartGradient)" : "currentColor"}
                              strokeWidth={thisWeekCheckIn && progressLikes.reflection.includes(thisWeekCheckIn.id) ? 0 : 2}
                            />
                          </button>

                          <p className="text-xs font-bold text-brand-primary uppercase tracking-wide mb-2">Learning</p>
                          <p className="text-sm text-[var(--color-charcoal)] leading-relaxed">
                            {thisWeekCheckIn?.reflection?.trim() || "No learning recorded yet."}
                          </p>
                        </div>
                      </div>

                      {/* Tip Card */}
                      <div className="bg-brand-primary/10 rounded-2xl p-4 flex gap-3 mt-3">
                        <Sparkles className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-brand-primary font-medium">
                          <span className="font-bold">Tip:</span> tap the heart icon to save a proud of or learning memory for later
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </section>

            {/* Section 3: Overall achievements */}
            <section className="mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--color-charcoal)]">Overall achievements</h2>
                  <p className="text-sm text-text-muted">A snapshot of what you&apos;ve built so far.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Goals completed</p>
                  <p className="text-3xl font-bold text-brand-primary">{completedGoals.length}</p>
                  <p className="text-xs text-text-muted mt-2">
                    {completedGoals.length === 0 ? "Start by setting a goal" : "Keep going — you’re building momentum!"}
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <p className="text-xs text-text-muted uppercase tracking-wide mb-2">Top category</p>
                  <p className="text-3xl font-bold text-[var(--color-charcoal)]">{topCategory || "—"}</p>
                  <p className="text-xs text-text-muted mt-2">
                    {topCategory
                      ? `${goalCategoryCounts[topCategory]} completed goal${goalCategoryCounts[topCategory] !== 1 ? "s" : ""}`
                      : "Add a completed goal to see trends"}
                  </p>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-text-muted uppercase tracking-wide">Check-in streak</p>
                    <Flame className="w-5 h-5 text-brand-primary" />
                  </div>
                  <p className="text-3xl font-bold text-brand-primary">{momentum}</p>
                  <p className="text-xs text-text-muted mt-2">
                    {checkInDue ? "Check in this week to keep it alive" : "Keep it going!"}
                  </p>
                </div>
              </div>

              {(likedProuds.length > 0 || likedLearnings.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {likedProuds.length > 0 && (
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                      <p className="text-base font-bold text-[var(--color-charcoal)] mb-4">Proud of</p>
                      <div className="space-y-3">
                        {likedProuds.slice(0, 2).map((checkIn) => (
                          <div key={checkIn.id} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                            <Heart className="w-5 h-5 flex-shrink-0 mt-0.5" fill="url(#heartGradient)" stroke="url(#heartGradient)" strokeWidth={2} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-[var(--color-charcoal)] leading-relaxed">{checkIn.achievements}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {likedProuds.length > 2 && (
                        <button
                          onClick={() => router.push("/progress/proud")}
                          className="mt-4 w-full py-2 bg-brand-primary text-white rounded-xl text-sm font-semibold hover:bg-brand-primary/90 transition"
                        >
                          View all proud moments
                        </button>
                      )}
                    </div>
                  )}

                  {likedLearnings.length > 0 && (
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                      <p className="text-base font-bold text-[var(--color-charcoal)] mb-4">Learning</p>
                      <div className="space-y-3">
                        {likedLearnings.slice(0, 2).map((checkIn) => (
                          <div key={checkIn.id} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                            <Heart className="w-5 h-5 flex-shrink-0 mt-0.5" fill="url(#heartGradient)" stroke="url(#heartGradient)" strokeWidth={2} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-[var(--color-charcoal)] leading-relaxed">{checkIn.reflection}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {likedLearnings.length > 2 && (
                        <button
                          onClick={() => router.push("/progress/learnings")}
                          className="mt-4 w-full py-2 bg-brand-primary text-white rounded-xl text-sm font-semibold hover:bg-brand-primary/90 transition"
                        >
                          View all learnings
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Section 4: Review where you started */}
            <section className="mb-6">
              <div
                onClick={() => router.push("/onboarding/baseline")}
                className="cursor-pointer bg-brand-gradient rounded-3xl shadow-md p-6 flex items-center justify-between hover:shadow-lg transition"
              >
                <div>
                  {hasBaseline ? (
                    <>
                      <p className="text-white font-semibold text-lg">Review where you started</p>
                      <p className="text-white/80 text-sm mt-1">Compare your progress over time</p>
                    </>
                  ) : (
                    <>
                      <p className="text-white font-semibold text-lg">Discover where you</p>
                      <p className="text-white font-semibold text-lg">are now vs where</p>
                      <p className="text-white font-semibold text-lg">you started →</p>
                    </>
                  )}
                </div>
                <Lightbulb className="w-8 h-8 text-white flex-shrink-0" />
              </div>
            </section>
          </>
        )}

      </div>

      <BottomNav />
    </div>
  );
}
