"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Goal,
  getGoals,
  isOnboardingCompleted,
  hasCheckedInThisWeek,
  getMomentumDays,
  isDiscoveryPopulated,
} from "@/lib/storage";

import BottomNav from "@/components/ui/BottomNav";
import {
  Flame,
  Bell,
  Plus,
  Sun,
  Sunset,
  Moon,
} from "lucide-react";
import GoalCard from "@/components/ui/GoalCard";
import DailyQuote from "@/components/ui/DailyQuote";
import { DottedEmptyState } from "@/components";
import { Lightbulb } from "lucide-react";



/**
 * Dashboard - Main home page after onboarding
 *
 * Purpose: Progress overview & today's focus
 * Shows momentum, quick stats, and next best action.
 */
export default function DashboardPage() {
  const router = useRouter();

  // Check onboarding status synchronously - redirect if not completed
  const onboardingComplete = isOnboardingCompleted();

  // Initialize state with lazy initializers (only runs if onboarding is complete)
  const [goals] = useState<Goal[]>(() => onboardingComplete ? getGoals() : []);
  const [showCheckInPrompt] = useState(() => onboardingComplete ? !hasCheckedInThisWeek() : false);
  const [momentum] = useState(() => onboardingComplete ? getMomentumDays() : 0);
  // Reactive calculation for Discovery status (re-checks on navigation/render)
  const isDiscoveryEmpty = onboardingComplete ? !isDiscoveryPopulated() : false;

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (!onboardingComplete) {
      router.replace("/welcome");
    }
  }, [onboardingComplete, router]);

  // Show nothing while redirecting
  if (!onboardingComplete) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-brand-surface">
        <div className="animate-pulse text-text-subtle">Loading...</div>
      </div>
    );
  }

  const activeGoals = goals.filter((g) => g.status === "active");
  const totalSteps = goals.reduce(
    (sum, g) => sum + g.steps.length,
    0
  );
  const completedSteps = goals.reduce(
    (sum, g) => sum + g.steps.filter((s) => s.completed).length,
    0
  );

  // Time-based greeting with icon
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const GreetingIcon = hour < 12 ? Sun : hour < 18 ? Sunset : Moon;



  return (
    <div className="min-h-dvh bg-bg-card flex flex-col">
      {/* Header */}
      <header className="pt-6 pb-4 bg-white sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6">
          <h1 className="text-2xl text-[var(--color-charcoal)] mb-1 flex items-center gap-3">
            <GreetingIcon className="w-8 h-8 text-brand-primary" />
            {greeting}
          </h1>
          <p className="text-text-muted mt-1">Step into your potential</p>
        </div>
      </header>

      <div className="px-6 max-w-5xl mx-auto w-full flex-1 flex flex-col pt-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Weekly Check-in Prompt */}
          {showCheckInPrompt && (
            <section className="md:col-span-12">
              <Link href="/checkin" className="group">
                <div className="bg-brand-gradient rounded-3xl p-8 text-white relative overflow-hidden hover:scale-[1.01] transition-transform">
                  <div className="relative z-10 flex justify-between items-center">
                    <div>
                      <p className="text-white/80 text-sm font-medium uppercase tracking-wider mb-2">Weekly check-in</p>
                      <h2 className="text-2xl font-bold">How are you doing today?</h2>
                    </div>
                    <div className="p-4 bg-white/20 backdrop-blur-md rounded-full">
                      <Bell className="w-8 h-8 animate-wiggle group-hover:animate-wiggle" />
                    </div>
                  </div>
                </div>
              </Link>
            </section>
          )}

          {/* Daily Quote / Inspiration - Full Width */}
          <div className="md:col-span-12">
            <DailyQuote />
          </div>

          {/* Divider */}
          <div className="md:col-span-12">
            <hr className="border-gray-200 my-2" />
          </div>

          {/* Stats Row */}
          <div className="md:col-span-12">
            <div className="mb-4 mx-4">
              <h2 className="text-lg font-semibold text-[var(--color-charcoal)]">
                Your Momentum
              </h2>
              <p className="text-sm text-text-muted">Keep the energy flowing</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Momentum */}
              <div className="bg-white rounded-xl p-4 min-h-[120px] flex flex-col items-center justify-center text-center border border-gray-100 shadow-[0_0_15px_rgba(0,0,0,0.08)]">
                <p className="text-xs text-text-muted uppercase tracking-wide mb-2">
                  Check-in Streak
                </p>
                <p className="text-3xl font-bold text-brand-primary flex items-center gap-1">
                  {momentum > 0 && <Flame className="w-6 h-6" />}
                  {momentum}
                </p>
                <p className="text-xs text-text-subtle mt-2">
                  Keep it going!
                </p>
              </div>

              {/* Active Goals */}
              <div className="bg-white rounded-xl p-4 min-h-[120px] flex flex-col items-center justify-center text-center border border-gray-100 shadow-[0_0_15px_rgba(0,0,0,0.08)]">
                <p className="text-xs text-text-muted uppercase tracking-wide mb-2">
                  Active Goals
                </p>
                <p className="text-3xl font-bold text-[var(--color-charcoal)]">
                  {activeGoals.length}
                </p>
                <p className="text-xs text-text-subtle mt-2">
                  {activeGoals.length === 0 ? "Set your first goal" : "In progress"}
                </p>
              </div>

              {/* Steps Progress */}
              <div className="bg-white rounded-xl p-4 min-h-[120px] flex flex-col items-center justify-center text-center border border-gray-100 shadow-[0_0_15px_rgba(0,0,0,0.08)]">
                <p className="text-xs text-text-muted uppercase tracking-wide mb-2">
                  Steps Done
                </p>
                <p className="text-3xl font-bold text-[var(--color-charcoal)]">
                  {completedSteps}/{totalSteps}
                </p>
                <p className="text-xs text-text-subtle mt-2">
                  {totalSteps > 0
                    ? `${Math.round((completedSteps / totalSteps) * 100)}% complete`
                    : "Add steps to goals"}
                </p>
              </div>
            </div>
          </div>

          {/* Main Content Area: Prompt / Goals */}
          <div className={`md:col-span-12 ${isDiscoveryEmpty && activeGoals.length === 0 ? "grid md:grid-cols-2 gap-4" : ""}`}>

            {/* Discovery Prompt - Show if empty */}
            {isDiscoveryEmpty && (
              <div className="mb-4 md:mb-0">
                <DottedEmptyState
                  href="/discovery"
                  title="Start your discovery journey"
                  description="Explore your skills, qualities, values and interests."
                  icon={Lightbulb}
                  className="h-full"
                />
              </div>
            )}

            {/* Goals Overview / Empty State */}
            <div className={activeGoals.length === 0 ? "h-full" : ""}>
              {activeGoals.length > 0 ? (
                <section className="mb-6">
                  <div className="flex items-center justify-between mb-4 mx-4">
                    <h2 className="text-sm text-text-muted uppercase tracking-wider font-bold">
                      Your Goals
                    </h2>
                    <Link
                      href="/goals"
                      className="text-brand-primary text-sm hover:underline font-medium"
                    >
                      View all →
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {activeGoals.slice(0, 5).map((goal) => (
                      <GoalCard key={goal.id} goal={goal} />
                    ))}
                    {activeGoals.length > 5 && (
                      <Link
                        href="/goals"
                        className="block text-center text-sm text-text-muted py-2 hover:text-brand-primary transition-colors"
                      >
                        +{activeGoals.length - 5} more goal
                        {activeGoals.length - 5 !== 1 ? "s" : ""}
                      </Link>
                    )}
                  </div>
                </section>
              ) : (
                /* Empty State */
                <section className="flex-1 flex flex-col mb-8">
                  <DottedEmptyState
                    href="/goals/new"
                    title="Set your first goal"
                    description="Start with something meaningful to you and track your journey to potential."
                    icon={Plus}
                    className="flex-1 h-full"
                  />
                </section>
              )}

              {/* Quick Action: Add Goal (if some goals exist) */}
              {activeGoals.length > 0 && activeGoals.length < 3 && (
                <section>
                  <Link href="/goals/new">
                    <div className="border-2 border-dashed border-warm-ivory rounded-2xl p-4 text-center hover:border-brand-primary hover:bg-brand-primary/5 transition-colors flex items-center justify-center gap-2">
                      <Plus className="w-5 h-5 text-text-subtle" />
                      <span className="text-text-muted hover:text-brand-primary">
                        Add another goal
                      </span>
                    </div>
                  </Link>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Spacer for BottomNav */}
      <div className="h-20" />

      <BottomNav />
    </div>
  );
}
