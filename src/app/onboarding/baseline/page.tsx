"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FullScreenLayout,
  RatingScale,
  ChoiceChips,
  WizardHeader,
  TimeOption,
  CelebrationScreen,
} from "@/components";
import {
  saveBaselineResponse,
  completeBaseline,
  saveOnboardingState,
  completeOnboarding,
  getBaselineResponse,
  type WorkStatus,
  type BaselineResponse,
  SkillsCurrentStatus,
} from "@/lib/storage";
import { loadBaselineForCurrentUser, saveBaselineToSupabase } from "@/lib/baseline";
import { Sunrise, Sunset, Sparkles, Lightbulb, ChevronLeft } from "lucide-react";

// =============================================================================
// Question Data
// =============================================================================

const WORK_STATUS_OPTIONS = [
  { value: "unemployed", label: "Unemployed" },
  { value: "employed", label: "In work" },
  { value: "self-employed", label: "Self-employed" },
  { value: "studying", label: "Studying" },
  { value: "other", label: "Other" },
];

const SKILLS_CURRENT_STATUS_OPTIONS = [
  { value: "activeLearning", label: "I’m actively learning or upskilling" },
  { value: "pastLearning", label: "I’ve done learning in the past but not recently" },
  { value: "wantToLearn", label: "I want to learn but don’t know where to start" },
  { value: "notNow", label: "Learning or upskilling isn’t a focus for me right now" },
];

const SKILLS_CURRENT_STATUS_OPTIONS2 = [
  { value: "activeLearning2", label: "actively upskilling" },
  { value: "pastLearning2", label: "done learning in the past" },
  { value: "wantToLearn2", label: "unsure where to start" },
  { value: "notNow2", label: "not focused right now" },
];
// Section definitions
export const SECTIONS = [
  { id: "situation", title: "Current Situation" },
  { id: "wellbeing", title: "Wellbeing & Balance" },
  { id: "skills", title: "Skills, Education & Learning" },
  { id: "confidence", title: "Confidence" },
  { id: "aspirations", title: "Aspirations for the Future" },
  { id: "reminder", title: "Weekly Check-in" },
] as const;

const DAY_OPTIONS = [
  { value: "sunday", label: "Sunday" },
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
];

type ReminderTime = "morning" | "evening";
type ReminderDay = "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday";

// =============================================================================
// Component
// =============================================================================

/**
 * Onboarding Screen 2: Baseline Quiz (Multi-step wizard)
 *
 * Purpose: Gauge starting point across impact measures.
 * Route: /onboarding/baseline
 *
 * Follows single-purpose screen principle: one section per view.
 */
