"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Lightbulb, Wrench, Star, Heart, Compass, ChevronRight } from "lucide-react";
import BottomNav from "@/components/ui/BottomNav";
import { getDiscoveryData, type DiscoveryPillar } from "@/lib/storage";
import { QuoteCard } from "@/components";

interface PillarCard {
  key: DiscoveryPillar;
  title: string;
  icon: React.ReactNode;
  description: string;
}

const PILLARS: PillarCard[] = [
  {
    key: "skills",
    title: "Skills",
    icon: <Wrench className="w-6 h-6" />,
    description: "What you can do",
  },
  {
    key: "qualities",
    title: "Qualities",
    icon: <Star className="w-6 h-6" />,
    description: "Your personal strengths",
  },
  {
    key: "values",
    title: "Values",
    icon: <Compass className="w-6 h-6" />,
    description: "What matters to you",
  },
  {
    key: "interests",
    title: "Interests",
    icon: <Heart className="w-6 h-6" />,
    description: "What you enjoy",
  },
];

export default function DiscoveryPage() {
  const [pillarData] = useState<Record<DiscoveryPillar, string[]>>(() => {
    if (typeof window === "undefined") return { skills: [], qualities: [], values: [], interests: [] };
    return getDiscoveryData();
  });
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      setIsHydrated(true);
    });
  }, []);

  return (
    <div className="min-h-dvh flex flex-col bg-bg-card">
      {/* Header */}
      <header className="pt-6 pb-4 bg-white sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-center gap-3">
            <Lightbulb className="w-8 h-8 text-brand-primary" />
            <h1 className="text-2xl text-[var(--color-charcoal)]">Discovery</h1>
          </div>
          <p className="text-text-muted mt-1">Step into your potential</p>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 pt-4">
        <div className="py-6">
          <QuoteCard label="Reflection" variant="ripple">
            Before setting goals, take time to reconnect with who you are.
            Explore each area to build self-awareness and clarity.
          </QuoteCard>
        </div>

        {/* Pillar Cards */}
        <div className="grid gap-4 pb-8">
          {PILLARS.map((pillar) => {
            const items = isHydrated ? pillarData[pillar.key] : [];
            const displayItems = items.slice(0, 3);
            const remainingCount = items.length - 3;

            return (
              <Link
                key={pillar.key}
                href={`/discovery/${pillar.key}`}
                className="block"
              >
                <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4 hover:border-brand-primary/20 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
                      {pillar.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900">{pillar.title}</h3>
                      <p className="text-sm text-gray-500">{pillar.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                  </div>

                  {/* Item Previews */}
                  {items.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {displayItems.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-deep-violet/5 text-deep-violet text-xs font-medium rounded-full border border-deep-violet/10"
                        >
                          {item}
                        </span>
                      ))}
                      {remainingCount > 0 && (
                        <span className="px-3 py-1 bg-gray-50 text-gray-500 text-xs font-medium rounded-full border border-gray-200">
                          + {remainingCount}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </main>

      {/* Spacer for BottomNav */}
      <div className="h-20" />
      <BottomNav />
    </div>
  );
}
