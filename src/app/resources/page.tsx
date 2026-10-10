"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Signpost,
  Briefcase,
  Compass,
  Users,
  Lock,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import BottomNav from "@/components/ui/BottomNav";
import UserInitialsBadge from "@/components/ui/UserInitialsBadge";
import { BottomSheet, PrimaryButton } from "@/components";

interface SignpostResource {
  key: string;
  title: string;
  description: string;
  icon: ReactNode;
}

const SIGNPOST_RESOURCES: SignpostResource[] = [
  {
    key: "jobcentre-plus",
    title: "Jobcentre Plus",
    description: "Benefits, job search and work coach support",
    icon: <Briefcase className="w-5 h-5" />,
  },
  {
    key: "business-gateway",
    title: "Business Gateway",
    description: "Starting and growing a business in Scotland",
    icon: <Compass className="w-5 h-5" />,
  },
  {
    key: "local-employability",
    title: "Local Employability Support",
    description: "Council and third-sector services near you",
    icon: <Users className="w-5 h-5" />,
  },
];

const COMING_SOON = [
  {
    key: "workbooks",
    title: "Workbooks & activities",
    description: "Guided exercises to work through in your own time",
  },
  {
    key: "learning",
    title: "Learning materials",
    description: "Short modules to build on what you already know",
  },
];

const ASK_EM_PROMPT = "Help me find local resources and support near me";

export default function ResourcesPage() {
  const [activeResource, setActiveResource] = useState<SignpostResource | null>(null);

  return (
    <div className="min-h-dvh flex flex-col bg-bg-card">
      {/* Header */}
      <header className="pt-6 pb-4 bg-white sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Signpost className="w-8 h-8 text-brand-primary" />
              <h1 className="text-2xl text-[var(--color-charcoal)]">Resources</h1>
            </div>
            <p className="text-text-muted mt-1">Local support, signposted by Em</p>
          </div>
          <UserInitialsBadge />
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 pt-6">
        {/* Ask Em */}
        <Link
          href={`/aicoach/chat/resources/${encodeURIComponent(ASK_EM_PROMPT)}`}
          className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-5 mb-8 hover:border-brand-primary/20 hover:shadow-sm transition-all"
        >
          <div className="w-12 h-12 rounded-full bg-brand-gradient flex items-center justify-center text-white shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900">
              Ask Em what&apos;s near you
            </h3>
            <p className="text-sm text-gray-500">
              Chat about resources and support in your area
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
        </Link>

        {/* Signposting */}
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted mb-3">
          Signposting
        </p>
        <div className="grid gap-3 mb-8">
          {SIGNPOST_RESOURCES.map((resource) => (
            <button
              key={resource.key}
              type="button"
              onClick={() => setActiveResource(resource)}
              className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-5 text-left hover:border-brand-primary/20 hover:shadow-sm transition-all"
            >
              <div className="w-11 h-11 rounded-xl bg-deep-violet/10 flex items-center justify-center text-deep-violet shrink-0">
                {resource.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900">{resource.title}</h3>
                <p className="text-sm text-gray-500">{resource.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
            </button>
          ))}
        </div>

        {/* Coming soon */}
        <p className="text-xs font-semibold uppercase tracking-wide text-pumpkin mb-3">
          Coming soon
        </p>
        <div className="grid gap-3 pb-8">
          {COMING_SOON.map((item) => (
            <div
              key={item.key}
              className="flex items-center gap-4 bg-white/60 rounded-2xl border border-dashed border-gray-200 p-5 opacity-70"
            >
              <div className="w-11 h-11 rounded-xl bg-pumpkin/10 flex items-center justify-center text-pumpkin shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Spacer for BottomNav */}
      <div className="h-20" />
      <BottomNav />

      <BottomSheet
        isOpen={activeResource !== null}
        onClose={() => setActiveResource(null)}
        title="Coming soon"
      >
        {activeResource && (
          <div className="flex flex-col items-center text-center gap-4 pt-2 pb-2">
            <div className="w-14 h-14 rounded-full bg-brand-gradient flex items-center justify-center text-white">
              {activeResource.icon}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-charcoal)]">
                {activeResource.title} is in development
              </h3>
              <p className="text-sm text-text-muted mt-2 max-w-xs mx-auto">
                We&apos;re building proper local signposting for this. In the meantime, Em can
                point you in the right direction.
              </p>
            </div>
            <Link
              href={`/aicoach/chat/resources/${encodeURIComponent(
                `Tell me about ${activeResource.title} and how it could help me`
              )}`}
              className="w-full"
            >
              <PrimaryButton type="button">Ask Em about {activeResource.title}</PrimaryButton>
            </Link>
            <button
              type="button"
              onClick={() => setActiveResource(null)}
              className="text-sm font-medium text-text-muted"
            >
              Got it, thanks
            </button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
