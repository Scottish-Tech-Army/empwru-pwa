"use client";

import { PasswordInput, PrimaryButton } from "@/components";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase"

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignInAccount = async () => {
    // Handle sign-up logic here
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    console.log(data.user);
    router.push("/");
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
        Sign in to your account
      </h1>

      {/* Email/Password form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSignInAccount();
        }}
        className="w-full max-w-sm flex flex-col gap-6 mt-6"
      >
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
            placeholder="Enter your password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {/* <button
          type="submit"
          //   className="mt-4 w-full bg-[var(--color-charcoal)] text-white rounded-md py-3 text-sm font-semibold hover:bg-gray-900 transition"
          className="flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-brand-primary text-white font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all"

        >
          Create Aaccount
        </button> */}
        <PrimaryButton onClick={handleSignInAccount}>Sign in</PrimaryButton>
      </form>

      {/* Sign up link */}
      <p className="text-center text-sm text-text-muted mt-8">
        Don't have an account?{" "}
        <Link
          href="/signUp"
          className="text-[var(--color-charcoal)] font-semibold underline"
        >
          Sign up
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
    </div>
  );
}
