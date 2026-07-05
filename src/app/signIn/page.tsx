"use client";

import { PrimaryButton } from "@/components";
import { LoginButton } from "@/components/auth/LoginButton";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignInAccount = () => {
    // Handle sign-up logic here
    router.push("/onboarding/baseline");

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

      {/* Add space between title and buttons */}
      <div className="w-full max-w-sm mt-6 space-y-4">
        {/* OAuth Buttons */}
        <LoginButton type="signin" />

        <button
          onClick={() => { }}
          className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-md py-3 px-4 text-sm font-medium hover:bg-gray-100 transition"
        >
          <img
            src="/facebook.png"
            alt="Facebook"
            className="w-5 h-5"
            loading="lazy"
          />
          Sign in with Facebook
        </button>
      </div>

      {/* Separator */}
      <div className="flex items-center w-full max-w-sm my-8">
        <hr className="flex-grow border-gray-300" />
        <span className="mx-3 text-gray-400 text-base">or</span>
        <hr className="flex-grow border-gray-300" />
      </div>

      {/* Email/Password form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSignInAccount();
        }}
        className="w-full max-w-sm flex flex-col gap-6"
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
          <input
            type="password"
            placeholder="Create a password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 block w-full rounded-md border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
          />
        </label>

        {/* <button
          type="submit"
          //   className="mt-4 w-full bg-[var(--color-charcoal)] text-white rounded-md py-3 text-sm font-semibold hover:bg-gray-900 transition"
          className="flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-brand-primary text-white font-bold text-sm hover:scale-[1.02] active:scale-95 transition-all"

        >
          Create Aaccount
        </button> */}
        <PrimaryButton onClick={handleSignInAccount}>
          Sign in
        </PrimaryButton>
      </form>

      {/* Sign up link */}
      <p className="text-center text-sm text-text-muted mt-8">
        Don't have an account?{" "}
        <Link href="/signUp" className="text-[var(--color-charcoal)] font-semibold underline">
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
