"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { FullScreenLayout } from "@/components/layouts/FullScreenLayout";
import {
  getDiscoveryData,
  saveDiscoveryData,
  type DiscoveryPillar,
} from "@/lib/storage";
import {
  Wrench,
  Star,
  Sparkles,
  Heart,
  Compass,
  X,
  Plus,
  Check,
  type LucideIcon,
} from "lucide-react";
import { CelebrationScreen } from "@/components/ui/CelebrationScreen";

// Pillar configuration
interface PillarConfig {
  title: string;
  singular: string;
  plural: string;
  icon: LucideIcon;
  purpose: string;
  questions: string[];
  suggestions: string[];
  celebrationTitle: string;
  celebrationSubtitle: string;
}

const PILLAR_CONFIG: Record<DiscoveryPillar, PillarConfig> = {
  skills: {
    title: "Add Skills",
    singular: "skill",
    plural: "skills",
    icon: Wrench,
    purpose: "These help you recognise what you can already do.",
    questions: [
      "What are you good at – at home, work, or in everyday life?",
      "What do people often come to you for?",
      "What skills have you developed through life experience?",
    ],
    suggestions: [
      "Problem-solving",
      "Communication",
      "Organisation",
      "Creativity",
      "Leadership",
    ],
    celebrationTitle: "Skills Unlocked!",
    celebrationSubtitle: "You've recognised what you're capable of. These skills are the building blocks of your potential.",
  },
  qualities: {
    title: "Add Qualities",
    singular: "quality",
    plural: "qualities",
    icon: Star,
    purpose: "Build your confidence by identifying personal strengths and character traits.",
    questions: [
      "What personal qualities describe you?",
      "What do people appreciate about you?",
      "What qualities help you get through challenges?",
    ],
    suggestions: [
      "Resilient",
      "Kind",
      "Determined",
      "Patient",
      "Honest",
    ],
    celebrationTitle: "Strengths Recognised!",
    celebrationSubtitle: "Your qualities define your character. Acknowledging them is a powerful step toward self-belief.",
  },
  values: {
    title: "Add Values",
    singular: "value",
    plural: "values",
    icon: Compass,
    purpose: "These help you understand what truly matters to you.",
    questions: [
      "What matters most to you in life right now?",
      "What do you want more of in your future?",
      "What do you want your life to stand for?",
    ],
    suggestions: [
      "Family",
      "Health",
      "Growth",
      "Security",
      "Freedom",
    ],
    celebrationTitle: "Compass Set!",
    celebrationSubtitle: "Knowing your values helps you make choices that align with your true self.",
  },
  interests: {
    title: "Add Interests",
    singular: "interest",
    plural: "interests",
    icon: Heart,
    purpose: "These help you reignite your curiosity, motivation, and enjoyment.",
    questions: [
      "What do you enjoy doing?",
      "What topics or activities interest you?",
      "What would you like to explore more in the future?",
    ],
    suggestions: [
      "Technology",
      "Music",
      "Fitness",
      "Reading",
      "Cooking",
    ],
    celebrationTitle: "Passions Ignited!",
    celebrationSubtitle: "Exploring your interests brings energy and joy to your journey forward.",
  },
};

