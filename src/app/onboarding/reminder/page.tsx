"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FullScreenLayout, CelebrationScreen } from "@/components";
import { ProgressDisplay } from "@/components/ui/ProgressDisplay";
import { WizardHeader } from "@/components/ui/WizardHeader";
import { TimeOption } from "@/components/ui/TimeOption";
import { completeOnboarding, saveOnboardingState } from "@/lib/storage";
import { Sunrise, Sunset, Sparkles } from "lucide-react";

type ReminderTime = "morning" | "evening";
type Step = "reminder" | "celebration";

/**
 * Onboarding Screen 6: Reminder Setup + Celebration
 *
 * Purpose: Set weekly check-in day and time, then celebrate completion.
 * Route: /onboarding/reminder
 */
export default function ReminderPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("reminder");
  const [selectedTime, setSelectedTime] = useState<ReminderTime | null>(null);

  const handleComplete = () => {
    // Calculate reminder date as one week from now
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    // Save reminder preferences
    saveOnboardingState({
      reminderDate: nextWeek.toISOString(),
      reminderTime: selectedTime ?? undefined,
    });

    // Mark onboarding as complete
    completeOnboarding();

    // Show celebration screen
    setStep("celebration");
  };

  const canContinue = selectedTime !== null;

  // Celebration screen with 100%
  if (step === "celebration") {
    return (
      <CelebrationScreen
        progress={100}
        icon={Sparkles}
        title="You're all set!"
        subtitle="Welcome to empwrU. Let’s start moving towards your potential."
        buttonText="Go to dashboard"
        onButtonClick={() => router.push("/")}
      />
    );
  }

  return (
    <FullScreenLayout bgClass="bg-white">
      <div className="flex-1 overflow-y-auto">
        <WizardHeader title="Reminder Setup" />
        <div className="max-w-5xl mx-auto px-6 pb-6 w-full">

          {/* Large animated progress percentage - 5/6 complete */}
          <ProgressDisplay 
            progress={Math.round((5 / 6) * 100)}
            label="Section 6 of 6"
          />

          {/* Question */}
          <div className="text-center mb-16">
            <h1 className="text-2xl font-semibold text-gray-900 mb-4">
              When works best for your weekly check-in?
            </h1>
            <p className="text-gray-500">
              We&apos;ll send a gentle reminder once a week
            </p>
          </div>

          {/* Time options */}
          <div className="space-y-6 text-center" role="radiogroup" aria-label="Weekly check-in time">
            <p className="text-gray-900 font-medium mb-4">
              Pick a time
            </p>
            <div className="max-w-md mx-auto space-y-4">
              <TimeOption
                time="8:00 AM"
                label="Morning"
                description="Start your week with reflection"
                icon={Sunrise}
                selected={selectedTime === "morning"}
                onSelect={() => setSelectedTime("morning")}
              />
              <TimeOption
                time="6:00 PM"
                label="Evening"
                description="Wind down and plan your week"
                icon={Sunset}
                selected={selectedTime === "evening"}
                onSelect={() => setSelectedTime("evening")}
              />
            </div>
          </div>
        </div>
      </div>

      <FullScreenLayout.Footer>
        <div className="max-w-5xl mx-auto w-full">
          <div className="flex items-center justify-between px-6">
            <button
              onClick={() => router.push("/onboarding/baseline")}
              className="py-3 text-brand-primary font-medium flex items-center gap-1"
            >
              ← Back
            </button>
            <button
              onClick={handleComplete}
              disabled={!canContinue}
              className="py-3 text-brand-primary font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Complete →
            </button>
          </div>
        </div>
      </FullScreenLayout.Footer>
    </FullScreenLayout>
  );
}
