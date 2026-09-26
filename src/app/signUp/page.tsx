"use client";

import { PasswordInput, PrimaryButton } from "@/components";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleCreateAccount = async () => {
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    const displayName = `${firstName.trim()} ${lastName.trim()}`.trim();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          display_name: displayName,
        },
      },
    });

    if (error) {
      setErrorMessage(
        error.message ?? "Unable to create account. Please try again.",
      );
      return;
    }

    setErrorMessage("");
    if (data.session) {
      // Email confirmation is NOT required — user is already signed in,
      // so take them straight into onboarding instead of back through
      // sign in.
      router.push("/onboarding/welcome");
    } else if (data.user) {
      // Email confirmation IS required. Show "Check your email" popup;
      // they'll land in onboarding automatically once they sign in.
      setShowConfirmation(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 py-12">
      {/* empwru Logo */}
      <div className="mb-8">
        <Image
          src="/brand_assets/empwru-wordmark-gradient.svg"
          alt="empwru"
          width={140}
          height={42}
          priority
        />
      </div>

      {/* Title */}
      <h1 className="text-center text-[var(--color-charcoal)] font-bold text-3xl md:text-4xl mb-4 leading-tight px-4 max-w-lg mx-auto">
        Create your account
      </h1>

      {/* Email/Password form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleCreateAccount();
        }}
        className="w-full max-w-sm flex flex-col gap-6 mt-6"
      >
        <div className="flex gap-4">
          <label className="block flex-1 text-base text-text-muted">
            First name
            <input
              type="text"
              placeholder="First name"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="mt-2 block w-full rounded-md border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
            />
          </label>

          <label className="block flex-1 text-base text-text-muted">
            Last name
            <input
              type="text"
              placeholder="Last name"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="mt-2 block w-full rounded-md border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
            />
          </label>
        </div>

        <label className="block text-base text-text-muted">
          Email
          <input
            type="email"
            placeholder="Enter your email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 block w-full rounded-md border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
          />
        </label>

        <label className="block text-base text-text-muted">
          Password
          <PasswordInput
            placeholder="Create a password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <label className="block text-base text-text-muted">
          Confirm password
          <PasswordInput
            placeholder="Re-enter your password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </label>

        {errorMessage && (
          <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
        )}

        <PrimaryButton onClick={handleCreateAccount}>Sign up</PrimaryButton>
      </form>

      {/* Sign in link */}
      <p className="text-center text-sm text-text-muted mt-8">
        Already have an account?{" "}
        <Link
          href="/signIn"
          className="text-[var(--color-charcoal)] font-semibold underline"
        >
          Sign in
        </Link>
      </p>

      {/* Terms of use */}
      <p className="text-center text-xs text-text-muted max-w-xs mt-4">
        By creating an account, you agree to our{" "}
        <Link href="/terms" className="underline text-[var(--color-charcoal)]">
          terms of use
        </Link>
        .
      </p>

      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-4">
          <div className="w-full max-w-sm rounded-[32px] bg-white p-6 text-center shadow-[0_25px_60px_rgba(0,0,0,0.12)] ring-1 ring-black/10">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--color-magenta)]">
              Confirmation sent
            </p>
            <h2 className="mt-4 text-2xl font-bold text-[var(--color-charcoal)]">
              Check your inbox
            </h2>
            <p className="mt-3 text-sm leading-7 text-[rgba(3,3,3,0.75)]">
              A confirmation email has been sent to your email address.
            </p>
            <button
              type="button"
              onClick={() => {
                setShowConfirmation(false);
                router.push("/signIn");
              }}
              className="mt-6 w-full rounded-2xl bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary/90"
            >
              Back to sign in
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