export default function BaselinePage() {
  const router = useRouter();
  const [currentSection, setCurrentSection] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [baseline, setBaseline] = useState<BaselineResponse | null>(null);

  // Form state - all questions
  const [responses, setResponses] = useState<Partial<BaselineResponse>>({});

  // Reminder state
  const [reminderDay, setReminderDay] = useState<ReminderDay | null>(null);
  const [reminderTime, setReminderTime] = useState<ReminderTime | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    const hydrateBaseline = async () => {
      const result = await loadBaselineForCurrentUser();
      const savedBaseline = result.baseline;
      if (savedBaseline && Object.keys(savedBaseline).length > 0) {
        setBaseline(savedBaseline);
        setShowSummary(true);
      }
    };

    hydrateBaseline();
  }, []);

  const updateResponse = <K extends keyof BaselineResponse>(
    key: K,
    value: BaselineResponse[K]
  ) => {
    setResponses((prev) => ({ ...prev, [key]: value }));
  };
  const handleNext = () => {
    if (currentSection < SECTIONS.length - 1) {
      setCurrentSection(currentSection + 1);
    } else {
      setShowCelebration(true);
    }
  };

  const handleFinish = async () => {
    const completedAt = new Date().toISOString();
    const mergedResponses = {
      ...responses,
      completedAt,
    } as Partial<BaselineResponse>;

    saveBaselineResponse(mergedResponses);
    completeBaseline();

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    await saveBaselineToSupabase(
      mergedResponses,
      reminderDay ?? null,
      reminderTime ?? null
    );

    saveOnboardingState({
      currentStep: 7,
      completed: true,
      reminderDate: nextWeek.toISOString(),
      reminderTime: reminderTime ?? undefined,
    });
    completeOnboarding();
    router.push("/");
  };

  const handleBack = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleCancel = () => {
    router.push("/onboarding/welcome");
  };

  const section = SECTIONS[currentSection];
  const isLastSection = currentSection === SECTIONS.length - 1;

  // Check if current section is complete (both questions answered)
  const isSectionComplete = (): boolean => {
    switch (section.id) {
      case "situation":
        return responses.workStatus != null && responses.situationSatisfaction != null;
      case "skills":
        return responses.skillsConfidence != null && responses.skillsCurrentStatus != null;
      case "confidence":
        return responses.confidence != null;
      case "aspirations":
        return responses.futureClarity != null && responses.futureHope != null;
      case "wellbeing":
        return responses.stressLevel != null && responses.energyLevel != null && responses.lifeBalance != null;
      case "reminder":
        return reminderDay != null && reminderTime != null;
      default:
        return false;
    }
  };

  if (showCelebration) {
    return (
      <CelebrationScreen
        progress={100}
        icon={Sparkles}
        title="You're All Set!"
        subtitle="Let's start moving towards your potential."
        buttonText="GO TO DASHBOARD"
        onButtonClick={handleFinish}
      />
    );
  }

  // Show summary view if baseline data exists
  if (showSummary && baseline) {
    return (
      <FullScreenLayout bgClass="bg-white">
        <div className="max-w-5xl mx-auto px-6 py-8 w-full">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Lightbulb className="w-6 h-6 text-brand-primary" />
            <h1 className="text-2xl font-bold text-[var(--color-charcoal)]">About U Checkin</h1>
          </div>

          {/* Status Message */}
          <div className="bg-brand-primary/10 rounded-2xl p-4 mb-6 border border-brand-primary/20">
            <div className="flex gap-3">
              <Sparkles className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-brand-primary font-medium">
                  Your About U checkin was completed on {baseline.completedAt ? new Date(baseline.completedAt).toLocaleDateString() : "—"}.
                </p>
                <p className="text-xs text-brand-primary/70 mt-1">Your next checkin will be available after 90 days on {baseline.completedAt ? new Date(new Date(baseline.completedAt).getTime() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString() : "—"}.</p>
              </div>
            </div>
          </div>

          {/* Metrics */}
          <div className="space-y-4 mb-8">
            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <p className="text-xs font-bold text-brand-primary uppercase tracking-wide mb-3">Wellbeing</p>
              <p className="text-4xl font-bold text-[var(--color-charcoal)]">{baseline.energyLevel ?? "—"}<span className="text-xl text-text-muted">/5</span></p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <p className="text-xs font-bold text-brand-primary uppercase tracking-wide mb-3">Satisfaction</p>
              <p className="text-4xl font-bold text-[var(--color-charcoal)]">{baseline.situationSatisfaction ?? "—"}<span className="text-xl text-text-muted">/5</span></p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <p className="text-xs font-bold text-brand-primary uppercase tracking-wide mb-3">Confidence</p>
              <p className="text-4xl font-bold text-[var(--color-charcoal)]">{baseline.confidence ?? "—"}<span className="text-xl text-text-muted">/5</span></p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <p className="text-xs font-bold text-brand-primary uppercase tracking-wide mb-3">Future Clarity</p>
              <p className="text-4xl font-bold text-[var(--color-charcoal)]">{baseline.futureClarity ?? "—"}<span className="text-xl text-text-muted">/5</span></p>
            </div>
          </div>

          {/* Back Button */}
          <button
            onClick={() => router.push("/progress")}
            className="flex items-center gap-2 text-brand-primary font-semibold hover:text-brand-primary/80 transition"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Progress
          </button>
        </div>
      </FullScreenLayout>
    );
  }

  return (
    <FullScreenLayout bgClass="bg-bg-card">
      <div className="flex-1 overflow-y-auto">
        <div className="bg-white sticky top-0 z-30">
          <WizardHeader title="About U" />
        </div>
        <div className="max-w-5xl mx-auto px-4 pb-4 w-full pt-4">

          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-4 max-w-xl mx-auto">
            <div className="flex gap-2 flex-1">
              {SECTIONS.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${idx <= currentSection ? "bg-brand-primary" : "bg-gray-100"
                    }`}
                />
              ))}
            </div>
          </div>

          {/* Section title centered */}
          <div className="text-center mb-4">
            <p className="text-xl font-semibold text-[var(--color-charcoal)]">
              {section.title}
            </p>
          </div>

          {/* Section content */}
          <div className="space-y-4 max-w-xl mx-auto">
            {section.id === "situation" && (
              <>
                <div className="text-center space-y-3">
                  <p className="text-[var(--color-charcoal)] text-base">
                    Which best describes where you&apos;re at right now?
                  </p>
                  <ChoiceChips
                    className="justify-center"
                    options={WORK_STATUS_OPTIONS}
                    value={responses.workStatus ?? null}
                    onChange={(v) => updateResponse("workStatus", v as WorkStatus)}
                  />
                </div>

                {responses.workStatus != null && (
                  <div className="p-3 xs:p-4 md:p-5 bg-white rounded-2xl md:rounded-3xl border border-gray-100 space-y-2 xs:space-y-3 md:space-y-6 animate-fade-in text-center">
                    <p className="text-[var(--color-charcoal)] text-sm xs:text-base md:text-lg text-center">
                      How satisfied are you with your current situation?
                    </p>
                    <RatingScale
                      value={responses.situationSatisfaction ?? null}
                      onChange={(v) => updateResponse("situationSatisfaction", v)}
                      lowLabel="Not at all"
                      highLabel="Very satisfied"
                    />
                  </div>
                )}
              </>
            )}

            {section.id === "wellbeing" && (
              <>
                <div className="p-3 xs:p-4 md:p-5 bg-white rounded-2xl md:rounded-3xl border border-gray-100 space-y-2 xs:space-y-3 md:space-y-6 text-center">
                  <p className="text-[var(--color-charcoal)] text-sm xs:text-base md:text-lg">
                    How well do you manage stress?
                  </p>
                  <RatingScale
                    value={responses.stressLevel ?? null}
                    onChange={(v) => updateResponse("stressLevel", v)}
                    lowLabel="Not well"
                    highLabel="Very well"
                  />
                </div>

                {responses.stressLevel != null && (
                  <div className="p-3 xs:p-4 md:p-5 bg-white rounded-2xl md:rounded-3xl border border-gray-100 space-y-2 xs:space-y-3 md:space-y-6 animate-fade-in text-center">
                    <p className="text-[var(--color-charcoal)] text-sm xs:text-base md:text-lg">
                      How would you rate your energy most days?
                    </p>
                    <RatingScale
                      value={responses.energyLevel ?? null}
                      onChange={(v) => updateResponse("energyLevel", v)}
                      lowLabel="Very low"
                      highLabel="Very high"
                    />
                  </div>
                )}

                {responses.energyLevel != null && (
                  <div className="p-3 xs:p-4 md:p-5 bg-white rounded-2xl md:rounded-3xl border border-gray-100 space-y-2 xs:space-y-3 md:space-y-6 animate-fade-in text-center">
                    <p className="text-[var(--color-charcoal)] text-sm xs:text-base md:text-lg">
                      How would you rate your life balance right now?
                    </p>
                    <RatingScale
                      value={responses.lifeBalance ?? null}
                      onChange={(v) => updateResponse("lifeBalance", v)}
                      lowLabel="Out of balance"
                      highLabel="Well balanced"
                    />
                  </div>
                )}
              </>
            )}

            {section.id === "skills" && (
              <>
                <div className="p-3 xs:p-4 md:p-5 bg-white rounded-2xl md:rounded-3xl border border-gray-100 space-y-2 xs:space-y-3 md:space-y-6 animate-fade-in text-center">
                  <p className="text-[var(--color-charcoal)] text-sm xs:text-base md:text-lg text-center">
                    How confident do you feel about developing your skills and learning right now?
                  </p>
                  <RatingScale
                    value={responses.skillsConfidence ?? null}
                    onChange={(v) => updateResponse("skillsConfidence", v)}
                    lowLabel="Not confident"
                    highLabel="Very confident"
                  />
                </div>

                {responses.skillsConfidence != null && (
                  <div className="text-center space-y-3">
                    <p className="text-[var(--color-charcoal)] text-base">
                      Which best describes where you&apos;re at right now?
                    </p>
                    <ChoiceChips
                      className="justify-center"
                      options={SKILLS_CURRENT_STATUS_OPTIONS}
                      value={responses.skillsCurrentStatus ?? null}
                      onChange={(v) => updateResponse("skillsCurrentStatus", v as SkillsCurrentStatus)}
                    />
                  </div>
                )}

                {/* {responses.skillsCurrentStatus != null && (
                  <div className="text-center space-y-3">
                    <p className="text-[var(--color-charcoal)] text-base">
                      Which best describes where you&apos;re at right now?
                    </p>
                    <ChoiceChips
                      className="justify-center"
                      options={SKILLS_CURRENT_STATUS_OPTIONS2}
                      value={responses.skillsCurrentStatus ?? null}
                      onChange={(v) => updateResponse("skillsCurrentStatus", v as SkillsCurrentStatus)}
                    />
                  </div>
                )} */}
              </>
            )}

            {section.id === "confidence" && (
              <>
                <div className="p-3 xs:p-4 md:p-5 bg-white rounded-2xl md:rounded-3xl border border-gray-100 space-y-2 xs:space-y-3 md:space-y-6 text-center">
                  <p className="text-[var(--color-charcoal)] text-sm xs:text-base md:text-lg">
                    How confident do you feel in yourself right now?
                  </p>
                  <RatingScale
                    value={responses.confidence ?? null}
                    onChange={(v) => updateResponse("confidence", v)}
                    lowLabel="Not confident"
                    highLabel="Very confident"
                  />
                </div>
              </>
            )}

            {section.id === "aspirations" && (
              <>
                <div className="p-3 xs:p-4 md:p-5 bg-white rounded-2xl md:rounded-3xl border border-gray-100 space-y-2 xs:space-y-3 md:space-y-6 text-center">
                  <p className="text-[var(--color-charcoal)] text-sm xs:text-base md:text-lg">
                    How clear do you feel about what you want for your future?
                  </p>
                  <RatingScale
                    value={responses.futureClarity ?? null}
                    onChange={(v) => updateResponse("futureClarity", v)}
                    lowLabel="Not clear"
                    highLabel="Very clear"
                  />
                </div>

                {responses.futureClarity != null && (
                  <div className="p-3 xs:p-4 md:p-5 bg-white rounded-2xl md:rounded-3xl border border-gray-100 space-y-2 xs:space-y-3 md:space-y-6 animate-fade-in text-center">
                    <p className="text-[var(--color-charcoal)] text-sm xs:text-base md:text-lg">
                      How positive do you feel about your future?
                    </p>
                    <RatingScale
                      value={responses.futureHope ?? null}
                      onChange={(v) => updateResponse("futureHope", v)}
                      lowLabel="Not positive"
                      highLabel="Very positive"
                    />
                  </div>
                )}
              </>
            )}



            {section.id === "reminder" && (
              <>
                {/* Tip Box */}
                <div className="flex items-start gap-3 p-4 bg-brand-primary/5 rounded-2xl border border-brand-primary/10">
                  <Sparkles className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-brand-primary/80 leading-relaxed italic text-left">
                    Tip: Choose a day and time that is quiet and allows you to focus on you. Sundays can be a good day to reflect and plan.
                  </p>
                </div>

                {/* Show Pick a day card only when no day selected yet */}
                {reminderDay == null && (
                  <div className="p-3 xs:p-4 md:p-5 bg-white rounded-2xl md:rounded-3xl border border-gray-100 text-center space-y-3 xs:space-y-3 md:space-y-4">
                    <p className="text-[var(--color-charcoal)] text-sm xs:text-base md:text-lg">
                      Pick a day
                    </p>
                    <ChoiceChips
                      className="justify-center flex-wrap"
                      options={DAY_OPTIONS}
                      value={reminderDay}
                      onChange={(v) => setReminderDay(v as ReminderDay)}
                    />
                  </div>
                )}

                {/* Once day is selected, show combined card with edit option */}
                {reminderDay != null && (
                  <div className="p-3 xs:p-4 md:p-5 bg-white rounded-2xl md:rounded-3xl border border-gray-100 space-y-3 animate-fade-in text-center" role="radiogroup" aria-label="Weekly check-in time">
                    {/* Selected day with edit option */}
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                      <span>Every</span>
                      <button
                        onClick={() => setReminderDay(null)}
                        className="px-3 py-1 bg-brand-primary/10 text-brand-primary rounded-full font-medium hover:bg-brand-primary/20 transition-colors flex items-center gap-1"
                      >
                        {DAY_OPTIONS.find(d => d.value === reminderDay)?.label}
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                        </svg>
                      </button>
                    </div>

                    <p className="text-gray-900 font-medium text-sm md:text-base">Pick a time</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                      <TimeOption
                        time="10:00 AM"
                        label="Morning"
                        description="Start your week with reflection"
                        icon={Sunrise}
                        selected={reminderTime === "morning"}
                        onSelect={() => setReminderTime("morning")}
                      />
                      <TimeOption
                        time="6:00 PM"
                        label="Evening"
                        description="Wind down and plan your week"
                        icon={Sunset}
                        selected={reminderTime === "evening"}
                        onSelect={() => setReminderTime("evening")}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Contextual Action Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe z-50">
        <div className="flex justify-between items-center h-16 max-w-5xl mx-auto w-full px-6">
          {/* Back */}
          <button
            onClick={handleBack}
            disabled={currentSection === 0}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${currentSection === 0
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-400 hover:text-brand-primary"
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            <span className="text-xs mt-1">Back</span>
          </button>

          {/* Cancel */}
          <button
            onClick={handleCancel}
            className="flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-brand-primary transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
            <span className="text-xs mt-1">Cancel</span>
          </button>

          {/* Next/Continue */}
          <button
            onClick={handleNext}
            disabled={!isSectionComplete()}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${isSectionComplete()
              ? "text-brand-primary"
              : "text-gray-300 cursor-not-allowed"
              }`}
          >
            {isLastSection ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
                <span className="text-xs mt-1 font-medium">Continue</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
                <span className="text-xs mt-1">Next</span>
              </>
            )}
          </button>
        </div>
      </nav>
    </FullScreenLayout>
  );
}
