"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Compass,
  ListChecks,
  LogOut,
  MapPin,
  Settings,
  TrendingUp,
} from "lucide-react";

function getInitialsFromEmail(email: string | null | undefined) {
  const localPart = email?.split("@")[0] ?? "user";
  const cleaned = localPart.replace(/[^a-zA-Z0-9]/g, "");
  const derived = cleaned.slice(0, 2) || "U";

  return derived.toUpperCase();
}

export default function ProfilePage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("User");
  const [initials, setInitials] = useState("U");
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) return;
      if (!session) {
        router.replace("/signIn");
        return;
      }

      const metadataName = session.user.user_metadata?.display_name;
      const name = metadataName || getInitialsFromEmail(session.user.email);
      const nextInitials = (name.slice(0, 2) || "U").toUpperCase();

      setDisplayName(name);
      setInitials(nextInitials);
      setLoading(false);
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, [router]);

  const handleLogout = async () => {
    if (loggingOut) return;

    setLoggingOut(true);

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout failed", error);
      setLoggingOut(false);
      return;
    }

    router.replace("/signIn");
  };

  return (
    <div className="min-h-dvh bg-bg-card pb-16">
      <div className="max-w-5xl mx-auto px-6 py-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-[var(--color-charcoal)] shadow-sm hover:border-gray-300 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="mt-6 rounded-[32px] bg-white p-6 shadow-[0_15px_40px_rgba(0,0,0,0.08)]">
          <div className="flex flex-col items-center text-center gap-4 pb-6 border-b border-gray-100">
            <div className="grid h-24 w-24 place-items-center rounded-full bg-brand-primary text-3xl font-semibold text-white">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-[var(--color-charcoal)]">{displayName}</h1>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            <button
              type="button"
              onClick={() => router.push("/discovery")}
              className="group flex items-center gap-3 rounded-3xl border border-gray-200 bg-white px-4 py-4 text-left text-base font-medium text-[var(--color-charcoal)] shadow-sm hover:border-gray-300 transition"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-primary text-white transition group-hover:bg-brand-primary/90">
                <Compass className="w-5 h-5" />
              </span>
              My discovery
            </button>
            <button
              type="button"
              onClick={() => router.push("/progress")}
              className="group flex items-center gap-3 rounded-3xl border border-gray-200 bg-white px-4 py-4 text-left text-base font-medium text-[var(--color-charcoal)] shadow-sm hover:border-gray-300 transition"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-primary text-white transition group-hover:bg-brand-primary/90">
                <TrendingUp className="w-5 h-5" />
              </span>
              My progress
            </button>
            <button
              type="button"
              onClick={() => router.push("/goals")}
              className="group flex items-center gap-3 rounded-3xl border border-gray-200 bg-white px-4 py-4 text-left text-base font-medium text-[var(--color-charcoal)] shadow-sm hover:border-gray-300 transition"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-primary text-white transition group-hover:bg-brand-primary/90">
                <ListChecks className="w-5 h-5" />
              </span>
              My goals
            </button>
            <button
              type="button"
              className="group flex items-center gap-3 rounded-3xl border border-gray-200 bg-white px-4 py-4 text-left text-base font-medium text-[var(--color-charcoal)] shadow-sm hover:border-gray-300 transition"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-primary text-white transition group-hover:bg-brand-primary/90">
                <MapPin className="w-5 h-5" />
              </span>
              Location
            </button>
            <button
              type="button"
              className="group flex items-center gap-3 rounded-3xl border border-gray-200 bg-white px-4 py-4 text-left text-base font-medium text-[var(--color-charcoal)] shadow-sm hover:border-gray-300 transition"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-primary text-white transition group-hover:bg-brand-primary/90">
                <Settings className="w-5 h-5" />
              </span>
              Settings
            </button>
          </div>

          <div className="mt-8 border-t border-gray-100 pt-6">
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center justify-center gap-2 rounded-3xl bg-brand-primary px-4 py-4 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogOut className="w-5 h-5" />
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
