"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Goal, createGoal, GoalCategory, Step } from "@/lib/storage";
import { FullScreenLayout } from "@/components/layouts/FullScreenLayout";
import { StepInput } from "@/components/ui/StepInput";
import { StepItem } from "@/components/ui/StepItem";
import { CelebrationScreen } from "@/components/ui/CelebrationScreen";
import DailyQuote from "@/components/ui/DailyQuote";
import {
  Target,
  Sparkles,
  Calendar,
  Heart,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  ListTodo,
  Ruler,
  X,

  Briefcase,
  Coins,
  Sprout,
  Home,
  Check,
  Compass,
  type LucideIcon
} from "lucide-react";

type GoalCreationStep =
  | "intro"
  | "category"
  | "why"
  | "title"
  | "measurable"
  | "achievable"
  | "date"
  | "steps"
  | "done";

interface StepDraft {
  title: string;
  targetDate?: string;
}

interface FullGoalDraft {
  title: string;
  category: GoalCategory;
  whyMatters: string;
  successCriteria: string;
  confidence: number | null;
  targetDate: string;
  steps: StepDraft[];
}

const CATEGORY_CONTENT: Record<GoalCategory, {
  tip: string;
  description: string;
  titlePlaceholder: string;
  whyPlaceholder: string;
  measurablePlaceholder: string;
  stepPlaceholder: string;
}> = {
  "Career": {
    tip: "Career goals help you shape your professional future - whether that's aiming for a promotion, exploring a new role, or taking steps toward self-employment. This is your space to set goals that move you toward the career path you truly want, at a pace that works for you.",
    description: "Shape your professional future",
    titlePlaceholder: "e.g. Apply for 3 new jobs",
    whyPlaceholder: "e.g. I want to feel more confident in my professional skills and open up new opportunities for growth",
    measurablePlaceholder: "e.g. Apply for 3 jobs, update my CV, complete 2 networking conversations, secure 1 interview...",
    stepPlaceholder: "e.g. Update CV and LinkedIn profile"
  },
  "Wellbeing": {
    tip: "Wellbeing goals help you care for yourself so you can thrive in all areas of life. You might set a goal to take part in activities that re-energise you, such as a weekly nature walk, or to prioritise rest and recovery through intentional downtime or a calming evening routine.",
    description: "Support your physical and mental health",
    titlePlaceholder: "e.g. 30-min walk 3× weekly",
    whyPlaceholder: "e.g. I want to feel more energised so I can spend better quality time with my family...",
    measurablePlaceholder: "e.g. Complete 3 walks per week, feel more rested, notice improved energy levels...",
    stepPlaceholder: "e.g. Schedule 3 walks in my calendar"
  },
  "Skills, Education & Learning": {
    tip: "Personal growth is your opportunity to expand your knowledge and skills through lifelong learning. You might set a goal to enrol in a short, accredited qualification, take an online course to build a new skill, or pursue learning that supports both personal and professional development.",
    description: "Build new skills and knowledge",
    titlePlaceholder: "e.g. Learn basic coding skills",
    whyPlaceholder: "e.g. I want to build new skills that will help me feel more capable and confident in different areas of my life...",
    measurablePlaceholder: "e.g. Complete 1 online course, practice new skill 3 times per week, earn a certificate...",
    stepPlaceholder: "e.g. Research and enroll in a course"
  },
  "Relationships": {
    tip: "Relationships are key to a fulfilling life. You might set a goal to spend quality time with family or friends, strengthen important connections, or build professional relationships and networks that support your future opportunities.",
    description: "Nurture the connections that matter",
    titlePlaceholder: "e.g. Practice active listening",
    whyPlaceholder: "e.g. I want to strengthen my connections with people who matter to me and feel less isolated...",
    measurablePlaceholder: "e.g. Have 1 meaningful conversation per week, arrange 2 social activities, reconnect with 3 friends...",
    stepPlaceholder: "e.g. Text a friend to attend an event"
  },
  "Finance": {
    tip: "Financial goals help you create stability, security, and a more comfortable way of living. This might include easing financial pressure, enjoying more time and experiences with your family, or having more flexibility and control over your future.",
    description: "Create stability and security",
    titlePlaceholder: "e.g. Save £500 travel fund",
    whyPlaceholder: "e.g. I want to feel more secure and have less stress about unexpected expenses...",
    measurablePlaceholder: "e.g. Save £50 per week, reduce spending by £100 per month, build £500 emergency fund...",
    stepPlaceholder: "e.g. Set up automatic savings transfer"
  },
  "other": {
    tip: "",
    description: "",
    titlePlaceholder: "",
    whyPlaceholder: "",
    measurablePlaceholder: "",
    stepPlaceholder: ""
  }
};

