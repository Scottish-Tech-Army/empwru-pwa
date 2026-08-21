"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  getGoalById,
  loadGoalByIdFromSupabase,
  Step,
  toggleStep,
  updateGoal,
  deleteGoal,
  addStep,
  deleteStep,
  updateStep,
  Goal,
  GoalCategory
} from "@/lib/storage";
import {
  Calendar,
  Sparkles,
  Heart,
  Plus,
  Trash2,
  Pencil,
  Check,
  CheckCircle2,
  AlertCircle,
  Ruler,
  Tag,
  X,
  Activity,
  Briefcase,
  Coins,
  Sprout,
  Home,
  Trophy,
  Pause,
  Play,
  ListTodo,
  Target,
  type LucideIcon
} from "lucide-react";
import { FullScreenLayout } from "@/components/layouts/FullScreenLayout";
import BottomSheet from "@/components/ui/BottomSheet";
import { CelebrationScreen } from "@/components/ui/CelebrationScreen";

const todayISO = new Date().toISOString().split("T")[0];

export default function GoalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [goal, setGoal] = useState<Goal | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [showWhyEditor, setShowWhyEditor] = useState(false);
  const [editWhyTitle, setEditWhyTitle] = useState("");
  const [editWhyMatters, setEditWhyMatters] = useState("");
  const [showCategoryEditor, setShowCategoryEditor] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<GoalCategory | null>(null);
  const [showSuccessEditor, setShowSuccessEditor] = useState(false);
  const [editSuccessCriteria, setEditSuccessCriteria] = useState("");
  const [showReadinessEditor, setShowReadinessEditor] = useState(false);
  const [selectedReadiness, setSelectedReadiness] = useState<number | null>(null);
  const [showTimelineEditor, setShowTimelineEditor] = useState(false);
  const [editTargetDate, setEditTargetDate] = useState("");

  // New Step State
  const [isAddingStep, setIsAddingStep] = useState(false);
  const [newStepTitle, setNewStepTitle] = useState("");
  const [newStepDate, setNewStepDate] = useState("");

  // Edit Step State
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDate, setEditingDate] = useState("");

  // Celebration state
  const [showCelebration, setShowCelebration] = useState(false);
  const [showCompletionConfirm, setShowCompletionConfirm] = useState(false);

  const refreshGoal = useCallback(async () => {
    if (!id) return;

    const data = await loadGoalByIdFromSupabase(id);
    if (data) {
      setGoal(data);
    } else {
      router.push("/goals");
    }
  }, [id, router]);

  useEffect(() => {
    void refreshGoal();
  }, [refreshGoal]);

  const handleStepToggle = (stepId: string) => {
    if (!goal) return;

    // Check if this toggle will complete the goal
    const step = goal.steps.find(s => s.id === stepId);
    if (!step) return;

    const willComplete = !step.completed; // Step is about to be toggled to complete
    const otherStepsComplete = goal.steps.filter(s => s.id !== stepId).every(s => s.completed);
    const willBeFullyComplete = willComplete && otherStepsComplete && goal.steps.length > 0;

    toggleStep(goal.id, stepId);
    refreshGoal();

    // Show confirmation modal if goal just became 100% complete
    if (willBeFullyComplete) {
      setShowCompletionConfirm(true);
    }
  };

  const handleConfirmCompletion = () => {
    if (!goal) return;
    updateGoal(goal.id, { status: "completed" });
    refreshGoal();
    setShowCompletionConfirm(false);
    setShowCelebration(true);
  };

  const handleAddStep = () => {
    if (!goal || !newStepTitle.trim()) return;

    addStep(goal.id, {
      title: newStepTitle.trim(),
      targetDate: newStepDate || undefined,
    });

    refreshGoal();
    setNewStepTitle("");
    setNewStepDate("");
    setIsAddingStep(false);
  };

  const handleDeleteStep = (stepId: string) => {
    if (!goal) return;
    deleteStep(goal.id, stepId);
    refreshGoal();
  };

  const handleStartEdit = (s: Step) => {
    setEditingStepId(s.id);
    setEditingTitle(s.title);
    setEditingDate(s.targetDate || "");
  };

  const handleSaveEdit = () => {
    if (!goal || !editingStepId || !editingTitle.trim()) return;

    updateStep(goal.id, editingStepId, {
      title: editingTitle.trim(),
      targetDate: editingDate || undefined,
    });

    setEditingStepId(null);
    refreshGoal();
  };

  const handleUpdateGoal = (updates: Partial<Goal>) => {
    if (!goal) return;
    updateGoal(goal.id, updates);
    refreshGoal();
  };

  const handleDeleteGoal = () => {
    if (!goal) return;
    deleteGoal(goal.id);
    router.push("/goals");
  };

  if (!goal) return null;

  // Show celebration when goal is completed
  if (showCelebration) {
    return (
      <CelebrationScreen
        progress={100}
        icon={Trophy}
        title="Goal Achieved!"
        subtitle={`Congratulations! You've completed your goal. Time to celebrate!`}
        buttonText="BACK TO GOAL"
        onButtonClick={() => setShowCelebration(false)}
      />
    );
  }

  const isCompleted = goal.status === "completed";
  const progress = goal.steps.length > 0
    ? Math.round((goal.steps.filter(s => s.completed).length / goal.steps.length) * 100)
    : 0;

  // Format date safely

  // Calculate days remaining
  const daysRemaining = goal.targetDate
    ? Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="min-h-dvh bg-bg-card pb-32">
      <header className="pt-6 pb-4 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="w-8 h-8 text-brand-primary" />
            <h1 className="text-2xl text-[var(--color-charcoal)]">Your Goal</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
              aria-label="Delete goal"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                if (goal) {
                  const newStatus = goal.status === "paused" ? "active" : "paused";
                  updateGoal(goal.id, { status: newStatus });
                  refreshGoal();
                }
              }}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-amber-500 hover:bg-amber-50 transition-all"
              aria-label={goal.status === "paused" ? "Resume goal" : "Pause goal"}
            >
              {goal.status === "paused" ? (
                <Play className="w-5 h-5" />
              ) : (
                <Pause className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      <FullScreenLayout.Content centered={false}>
        <div className="space-y-6">
          {/* Row 1: Primary Goal Card & Progress Card */}
          <div className="grid grid-cols-1 md:grid-cols-[repeat(20,minmax(0,1fr))] gap-6">
            {/* Goal Info Card (13/20 = 65%) */}
            <div className="md:col-span-[13] bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_0_15px_rgba(0,0,0,0.08)] relative overflow-hidden group">
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                      <Heart className="w-5 h-5 text-brand-primary" />
                    </div>
                    <span className="text-xs font-bold text-brand-primary uppercase tracking-widest">Your WHY</span>
                  </div>
                  <button
                    onClick={() => {
                      setEditWhyTitle(goal.title);
                      setEditWhyMatters(goal.whyMatters);
                      setShowWhyEditor(true);
                    }}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10"
                    aria-label="Edit goal"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4 mb-8 overflow-hidden">
                  <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight pr-12 break-words">
                    {goal.title}
                  </h1>
                  <p className="text-lg md:text-xl text-gray-500 leading-relaxed italic pr-8 break-words whitespace-pre-wrap">
                    &quot;{goal.whyMatters}&quot;
                  </p>
                </div>


              </div>
              <Sparkles className="absolute -right-6 -top-6 w-40 h-40 text-brand-primary/5 transform -rotate-12 group-hover:scale-110 transition-transform duration-1000" />
            </div>

            {/* Progress Card (7/20 = 35%) */}
            <div className="md:col-span-[7] bg-brand-gradient rounded-2xl p-6 text-white flex flex-col justify-between relative overflow-hidden group shadow-[0_0_15px_rgba(0,0,0,0.08)]">
              <div className="relative z-10">
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Overall progress</p>

                <div className="space-y-6 mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-8xl font-light tracking-tighter tabular-nums">{progress}</span>
                    <span className="text-3xl font-light opacity-50">%</span>
                  </div>

                  <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white transition-all duration-1000 ease-out rounded-full min-w-3"
                      style={{ width: `${Math.max(progress, 2)}%` }}
                    />
                  </div>
                </div>

                <p className="text-xs font-medium text-white/80 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {isCompleted ? "Goal achieved!" : "Keep the momentum going"}
                </p>
              </div>


            </div>
          </div>

          {/* Row 2: Category (5/20 = 25%) | How You'll Know (15/20 = 75%) */}
          <div className="grid grid-cols-1 md:grid-cols-[repeat(20,minmax(0,1fr))] gap-6">
            {/* Category Card (25%) */}
            <div className="md:col-span-[5] bg-[var(--color-deep-violet)] rounded-2xl p-6 border border-white/10 flex flex-col relative overflow-hidden group">
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[10px] font-bold text-white/60 uppercase tracking-widest leading-none">Category</h3>
                  <button
                    onClick={() => setShowCategoryEditor(true)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-all text-white/40 hover:text-white hover:bg-white/10"
                    aria-label="Edit category"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 flex flex-col justify-center items-center">
                  <div className="text-center">
                    <div className="mb-4 flex justify-center">
                      {(() => {
                        const iconMap: Record<GoalCategory, LucideIcon> = {
                          Wellbeing: Heart,
                          Career: Briefcase,
                          Finance: Coins,
                          "Skills, Education & Learning": Sprout,
                          Relationships: Home,
                          other: Tag
                        };
                        const Icon = iconMap[goal.category] || Activity;
                        return <Icon className="w-12 h-12 text-white" />;
                      })()}
                    </div>
                    <p className="text-2xl font-bold text-white capitalize tracking-tight">
                      {goal.category}
                    </p>
                  </div>
                </div>
              </div>
              {(() => {
                const iconMap: Record<GoalCategory, LucideIcon> = {
                  Wellbeing: Heart,
                  Career: Briefcase,
                  Finance: Coins,
                  "Skills, Education & Learning": Sprout,
                  Relationships: Home,
                  other: Tag
                };
                const Icon = iconMap[goal.category] || Activity;
                return <Icon className="absolute -right-6 -bottom-6 w-32 h-32 text-white/10 transform rotate-12 group-hover:scale-110 transition-transform duration-1000" />;
              })()}
            </div>

            {/* How You'll Know Card (75%) */}
            <div className="md:col-span-[15] bg-brand-primary/5 rounded-2xl p-6 border border-brand-primary/20 flex flex-col relative overflow-hidden group">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[10px] font-bold text-brand-primary uppercase tracking-widest leading-none">How You&apos;ll Know</h3>
                <button
                  onClick={() => {
                    setEditSuccessCriteria(goal.successCriteria || "");
                    setShowSuccessEditor(true);
                  }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all text-brand-primary/40 hover:text-brand-primary hover:bg-brand-primary/10"
                  aria-label="Edit success criteria"
                >
                  <Pencil className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 flex flex-col justify-start overflow-hidden">
                <p className="text-lg font-medium text-gray-800 leading-relaxed break-words whitespace-pre-wrap">
                  {goal.successCriteria || "Define your win criteria."}
                </p>
              </div>
              <Ruler className="absolute -right-6 -bottom-6 w-40 h-40 text-white transform rotate-12 group-hover:scale-110 transition-transform duration-1000" />
            </div>
          </div>

          {/* Row 3: Readiness (15/20 = 75%) | Timeline (5/20 = 25%) */}
          <div className="grid grid-cols-1 md:grid-cols-[repeat(20,minmax(0,1fr))] gap-6">
            {/* Readiness Card (75%) */}
            <div className="md:col-span-[15] bg-white rounded-2xl p-6 border border-gray-100 flex flex-col shadow-[0_0_15px_rgba(0,0,0,0.08)]">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-[10px] font-bold text-brand-primary/60 uppercase tracking-widest leading-none">Readiness</h3>
                <button
                  onClick={() => {
                    setSelectedReadiness(goal.confidence || null);
                    setShowReadinessEditor(true);
                  }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all text-brand-primary/40 hover:text-brand-primary hover:bg-brand-primary/10"
                  aria-label="Edit readiness"
                >
                  <Pencil className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 flex flex-col justify-center space-y-6">
                {/* Mobile: Large number display */}
                <div className="flex md:hidden flex-col items-center justify-center text-center">
                  <span className="text-6xl font-black text-brand-primary leading-none">
                    {goal.confidence || 0}
                  </span>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-2">OUT OF 5</p>
                </div>

                {/* Desktop: Scale display */}
                <div className="hidden md:flex items-center justify-center gap-8">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className="group relative flex flex-col items-center gap-3"
                    >
                      <div className={`w-20 h-20 rounded-2xl flex items-center justify-center font-black text-2xl transition-all duration-300 border ${(goal.confidence || 0) >= level
                        ? "bg-brand-primary text-white border-brand-primary"
                        : "bg-white text-gray-300 border-brand-primary/30"
                        }`}>
                        {level}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden md:flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em] px-4">
                  <span>Not confident</span>
                  <span>Very confident</span>
                </div>
              </div>
            </div>

            {/* Timeline Card (25%) */}
            <div className="md:col-span-[5] bg-[var(--color-magenta)] rounded-2xl p-6 border border-white/10 shadow-[0_0_15px_rgba(0,0,0,0.08)] flex flex-col relative overflow-hidden group">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[10px] font-bold text-white/60 uppercase tracking-widest leading-none">Timeline</h3>
                <button
                  onClick={() => {
                    setEditTargetDate(goal.targetDate || "");
                    setShowTimelineEditor(true);
                  }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all text-white/40 hover:text-white hover:bg-white/10"
                  aria-label="Edit timeline"
                >
                  <Pencil className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <Calendar className="w-10 h-10 text-white mb-4" />
                <span className="text-3xl font-black text-white leading-none">
                  {daysRemaining > 0 ? daysRemaining : 0} Days
                </span>
                <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mt-2">REMAINING</p>
              </div>
              <Calendar className="absolute -right-6 -bottom-6 w-32 h-32 text-white/10 transform rotate-12 group-hover:scale-110 transition-transform duration-1000" />
            </div>
          </div>

          {/* Row 3: Action Steps List (Full Width) */}
          <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_0_15px_rgba(0,0,0,0.08)] relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-4">
                  <ListTodo className="w-8 h-8 text-brand-primary" />
                  Action Plan
                  <div className="bg-gray-100 text-brand-primary text-xs py-1.5 px-4 rounded-full font-black tracking-widest">
                    {goal.steps.filter(s => s.completed).length} / {goal.steps.length}
                  </div>
                </h2>
                <p className="text-gray-400 text-sm mt-1">Break your goal down into small, manageable wins.</p>
              </div>

              {!isCompleted && !isAddingStep && (
                <button
                  onClick={() => setIsAddingStep(true)}
                  className="flex items-center gap-2 py-3 px-6 rounded-2xl bg-brand-primary text-white font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  ADD NEW STEP
                </button>
              )}
            </div>

            <div className="flex flex-col gap-4">
              {[...goal.steps]
                .sort((a, b) => {
                  // Completed items go to the end
                  if (a.completed && !b.completed) return 1;
                  if (!a.completed && b.completed) return -1;
                  // Items with dates come before items without
                  if (a.targetDate && !b.targetDate) return -1;
                  if (!a.targetDate && b.targetDate) return 1;
                  // Sort by date (earliest first)
                  if (a.targetDate && b.targetDate) {
                    return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
                  }
                  return 0;
                })
                .map((step) => (
                  <div key={step.id} className="group relative">
                    {editingStepId === step.id ? (
                      <div className="p-6 bg-white rounded-3xl border-2 border-brand-primary animate-in fade-in zoom-in-95 h-full">
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-brand-primary uppercase px-1">What&apos;s the step?</label>
                            <input
                              autoFocus
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              className="w-full text-base font-bold bg-gray-50 p-3 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-brand-primary/40 text-gray-900"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-brand-primary uppercase px-1">Target Date</label>
                            <div className="flex items-center gap-2 text-gray-500 bg-gray-50 p-3 rounded-xl">
                              <Calendar className="w-4 h-4 text-brand-primary" />
                              <input
                                type="date"
                                value={editingDate}
                                min={todayISO}
                                onChange={(e) => setEditingDate(e.target.value)}
                                className="text-xs border-none focus:outline-none focus:ring-2 focus:ring-brand-primary/40 p-0 bg-transparent flex-1 cursor-pointer font-bold rounded"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-6">
                          <button
                            onClick={handleSaveEdit}
                            className="flex-1 bg-brand-primary text-white py-3 rounded-xl text-xs font-black active:scale-95 transition-transform"
                          >
                            SAVE CHANGES
                          </button>
                          <button
                            onClick={() => setEditingStepId(null)}
                            className="px-4 py-3 text-gray-400 hover:text-gray-600 font-bold text-xs"
                          >
                            CANCEL
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full">
                        <div
                          className={`w-full flex items-center gap-4 text-left p-6 rounded-3xl transition-all border min-h-[100px] h-full ${step.completed
                            ? "bg-warm-ivory border-brand-primary/20 text-brand-primary"
                            : "bg-white border-gray-100 hover:border-brand-primary/20 text-gray-900"
                            }`}
                        >
                          <button
                            onClick={() => !isCompleted && handleStepToggle(step.id)}
                            disabled={isCompleted}
                            className="flex items-center gap-4 flex-1 min-w-0"
                          >
                            <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all duration-300 ${step.completed
                              ? "bg-brand-primary border-brand-primary text-white scale-110"
                              : "bg-transparent border-gray-200"
                              }`}>
                              {step.completed && <Check className="w-5 h-5 stroke-[3]" />}
                            </div>

                            <div className="flex-1 min-w-0 text-left">
                              <p className={`text-base font-bold leading-tight ${step.completed ? "text-brand-primary line-through opacity-60" : "text-gray-900"
                                }`}>
                                {step.title}
                              </p>
                              {step.targetDate && !step.completed && (() => {
                                const target = new Date(step.targetDate);
                                const today = new Date();
                                const isOverdue = target < today;

                                return (
                                  <div className={`flex items-center gap-1.5 mt-2 ${isOverdue ? "text-red-500" : "text-gray-400"}`}>
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-black uppercase tracking-wider">
                                      {target.toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                                    </span>
                                  </div>
                                );
                              })()}
                            </div>
                          </button>

                          {/* Step Actions - Always visible on the right */}
                          {!isCompleted && (
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartEdit(step);
                                }}
                                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10"
                                aria-label="Edit step"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteStep(step.id);
                                }}
                                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all text-gray-400 hover:text-red-500 hover:bg-red-50"
                                aria-label="Delete step"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

              {/* Add Step Inline Form */}
              {!isCompleted && isAddingStep && (
                <div className="p-6 bg-white rounded-3xl border-2 border-brand-primary animate-in fade-in zoom-in-95 min-h-[100px] h-full flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-brand-primary uppercase px-1">What&apos;s the next win?</label>
                      <input
                        autoFocus
                        value={newStepTitle}
                        onChange={(e) => setNewStepTitle(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddStep()}
                        className="w-full text-base font-bold bg-gray-50 p-3 rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-brand-primary/40 text-gray-900"
                        placeholder="e.g. Schedule first session"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-brand-primary uppercase px-1">Target Date</label>
                      <div className="flex items-center gap-2 text-gray-500 bg-gray-50 p-3 rounded-xl">
                        <Calendar className="w-4 h-4 text-brand-primary" />
                        <input
                          type="date"
                          value={newStepDate}
                          min={todayISO}
                          onChange={(e) => setNewStepDate(e.target.value)}
                          className="text-xs border-none focus:outline-none focus:ring-2 focus:ring-brand-primary/40 p-0 bg-transparent flex-1 cursor-pointer font-bold rounded"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-6">
                    <button
                      onClick={handleAddStep}
                      disabled={!newStepTitle.trim()}
                      className="flex-1 bg-brand-primary text-white py-3 rounded-xl text-xs font-black active:scale-95 transition-transform disabled:opacity-50"
                    >
                      ADD STEP
                    </button>
                    <button
                      onClick={() => setIsAddingStep(false)}
                      className="px-4 py-3 text-gray-400 hover:text-gray-600 font-bold text-xs"
                    >
                      CANCEL
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

        </div>
      </FullScreenLayout.Content>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe z-50 animate-in slide-in-from-bottom duration-500">
        <div className="flex justify-around items-center h-20 max-w-md mx-auto px-4">
          <button
            onClick={() => setShowAIInsights(true)}
            className="flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-brand-primary transition-colors gap-1"
          >
            <Sparkles className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">AI Coach</span>
          </button>

          <button
            onClick={() => router.push("/goals")}
            className="flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-brand-primary transition-colors gap-1"
          >
            <X className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Close</span>
          </button>

        </div>
      </nav>
      {/* Modals */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white rounded-[40px] p-10 max-w-sm w-full text-center animate-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
              <AlertCircle className="w-12 h-12 text-brand-primary" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Delete Goal?</h2>
            <p className="text-gray-500 mb-10 leading-relaxed text-sm">This will permanently remove this goal and all its progress. This cannot be undone.</p>
            <div className="space-y-3">
              <button
                onClick={handleDeleteGoal}
                className="w-full bg-brand-primary text-white py-5 rounded-full font-bold active:scale-95 transition-transform"
              >
                YES, DELETE GOAL
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full py-5 rounded-full font-bold text-gray-400 hover:text-gray-600 transition-colors"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {showAIInsights && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowAIInsights(false)} />
          <div className="relative bg-white rounded-[40px] p-10 max-w-sm w-full text-center animate-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-brand-gradient rounded-full flex items-center justify-center mx-auto mb-8">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">AI Insights</h2>
            <p className="text-gray-500 mb-10 leading-relaxed text-sm">Our AI coach is currently being trained to help you achieve your goals faster. Check back soon!</p>
            <button
              onClick={() => setShowAIInsights(false)}
              className="w-full bg-brand-primary text-white py-5 rounded-full font-bold active:scale-95 transition-transform"
            >
              GOT IT
            </button>
          </div>
        </div>
      )}

      {/* Why Editor Bottom Sheet */}
      <BottomSheet
        isOpen={showWhyEditor}
        onClose={() => setShowWhyEditor(false)}
        title="Edit Your Why"
      >
        <div className="space-y-6 pt-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-brand-primary uppercase tracking-widest">
              Goal Title
            </label>
            <input
              type="text"
              value={editWhyTitle}
              onChange={(e) => setEditWhyTitle(e.target.value)}
              className="w-full bg-gray-50 p-4 rounded-2xl border-none focus:outline-none focus:ring-2 focus:ring-brand-primary/40 text-gray-900 text-lg font-bold"
              placeholder="What's your goal?"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-brand-primary uppercase tracking-widest">
              Why It Matters
            </label>
            <textarea
              value={editWhyMatters}
              onChange={(e) => setEditWhyMatters(e.target.value)}
              className="w-full bg-gray-50 p-4 rounded-2xl border-none focus:outline-none focus:ring-2 focus:ring-brand-primary/40 text-gray-600 text-base leading-relaxed resize-none h-32"
              placeholder="Why does this matter to you?"
            />
          </div>

          <button
            onClick={() => {
              handleUpdateGoal({ title: editWhyTitle, whyMatters: editWhyMatters });
              setShowWhyEditor(false);
            }}
            disabled={!editWhyTitle.trim()}
            className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold text-sm uppercase tracking-widest active:scale-95 transition-transform disabled:opacity-50"
          >
            Save Changes
          </button>
        </div>
      </BottomSheet>

      {/* Category Editor Bottom Sheet */}
      <BottomSheet
        isOpen={showCategoryEditor}
        onClose={() => {
          setSelectedCategory(null);
          setShowCategoryEditor(false);
        }}
        title="Edit Category"
      >
        <div className="space-y-6 pt-4">
          <div className="grid grid-cols-1 gap-3">
            {(["Wellbeing", "Career", "Finance", "Skills, Education & Learning", "Relationships"] as GoalCategory[]).map((cat) => {
              const iconMap: Record<GoalCategory, LucideIcon> = {
                Wellbeing: Heart,
                Career: Briefcase,
                Finance: Coins,
                "Skills, Education & Learning": Sprout,
                Relationships: Home,
                other: Tag
              };
              const Icon = iconMap[cat] || Activity;
              const isSelected = (selectedCategory || goal.category) === cat;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center gap-4 p-5 rounded-2xl transition-all ${isSelected
                    ? "bg-brand-primary text-white"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                >
                  <Icon className="w-8 h-8" />
                  <span className="text-sm font-bold capitalize">{cat}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => {
              if (selectedCategory) {
                handleUpdateGoal({ category: selectedCategory });
              }
              setSelectedCategory(null);
              setShowCategoryEditor(false);
            }}
            className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold text-sm uppercase tracking-widest active:scale-95 transition-transform"
          >
            Save Changes
          </button>
        </div>
      </BottomSheet>

      {/* Success Criteria Editor Bottom Sheet */}
      <BottomSheet
        isOpen={showSuccessEditor}
        onClose={() => setShowSuccessEditor(false)}
        title="Edit Success Measures"
      >
        <div className="space-y-6 pt-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-brand-primary uppercase tracking-widest">
              How You&apos;ll Know You&apos;ve Succeeded
            </label>
            <textarea
              value={editSuccessCriteria}
              onChange={(e) => setEditSuccessCriteria(e.target.value)}
              className="w-full bg-gray-50 p-4 rounded-2xl border-none focus:outline-none focus:ring-2 focus:ring-brand-primary/40 text-gray-600 text-base leading-relaxed resize-none h-32"
              placeholder="Define measurable success criteria..."
            />
          </div>

          <button
            onClick={() => {
              handleUpdateGoal({ successCriteria: editSuccessCriteria });
              setShowSuccessEditor(false);
            }}
            className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold text-sm uppercase tracking-widest active:scale-95 transition-transform"
          >
            Save Changes
          </button>
        </div>
      </BottomSheet>

      {/* Readiness Editor Bottom Sheet */}
      <BottomSheet
        isOpen={showReadinessEditor}
        onClose={() => {
          setSelectedReadiness(null);
          setShowReadinessEditor(false);
        }}
        title="Edit Readiness"
      >
        <div className="space-y-6 pt-4">
          <p className="text-sm text-gray-500 text-center">How ready do you feel to achieve this goal?</p>

          <div className="flex items-center justify-center gap-2 sm:gap-3">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                onClick={() => setSelectedReadiness(level)}
                className={`w-14 h-14 rounded-lg flex items-center justify-center font-bold text-xl transition-all ${selectedReadiness === level
                  ? "bg-brand-primary text-white scale-105 shadow-md"
                  : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                  }`}
              >
                {level}
              </button>
            ))}
          </div>

          <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">
            <span>Not ready</span>
            <span>Fully ready</span>
          </div>

          <button
            onClick={() => {
              if (selectedReadiness) {
                handleUpdateGoal({ confidence: selectedReadiness });
              }
              setSelectedReadiness(null);
              setShowReadinessEditor(false);
            }}
            className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold text-sm uppercase tracking-widest active:scale-95 transition-transform"
          >
            Save Changes
          </button>
        </div>
      </BottomSheet>

      {/* Timeline Editor Bottom Sheet */}
      <BottomSheet
        isOpen={showTimelineEditor}
        onClose={() => setShowTimelineEditor(false)}
        title="Edit Timeline"
      >
        <div className="space-y-6 pt-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-brand-primary uppercase tracking-widest">
              Target Date
            </label>
            <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl">
              <Calendar className="w-5 h-5 text-brand-primary" />
              <input
                type="date"
                value={editTargetDate}
                min={todayISO}
                onChange={(e) => setEditTargetDate(e.target.value)}
                className="flex-1 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-brand-primary/40 text-gray-900 font-bold text-lg rounded"
              />
            </div>
          </div>

          <button
            onClick={() => {
              handleUpdateGoal({ targetDate: editTargetDate || undefined });
              setShowTimelineEditor(false);
            }}
            className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold text-sm uppercase tracking-widest active:scale-95 transition-transform"
          >
            Save Changes
          </button>
        </div>
      </BottomSheet>

      {/* Goal Completion Confirmation Modal */}
      {showCompletionConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowCompletionConfirm(false)} />
          <div className="relative bg-white rounded-[40px] p-10 max-w-sm w-full text-center animate-in zoom-in-95 duration-300">
            <div className="w-24 h-24 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
              <Trophy className="w-12 h-12 text-brand-primary" />
            </div>

            <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Amazing work!</h2>
            <p className="text-gray-500 mb-10 leading-relaxed text-sm">
              You&apos;ve completed all the steps for &quot;{goal?.title}&quot;.
              Would you like to mark this goal as officially complete?
            </p>

            <div className="space-y-3">
              <button
                onClick={handleConfirmCompletion}
                className="w-full bg-brand-primary text-white py-5 rounded-full font-bold active:scale-95 transition-transform"
              >
                YES, MARK AS COMPLETE
              </button>
              <button
                onClick={() => setShowCompletionConfirm(false)}
                className="w-full py-5 rounded-full font-bold text-gray-400 hover:text-gray-600 transition-colors"
              >
                NOT YET, KEEP IT ACTIVE
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
