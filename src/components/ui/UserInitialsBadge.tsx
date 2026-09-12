"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

function getInitialsFromEmail(email: string | null | undefined) {
  const localPart = email?.split("@")[0] ?? "user";
  const cleaned = localPart.replace(/[^a-zA-Z0-9]/g, "");
  const derived = cleaned.slice(0, 2) || "U";

  return derived.toUpperCase();
}

function getInitialsFromSession(
  session: { user: { user_metadata?: Record<string, unknown>; email?: string | null } } | null | undefined,
) {
  const firstName = session?.user.user_metadata?.first_name;
  const lastName = session?.user.user_metadata?.last_name;
  const firstInitial =
    typeof firstName === "string" ? firstName.trim().charAt(0) : "";
  const lastInitial =
    typeof lastName === "string" ? lastName.trim().charAt(0) : "";
  const combined = `${firstInitial}${lastInitial}`;

  if (combined) return combined.toUpperCase();

  const metadataName = session?.user.user_metadata?.display_name;
  if (typeof metadataName === "string" && metadataName) {
    return metadataName.slice(0, 2).toUpperCase();
  }

  return getInitialsFromEmail(session?.user.email);
}

export default function UserInitialsBadge() {
  const router = useRouter();
  const [initials, setInitials] = useState("U");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isActive = true;

    async function initialize() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isActive) return;

      setInitials(getInitialsFromSession(session) || "U");
    }

    void initialize();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isActive) return;

      setInitials(getInitialsFromSession(session) || "U");
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleProfileClick = () => {
    router.push("/profile");
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleProfileClick}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-primary text-white font-semibold text-lg shadow-sm shrink-0"
        aria-label="Open profile page"
      >
        {initials}
      </button>
    </div>
  );
}