/**
 * Goal Creation Wizard
 * 
 * Flow: Why (Relevant) → Title (Specific) → Measurable → Achievable → Target Date (Time-bound) → Steps → Done
 */
export default function NewGoalPage() {
  const router = useRouter();
  const [step, setStep] = useState<GoalCreationStep>("intro");
  const [draft, setDraft] = useState<FullGoalDraft>({
    title: "",
    category: "Career",
    whyMatters: "",
    successCriteria: "",
    confidence: null,
    targetDate: "",
    steps: [],
  });

  const STEPS_ORDER: GoalCreationStep[] = [
    "intro",
    "category",
    "title",
    "why",
    "measurable",
    "achievable",
    "date",
    "steps",
    "done"
  ];

  const currentIndex = STEPS_ORDER.indexOf(step);
  const totalStepsCount = STEPS_ORDER.length - 1; // Exclude 'done'

  const handleNext = () => {
    const nextStep = STEPS_ORDER[currentIndex + 1];
    if (nextStep) setStep(nextStep);
  };

  const handleBack = () => {
    const prevStep = STEPS_ORDER[currentIndex - 1];
    if (prevStep) setStep(prevStep);
    else router.back();
  };

  const handleSave = () => {
    const newGoalData: Omit<Goal, "id" | "createdAt" | "status" | "steps"> & { steps: Step[] } = {
      title: draft.title,
      category: draft.category,
      whyMatters: draft.whyMatters,
      successCriteria: draft.successCriteria,
      confidence: draft.confidence || 3,
      targetDate: draft.targetDate,
      steps: draft.steps.map(s => ({
        ...s,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        completed: false
      })),
      feelWhenDone: "",
      actions: []
    };

    createGoal(newGoalData);
    setStep("done");
  };

  const updateDraft = (key: keyof FullGoalDraft, value: string | number | StepDraft[] | null) => {
    setDraft({ ...draft, [key]: value });
  };

  const canProceed = () => {
    switch (step) {
      case "intro": return true;
      case "category": return !!draft.category;
      case "why": return draft.whyMatters.trim().length >= 5;
      case "title": return draft.title.trim().length >= 3;
      case "measurable": return !!draft.successCriteria?.trim();
      case "achievable": return draft.confidence !== null;
      case "date": return !!draft.targetDate;
      case "steps": return draft.steps.length > 0;
      default: return true;
    }
  };

  const addStep = (s: StepDraft) => {
    setDraft({ ...draft, steps: [...draft.steps, s] });
  };

  const removeStep = (index: number) => {
    setDraft({
      ...draft,
      steps: draft.steps.filter((_, i) => i !== index),
    });
  };

  if (step === "done") {
    return (
      <CelebrationScreen
        progress={100}
        icon={Sparkles}
        title="Goal Locked In!"
        subtitle={`You've set a goal with ${draft.steps.length} step${draft.steps.length !== 1 ? "s" : ""}. Time to take action!`}
        buttonText="GO TO MY GOALS"
        onButtonClick={() => router.push("/goals")}
      />
    );
  }

  return (
    <FullScreenLayout bgClass="bg-bg-card">
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Header - centered */}
        <header className="bg-white sticky top-0 z-30 border-b border-gray-100">
          <div className="max-w-xl mx-auto w-full px-6 py-4 flex items-center justify-center gap-3">
            <Target className="w-6 h-6 text-brand-primary" />
            <h1 className="text-2xl text-[var(--color-charcoal)]">New Goal</h1>
          </div>
        </header>

        <div className="max-w-xl mx-auto w-full px-6 pt-8 pb-32">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex gap-1.5 flex-1">
              {STEPS_ORDER.slice(0, -1).map((s, idx) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${idx <= currentIndex ? "bg-brand-primary" : "bg-gray-100"
                    }`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-8">
            {/* Step 0: Intro Quote */}
            {step === "intro" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <DailyQuote
                  quote="Set goals across the areas that shape your career and your life, so progress feels balanced, sustainable, and true to you."
                  title="Guide"
                />
              </div>
            )}

            {/* Step 1: Category */}
            {step === "category" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
                    <Compass className="w-6 h-6 text-brand-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">What area of life?</h2>
                    <p className="text-gray-500 text-sm">Choose a category for your goal</p>
                  </div>
                </div>

                <div className="p-5 bg-white rounded-3xl border border-gray-100">
                  <div className="grid grid-cols-1 gap-3">
                    {([
                      { name: "Career", icon: Briefcase },
                      { name: "Finance", icon: Coins },
                      { name: "Skills, Education & Learning", icon: Sprout },
                      { name: "Wellbeing", icon: Heart },
                      { name: "Relationships", icon: Home },
                    ] as { name: GoalCategory; icon: LucideIcon }[]).map(({ name, icon: Icon }) => {
                      const isActive = draft.category === name;
                      return (
                        <div key={name} className="flex flex-col gap-2">
                          <button
                            onClick={() => updateDraft("category", name)}
                            className={`flex items-center gap-3 min-h-[70px] py-4 px-5 rounded-2xl text-base font-medium transition-all capitalize ${isActive
                              ? "bg-brand-primary text-white"
                              : "bg-gray-50 text-gray-900 hover:bg-gray-100"
                              }`}
                          >
                            <Icon className={isActive ? "w-5 h-5 text-white" : "w-5 h-5 text-gray-700"} />
                            <div className="flex-1 text-left">
                              <div className={`text-lg font-semibold ${isActive ? "text-white" : "text-gray-900"}`}>{name}</div>
                              <div className={`text-xs leading-snug ${isActive ? "text-white/80" : "text-gray-500"}`}>{CATEGORY_CONTENT[name].description}</div>
                            </div>
                          </button>
                          {isActive && (
                            <div className="flex items-start gap-3 p-4 bg-brand-primary/5 rounded-2xl border border-brand-primary/10">
                              <Sparkles className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                              <p className="text-sm text-brand-primary/80 leading-relaxed italic">
                                {CATEGORY_CONTENT[name].tip}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Why */}
            {step === "why" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-brand-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Why this goal?</h2>
                    <p className="text-gray-500 text-sm">Connect with your motivation</p>
                  </div>
                </div>

                <div className="p-5 bg-white rounded-3xl border border-gray-100 space-y-4">
                  <label className="text-[10px] font-bold text-[var(--color-magenta)] uppercase tracking-widest px-1">
                    What makes this goal important to you right now?
                  </label>
                  <textarea
                    autoFocus
                    value={draft.whyMatters}
                    onChange={(e) => updateDraft("whyMatters", e.target.value)}
                    placeholder={CATEGORY_CONTENT[draft.category].whyPlaceholder}
                    className="w-full min-h-[160px] p-4 rounded-2xl bg-gray-50 border-none focus:outline-none focus:ring-2 focus:ring-brand-primary/40 text-gray-900 resize-none text-base leading-relaxed"
                  />
                  <div className="flex items-start gap-3 p-4 bg-brand-primary/5 rounded-2xl border border-brand-primary/10">
                    <Sparkles className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-brand-primary/80 leading-relaxed italic">
                      Tip: Think about what achieving this goal will bring you, what does it change, how does it make you feel – the more detail, the better.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Title */}
            {step === "title" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
                    <Target className="w-6 h-6 text-brand-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">What is the goal?</h2>
                    <p className="text-gray-500 text-sm">Keep it simple and actionable</p>
                  </div>
                </div>

                <div className="p-5 bg-white rounded-3xl border border-gray-100 space-y-4">
                  <label className="text-[10px] font-bold text-[var(--color-magenta)] uppercase tracking-widest px-1">
                    Give your goal a clear, inspiring title
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={draft.title}
                    onChange={(e) => updateDraft("title", e.target.value)}
                    placeholder={CATEGORY_CONTENT[draft.category].titlePlaceholder}
                    className="w-full h-14 px-5 rounded-2xl bg-gray-50 border-none focus:outline-none focus:ring-2 focus:ring-brand-primary/40 text-gray-900 text-base"
                  />
                  <div className="flex items-start gap-3 p-4 bg-brand-primary/5 rounded-2xl border border-brand-primary/10">
                    <Sparkles className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-brand-primary/80 leading-relaxed italic">
                      Empowering you to take action,
                      Moving forward with intention
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Measurable */}
            {step === "measurable" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
                    <Ruler className="w-6 h-6 text-brand-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">How you&apos;ll know</h2>
                    <p className="text-gray-500 text-sm">Decide how progress will be tracked</p>
                  </div>
                </div>

                <div className="p-5 bg-white rounded-3xl border border-gray-100 space-y-4">
                  {/* Goal Title Display */}
                  <div className="px-1">
                    <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest block mb-1">GOAL</span>
                    <h3 className="text-lg font-bold text-gray-900 leading-tight">{draft.title}</h3>
                  </div>

                  <label className="text-[10px] font-bold text-[var(--color-magenta)] uppercase tracking-widest block px-1 pt-2">
                    How will you measure your success?
                  </label>
                  <textarea
                    autoFocus
                    value={draft.successCriteria}
                    onChange={(e) => updateDraft("successCriteria", e.target.value)}
                    placeholder={CATEGORY_CONTENT[draft.category].measurablePlaceholder}
                    className="w-full min-h-[120px] p-4 rounded-2xl bg-gray-50 border-none focus:outline-none focus:ring-2 focus:ring-brand-primary/40 text-gray-900 resize-none text-base leading-relaxed"
                  />
                  <div className="flex items-start gap-3 p-4 bg-brand-primary/5 rounded-2xl border border-brand-primary/10">
                    <Sparkles className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-brand-primary/80 leading-relaxed italic">
                      Tip: This doesn’t need to be measured in numbers. It might be a change in how you feel, what
                      you’re doing more of, or what feels easier over time.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Achievable */}
            {step === "achievable" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-brand-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Readiness Check</h2>
                    <p className="text-gray-500 text-sm">Be honest with yourself</p>
                  </div>
                </div>

                <div className="p-5 bg-white rounded-3xl border border-gray-100 space-y-6">
                  <label className="text-[10px] font-bold text-[var(--color-magenta)] uppercase tracking-widest block text-center">
                    On a scale of 1-5, how confident are you that you can achieve this?
                  </label>

                  <div className="flex items-center justify-center gap-2 sm:gap-3 max-w-sm mx-auto">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        onClick={() => updateDraft("confidence", level)}
                        className={`w-14 h-14 rounded-lg font-bold text-xl transition-all ${draft.confidence === level
                          ? "bg-brand-primary text-white scale-105 shadow-md"
                          : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                          }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest max-w-sm mx-auto px-2">
                    <span>Not confident</span>
                    <span>Very confident</span>
                  </div>

                  {draft.confidence && draft.confidence <= 2 && (
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800 leading-relaxed">
                        It&apos;s okay to be nervous. In the next steps, we&apos;ll break this into smaller, more manageable pieces.
                      </p>
                    </div>
                  )}
                  <div className="flex items-start gap-3 p-4 bg-brand-primary/5 rounded-2xl border border-brand-primary/10">
                    <Sparkles className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-brand-primary/80 leading-relaxed italic">
                      Tip: Your answer helps you decide whether this goal feels realistic and achievable right now.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Date */}
            {step === "date" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-brand-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Set a target</h2>
                    <p className="text-gray-500 text-sm">When do you want to achieve this?</p>
                  </div>
                </div>

                <div className="p-5 bg-white rounded-3xl border border-gray-100 space-y-4">
                  <label className="text-[10px] font-bold text-[var(--color-magenta)] uppercase tracking-widest px-1">
                    Choose your target date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-primary" />
                    <input
                      type="date"
                      value={draft.targetDate}
                      onChange={(e) => updateDraft("targetDate", e.target.value)}
                      className="w-full h-14 px-5 pl-14 rounded-2xl bg-gray-50 border-none focus:outline-none focus:ring-2 focus:ring-brand-primary/40 text-gray-900 text-base appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {[
                      { label: "1 Week", days: 7 },
                      { label: "2 Weeks", days: 14 },
                      { label: "1 Month", days: 30 },
                      { label: "3 Months", days: 90 },
                    ].map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => {
                          if (opt.days > 0) {
                            const d = new Date();
                            d.setDate(d.getDate() + opt.days);
                            updateDraft("targetDate", d.toISOString().split("T")[0]);
                          }
                        }}
                        className="h-14 px-4 rounded-2xl bg-gray-50 text-gray-600 font-medium text-sm hover:bg-gray-100 transition-colors border border-transparent active:border-brand-primary/20"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-brand-primary/5 rounded-2xl border border-brand-primary/10">
                    <Sparkles className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-brand-primary/80 leading-relaxed italic">
                      Tip: Choose a timeframe that feels realistic and achievable for your life right now - it’s okay to
                      start small and adjust later.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Steps */}
            {step === "steps" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
                    <ListTodo className="w-6 h-6 text-brand-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Take the first steps</h2>
                    <p className="text-gray-500 text-sm">Break it down to get started</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <StepInput onAdd={addStep} placeholder={CATEGORY_CONTENT[draft.category].stepPlaceholder} />

                  {draft.steps.length > 0 && (
                    <div className="space-y-4 pt-4">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">
                        Your steps ({draft.steps.length}):
                      </p>
                      <div className="space-y-2">
                        {draft.steps.map((s, index) => (
                          <StepItem
                            key={index}
                            title={s.title}
                            targetDate={s.targetDate}
                            onRemove={() => removeStep(index)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3 p-4 bg-brand-primary/5 rounded-2xl border border-brand-primary/10">
                    <Sparkles className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-brand-primary/80 leading-relaxed italic">
                      Tip: Start with one small, clear action - something you could realistically do this week.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contextual Sticky Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe z-50 animate-in slide-in-from-bottom duration-500">
        <div className="flex justify-around items-center h-20 max-w-xl mx-auto px-6">
          <button
            onClick={handleBack}
            className="flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-brand-primary transition-colors gap-1"
          >
            <ChevronLeft className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Back</span>
          </button>

          <button
            onClick={() => router.back()}
            className="flex flex-col items-center justify-center w-full h-full text-brand-primary transition-colors gap-1"
          >
            <div className="w-12 h-12 bg-brand-primary/10 rounded-full flex items-center justify-center mb-1 group-active:scale-95 transition-transform">
              <X className="w-6 h-6 text-brand-primary" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest -mt-1">Cancel</span>
          </button>

          <button
            onClick={currentIndex === totalStepsCount - 1 ? handleSave : handleNext}
            disabled={!canProceed()}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors gap-1 ${canProceed() ? "text-brand-primary" : "text-gray-300 pointer-events-none"
              }`}
          >
            {currentIndex === totalStepsCount - 1 ? (
              <Check className="w-6 h-6" />
            ) : (
              <ChevronRight className="w-6 h-6" />
            )}
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {currentIndex === totalStepsCount - 1 ? "Save" : "Next"}
            </span>
          </button>
        </div>
      </nav>
    </FullScreenLayout>
  );
}
