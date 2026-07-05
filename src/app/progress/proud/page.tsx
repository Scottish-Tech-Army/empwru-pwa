"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/ui/BottomNav";
import { getCheckIns, getProgressLikes, toggleProgressLike } from "@/lib/storage";
import { ChevronLeft, Sparkles, Heart } from "lucide-react";

export default function ProudMomentsPage() {
  const router = useRouter();
  const [likes, setLikes] = useState(() =>
    typeof window !== "undefined" ? getProgressLikes() : { achievements: [], reflection: [] }
  );

  const checkIns = typeof window !== "undefined" ? getCheckIns() : [];
  const proudCheckIns = checkIns.filter((c) => likes.achievements.includes(c.id));

  const handleToggle = (id: string) => {
    const updated = toggleProgressLike("achievements", id);
    setLikes(updated);
  };

  return (
    <div className="min-h-dvh bg-bg-card pb-32">
      <header className="pt-6 pb-4 bg-white sticky top-0 z-30 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 flex items-center gap-3">
          <button
            onClick={() => router.push("/progress")}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
            aria-label="Back to progress"
          >
            <ChevronLeft className="w-5 h-5 text-[var(--color-charcoal)]" />
          </button>
          <div>
            <h1 className="text-2xl text-[var(--color-charcoal)]">Proud Moments</h1>
            <p className="text-sm text-text-muted">Saved from your weekly check-ins.</p>
          </div>
        </div>
      </header>

      <div className="px-6 pt-6 max-w-5xl mx-auto">
        {proudCheckIns.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
            <Sparkles className="w-10 h-10 text-brand-primary mx-auto mb-4" />
            <p className="text-lg font-semibold text-[var(--color-charcoal)]">No saved proud moments yet</p>
            <p className="text-sm text-text-muted mt-2">
              Tap the heart icon on a weekly check-in to save what you&apos;re proud of.
            </p>
            <button
              onClick={() => router.push("/progress")}
              className="mt-6 px-6 py-3 bg-brand-primary text-white rounded-2xl font-semibold hover:bg-brand-primary/90 transition"
            >
              Back to progress
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {proudCheckIns.map((checkIn) => (
              <div key={checkIn.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-text-muted">{new Date(checkIn.createdAt).toLocaleDateString()}</p>
                    <p className="mt-2 text-base text-[var(--color-charcoal)] leading-relaxed">
                      {checkIn.achievements || "No text provided."}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle(checkIn.id)}
                    className="p-2 rounded-full bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 transition"
                    aria-label="Remove saved proud moment"
                  >
                    <Heart className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
