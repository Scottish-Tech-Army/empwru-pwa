"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { resetAllData } from "@/lib/storage";
import {
  ArrowLeft,
  Compass,
  ListChecks,
  LogOut,
  MapPin,
  Settings,
  Trash2,
  TrendingUp,
} from "lucide-react";

function getInitialsFromEmail(email: string | null | undefined) {
  const localPart = email?.split("@")[0] ?? "user";
  const cleaned = localPart.replace(/[^a-zA-Z0-9]/g, "");
  const derived = cleaned.slice(0, 2) || "U";

  return derived.toUpperCase();
}

function getInitials(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  fallbackName: string,
) {
  const firstInitial = firstName?.trim().charAt(0) ?? "";
  const lastInitial = lastName?.trim().charAt(0) ?? "";
  const combined = `${firstInitial}${lastInitial}`;

  if (combined) return combined.toUpperCase();

  return (fallbackName.slice(0, 2) || "U").toUpperCase();
}

export default function ProfilePage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("User");
  const [initials, setInitials] = useState("U");
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

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
      const nextInitials = getInitials(
        session.user.user_metadata?.first_name,
        session.user.user_metadata?.last_name,
        name,
      );

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

  const handleDeleteAccount = async () => {
    if (deleting) return;

    setDeleting(true);
    setDeleteError("");

    try {
      const response = await fetch("/api/account", { method: "DELETE" });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Failed to delete account.");
      }

      resetAllData();
      await supabase.auth.signOut();
      router.replace("/signUp");
    } catch (error) {
      console.error("Account deletion failed", error);
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Failed to delete account. Please try again.",
      );
      setDeleting(false);
    }
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

            <button
              type="button"
              onClick={() => {
                setDeleteError("");
                setShowDeleteConfirm(true);
              }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-3xl border border-red-200 px-4 py-4 text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              <Trash2 className="w-5 h-5" />
              Delete my account
            </button>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4">
          <div className="w-full max-w-sm rounded-[32px] bg-white p-6 text-center shadow-[0_25px_60px_rgba(0,0,0,0.12)] ring-1 ring-black/10">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-red-600">
              This can&apos;t be undone
            </p>
            <h2 className="mt-4 text-2xl font-bold text-[var(--color-charcoal)]">
              Delete your account?
            </h2>
            <p className="mt-3 text-sm leading-7 text-[rgba(3,3,3,0.75)]">
              This will permanently delete your account and all your data —
              goals, discovery, check-ins and progress — from our servers and
              this device. This cannot be reversed.
            </p>

            {deleteError && (
              <p className="mt-3 text-sm text-red-600">{deleteError}</p>
            )}

            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="mt-6 w-full rounded-2xl bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deleting ? "Deleting..." : "Yes, delete my account"}
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleting}
              className="mt-3 w-full rounded-2xl border border-gray-200 px-6 py-3 text-sm font-semibold text-[var(--color-charcoal)] transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