export default function PillarDetailPage() {
  const router = useRouter();
  const params = useParams();
  const pillarKey = params.pillar as DiscoveryPillar;

  const [items, setItems] = useState<string[]>([]);
  const [initialItems, setInitialItems] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const config = PILLAR_CONFIG[pillarKey];

  // Handle hydration and initial state
  useEffect(() => {
    if (typeof window !== "undefined") {
      const data = getDiscoveryData();
      const currentItems = (pillarKey && data[pillarKey]) ? [...data[pillarKey]] : [];

      requestAnimationFrame(() => {
        setItems(currentItems);
        setInitialItems(currentItems);
        setIsHydrated(true);
      });
    }
  }, [pillarKey]);

  if (!config) {
    router.push("/discovery");
    return null;
  }

  const Icon = config.icon;

  const handleAddItem = (item: string) => {
    const trimmed = item.trim();
    if (!trimmed) return;

    // Check for duplicates
    if (items.some(i => i.toLowerCase() === trimmed.toLowerCase())) {
      return;
    }

    setItems([...items, trimmed]);
    setInputValue("");
  };

  const handleRemoveItem = (item: string) => {
    setItems(items.filter(i => i !== item));
  };

  const handleSave = () => {
    if (!pillarKey) return;
    saveDiscoveryData({ [pillarKey]: items });

    const hasNewItems = items.some(
      item => !initialItems.some(i => i.toLowerCase() === item.toLowerCase())
    );

    if (hasNewItems) {
      setIsDone(true);
    } else {
      router.push("/discovery");
    }
  };

  const isDirty = JSON.stringify([...items].sort()) !== JSON.stringify([...initialItems].sort());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAddItem(inputValue);
  };

  // Filter out suggestions that are already added
  const availableSuggestions = config.suggestions.filter(
    s => !items.some(i => i.toLowerCase() === s.toLowerCase())
  );

  if (!isHydrated) {
    return null;
  }

  if (isDone) {
    return (
      <CelebrationScreen
        progress={100}
        icon={config.icon}
        title={config.celebrationTitle}
        subtitle={config.celebrationSubtitle}
        buttonText="Back to Discovery"
        onButtonClick={() => router.push("/discovery")}
      />
    );
  }

  return (
    <FullScreenLayout bgClass="bg-bg-card">
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <header className="bg-white sticky top-0 z-30 border-b border-gray-100">
          <div className="max-w-xl mx-auto w-full px-6 py-4 flex items-center justify-center gap-3">
            <Icon className="w-6 h-6 text-brand-primary" />
            <h1 className="text-2xl text-[var(--color-charcoal)]">{config.title}</h1>
          </div>
        </header>

        <div className="max-w-xl mx-auto w-full px-6 pt-8 pb-32">
          {/* Purpose */}
          <div className="flex items-start gap-3 p-4 bg-brand-primary/5 rounded-2xl border border-brand-primary/10 mb-6">
            <Sparkles className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
            <p className="text-sm text-brand-primary/80 leading-relaxed italic">
              {config.purpose}
            </p>
          </div>

          {/* Questions - Consolidated Card */}
          <div className="space-y-4 mb-8 mx-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">
              Reflect on these questions
            </h2>
            <div className="px-1 space-y-4">
              <ul className="space-y-4">
                {config.questions.map((question, idx) => (
                  <li key={idx} className="flex gap-4">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary/40 shrink-0" />
                    <p className="text-gray-700 text-sm leading-relaxed">{question}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Add Item Input */}
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={`Add a ${config.singular}...`}
                className="flex-1 h-12 px-4 rounded-xl bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 focus:border-brand-primary text-gray-900"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className={`h-12 w-12 rounded-xl flex items-center justify-center transition-colors ${inputValue.trim()
                  ? "bg-brand-primary text-white"
                  : "bg-gray-100 text-gray-400"
                  }`}
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </form>

          {/* Suggestion Chips */}
          {availableSuggestions.length > 0 && (
            <div className="mb-8">
              <div className="flex flex-wrap gap-2">
                {availableSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleAddItem(suggestion)}
                    className="px-4 py-2 rounded-full bg-gray-50 text-gray-600 text-sm font-medium border border-gray-200 hover:bg-brand-primary/10 hover:border-brand-primary/20 hover:text-brand-primary transition-colors"
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* User's Items */}
          {items.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">
                Your {config.plural} ({items.length})
              </h2>
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item}
                    className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100"
                  >
                    <span className="text-gray-900 font-medium">{item}</span>
                    <button
                      onClick={() => handleRemoveItem(item)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 pb-safe z-50 animate-in slide-in-from-bottom duration-500">
        <div className="flex justify-between items-center h-20 max-w-xl mx-auto px-12">
          <button
            onClick={() => router.push("/discovery")}
            className="flex flex-col items-center justify-center text-brand-primary transition-colors gap-1 group"
          >
            <div className="w-12 h-12 bg-brand-primary/10 rounded-full flex items-center justify-center mb-1 group-active:scale-95 transition-transform">
              <X className="w-6 h-6 text-brand-primary" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest -mt-1">Cancel</span>
          </button>

          <button
            onClick={handleSave}
            disabled={!isDirty}
            className={`flex flex-col items-center justify-center text-brand-primary transition-colors gap-1 group ${!isDirty ? "opacity-30 pointer-events-none" : ""
              }`}
          >
            <div className="w-12 h-12 bg-brand-primary/10 rounded-full flex items-center justify-center mb-1 group-active:scale-95 transition-transform">
              <Check className="w-6 h-6 text-brand-primary" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider">Save</span>
          </button>
        </div>
      </nav>
    </FullScreenLayout>
  );
}
