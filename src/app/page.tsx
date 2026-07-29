"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Goal,
  hasCheckedInThisWeek,
  getMomentumDays,
  isDiscoveryPopulated,
  loadGoalsFromSupabase,
} from "@/lib/storage";
import { supabase } from "@/lib/supabase";

import BottomNav from "@/components/ui/BottomNav";
import UserInitialsBadge from "@/components/ui/UserInitialsBadge";
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

function getDisplayNameFromEmail(email: string | null | undefined) {
  const localPart = email?.split("@")[0] ?? "user";
  const cleaned = localPart.replace(/[^a-zA-Z0-9]/g, "");
  const derived = cleaned.slice(0, 6) || "user";

  return derived.charAt(0).toUpperCase() + derived.slice(1);
}

/**
 * Dashboard - Main home page after onboarding
 *
 * Purpose: Progress overview & today's focus
 * Shows momentum, quick stats, and next best action.
 */
export default function DashboardPage() {
  const router = useRouter();

  const [hasHydrated, setHasHydrated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showCheckInPrompt, setShowCheckInPrompt] = useState(false);
  const [momentum, setMomentum] = useState(0);
  const [isDiscoveryEmpty, setIsDiscoveryEmpty] = useState(false);
  const [displayName, setDisplayName] = useState("User");

  const refreshDashboardData = async () => {
    try {
      const loadedGoals = await loadGoalsFromSupabase();
      setGoals(loadedGoals);
    } catch (error) {
      console.error("Failed to refresh dashboard goals", error);
      setGoals([]);
    }

    setShowCheckInPrompt(!hasCheckedInThisWeek());
    setMomentum(getMomentumDays());
    setIsDiscoveryEmpty(!isDiscoveryPopulated());
  };

  useEffect(() => {
    let isActive = true;

    async function initialize() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isActive) return;

      if (!session) {
        setIsAuthenticated(false);
        setAuthChecked(true);
        router.replace("/signIn");
        return;
      }

      setIsAuthenticated(true);

      const derivedName = getDisplayNameFromEmail(session.user.email);
      const metadataName = session.user.user_metadata?.display_name;
      const nextDisplayName = metadataName || derivedName;

      setDisplayName(nextDisplayName);

      if (!metadataName || metadataName !== derivedName) {
        await supabase.auth.updateUser({ data: { display_name: derivedName } });
      }

      await refreshDashboardData();
      setHasHydrated(true);
      setAuthChecked(true);
    }

    void initialize();

    const handleGoalDataChanged = () => {
      if (isActive) {
        void refreshDashboardData();
      }
    };

    window.addEventListener("empwru-goals-updated", handleGoalDataChanged);
    window.addEventListener("focus", handleGoalDataChanged);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        handleGoalDataChanged();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isActive = false;
      window.removeEventListener("empwru-goals-updated", handleGoalDataChanged);
      window.removeEventListener("focus", handleGoalDataChanged);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router]);

  // Show nothing while redirecting or hydrating
  if (!hasHydrated || !authChecked || !isAuthenticated) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-brand-surface">
        <div className="animate-pulse text-text-subtle">Loading...</div>
      </div>
    );
  }

  const activeGoals = goals.filter((g) => g.status === "active");
  const totalSteps = activeGoals.reduce(
    (sum, g) => sum + g.steps.length,
    0
  );
  const completedSteps = activeGoals.reduce(
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
        <div className="max-w-5xl mx-auto px-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl text-[var(--color-charcoal)] mb-1 flex items-center gap-3">
              <GreetingIcon className="w-8 h-8 text-brand-primary" />
              {greeting}
            </h1>
            <p className="text-text-muted mt-1">Hi {displayName} — step into your potential</p>
          </div>
          <UserInitialsBadge />
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
                  {activeGoals.length === 0 ? "No goals in progress" : "In progress"}
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
                      Your goals
                    </h2>
                    <Link
                      href="/goals"
                      className="text-brand-primary text-sm hover:underline font-medium"
                    >
                      View all →
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeGoals.map((goal) => (
                      <div key={goal.id} className="h-full">
                        <GoalCard goal={goal} />
                      </div>
                    ))}
                    <Link
                      href="/goals/new"
                      className="min-h-[140px] rounded-2xl border-2 border-dashed border-gray-200 bg-white/70 p-4 flex flex-col items-center justify-center text-center hover:border-brand-primary hover:bg-brand-primary/5 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center mb-3">
                        <Plus className="w-6 h-6" />
                      </div>
                      <span className="font-semibold text-[var(--color-charcoal)]">
                        Add another goal
                      </span>
                      <span className="text-sm text-text-muted mt-1">
                        Keep your momentum going
                      </span>
                    </Link>
                  </div>
                </section>
              ) : (
                /* Empty State */
                <section className="flex-1 flex flex-col mb-8">
                  <DottedEmptyState
                    href="/goals/new"
                    title="No goals in progress yet"
                    description="Start a new goal and keep your momentum going."
                    icon={Plus}
                    className="flex-1 h-full"
                  />
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
