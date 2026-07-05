"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveCheckIn } from "@/lib/storage";
import {
  MessageSquare,
  Sparkles,
  Heart,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Trophy
} from "lucide-react";
import { FullScreenLayout } from "@/components/layouts/FullScreenLayout";
import { CelebrationScreen } from "@/components/ui/CelebrationScreen";

/**
 * Weekly Check-in Wizard
 * 
 * Steps:
 * 1. Energy - How are you feeling overall?
 * 2. Progress - Which steps did you complete?
 * 3. Reflection - What went well?
 * 4. Done - Celebration!
 */

interface CheckInDraft {
  energyLevel: number;
  achievements: string;
  reflection: string;
}

export default function CheckInPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [draft, setDraft] = useState<CheckInDraft>({
    energyLevel: 3,
    achievements: "",
    reflection: "",
  });



  const handleFinish = () => {
    saveCheckIn({
      date: new Date().toISOString().split("T")[0],
      energyLevel: draft.energyLevel,
      achievements: draft.achievements,
      reflection: draft.reflection,
    });
    setStep(4);
  };

  if (step === 4) {
    return (
      <CelebrationScreen
        progress={100}
        title="Check-in Complete!"
        subtitle="You're showing up for yourself and that's what counts."
        onButtonClick={() => router.push("/")}
        buttonText="GO TO DASHBOARD"
        icon={Sparkles}
      />
    );
  }


  return (
    <FullScreenLayout bgClass="bg-bg-card">
      {/* Header */}
      <header className="pt-6 pb-4 bg-white sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 flex items-center gap-3">
          <Heart className="w-8 h-8 text-brand-primary" />
          <h1 className="text-2xl text-[var(--color-charcoal)]">Weekly Check-in</h1>
        </div>
      </header>

      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 pt-6 pb-32 w-full">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-12">
            <div className="flex gap-2 flex-1">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${s <= step ? "bg-brand-primary" : "bg-gray-100"
                    }`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-10">
            {/* Step 1: Energy */}
            {step === 1 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-xl mx-auto">
                {/* Icon Header - Outside Card */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-brand-primary" strokeWidth={1.5} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">How&apos;s your energy?</h2>
                  <p className="text-gray-500 mt-2 text-sm">Check in with yourself before checking in with your goals.</p>
                </div>

                {/* Card - Question & Input Only */}
                <div className="p-5 bg-white rounded-3xl border border-gray-100">
                  <div className="flex items-center justify-center gap-3">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        onClick={() => setDraft({ ...draft, energyLevel: level })}
                        className={`w-14 h-14 rounded-2xl font-bold text-xl transition-all ${draft.energyLevel === level
                          ? "bg-brand-primary text-white scale-110"
                          : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                          }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-3">
                    <span>Very Low</span>
                    <span>Feeling Great</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Achievements */}
            {step === 2 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-xl mx-auto">
                {/* Icon Header - Outside Card */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Trophy className="w-8 h-8 text-brand-primary" strokeWidth={1.5} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">What do you feel proud of this week?</h2>
                  <p className="text-gray-500 mt-2 text-sm">Celebrate your wins this week, no matter how small.</p>
                </div>

                {/* Card - Input Only */}
                <div className="p-5 bg-white rounded-3xl border border-gray-100">
                  <textarea
                    autoFocus
                    value={draft.achievements}
                    onChange={(e) => setDraft({ ...draft, achievements: e.target.value })}
                    placeholder="e.g. I completed my first workout... or, I had a difficult conversation I'd been putting off..."
                    // className="w-full min-h-[180px] p-5 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-brand-primary/20 text-gray-900 text-base resize-none"
                    className="w-full min-h-[180px] p-5 rounded-2xl bg-gray-50 border-none focus:outline-none focus:ring-2 focus:ring-brand-primary/40 text-gray-900 text-base resize-none"

                  />
                </div>
              </div>
            )}

            {/* Step 3: Reflection */}
            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-xl mx-auto">
                {/* Icon Header - Outside Card */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-brand-primary" strokeWidth={1.5} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Weekly Reflection</h2>
                  <p className="text-gray-500 mt-2 text-sm">What did you learn? What would you do differently?</p>
                </div>

                {/* Card - Input Only */}
                <div className="p-5 bg-white rounded-3xl border border-gray-100">
                  <textarea
                    autoFocus
                    value={draft.reflection}
                    onChange={(e) => setDraft({ ...draft, reflection: e.target.value })}
                    placeholder="e.g. It felt good to start that habit... or, busy week, need to refocus..."
                    className="w-full min-h-[180px] p-5 rounded-2xl bg-gray-50 border-none focus:outline-none focus:ring-2 focus:ring-brand-primary/40 text-gray-900 text-base resize-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contextual Sticky Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe z-50 animate-in slide-in-from-bottom duration-500">
        <div className="flex justify-around items-center h-20 max-w-md mx-auto px-4">
          {/* Back */}
          <button
            onClick={() => step > 1 ? setStep((s) => (s - 1) as 1 | 2 | 3 | 4) : null}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors gap-1 ${step > 1 ? "text-gray-400 hover:text-brand-primary" : "text-gray-200 pointer-events-none"
              }`}
          >
            <ChevronLeft className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Back</span>
          </button>

          {/* Cancel */}
          <button
            onClick={() => router.push("/")}
            className="flex flex-col items-center justify-center w-full h-full text-brand-primary transition-colors gap-1"
          >
            <div className="w-12 h-12 bg-brand-primary/10 rounded-full flex items-center justify-center mb-1 group-active:scale-95 transition-transform">
              <X className="w-6 h-6 text-brand-primary" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest -mt-1">Cancel</span>
          </button>

          {/* Next/Finish */}
          <button
            onClick={() => step === 3 ? handleFinish() : setStep((s) => (s + 1) as 1 | 2 | 3 | 4)}
            className="flex flex-col items-center justify-center w-full h-full text-brand-primary transition-colors gap-1"
          >
            {step === 3 ? (
              <Check className="w-6 h-6" />
            ) : (
              <ChevronRight className="w-6 h-6" />
            )}
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {step === 3 ? "Finish" : "Next"}
            </span>
          </button>
        </div>
      </nav>
    </FullScreenLayout>
  );
}
