"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";

/**
 * Shown at /signUp while sign-up is invite-only (see src/lib/signup-mode.ts):
 * accounts are created by a facilitator from the facilitator view, and
 * public sign-ups are switched off in Supabase. The route stays (the
 * onboarding carousel ends here) but explains how to join instead.
 */
export default function InviteOnlyNotice() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 py-12">
      <div className="mb-8">
        <Image
          src="/brand_assets/empwru-wordmark-gradient.svg"
          alt="empwru"
          width={140}
          height={42}
          priority
        />
      </div>

      <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center mb-6">
        <Mail className="w-8 h-8 text-brand-primary" />
      </div>

      <h1 className="text-center text-[var(--color-charcoal)] font-bold text-3xl md:text-4xl mb-4 leading-tight px-4 max-w-lg mx-auto">
        Join by invitation
      </h1>
      <p className="text-center text-base leading-7 text-text-muted max-w-sm">
        empwrU accounts are set up by your programme facilitator. If you&apos;ve been invited, look for an
        email from empwrU and follow the link to set your password.
      </p>
      <p className="text-center text-base leading-7 text-text-muted max-w-sm mt-4">
        Can&apos;t find it? Check your junk folder, or ask your facilitator to send it again.
      </p>

      <p className="text-center text-sm text-text-muted mt-8">
        Already have an account?{" "}
        <Link href="/signIn" className="text-[var(--color-charcoal)] font-semibold underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
