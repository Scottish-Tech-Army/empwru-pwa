"use client";

import { PasswordInput, PasswordRequirements, PrimaryButton } from "@/components";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ACCOUNT_SETUP_COMPLETE_KEY } from "@/lib/invite-status";
import { meetsPasswordRules } from "@/lib/password-rules";

const INPUT_CLASS =
  "mt-2 block w-full rounded-md border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary";

/**
 * Where an invited participant lands after following their invite link
 * (via /auth/confirm, which has already signed them in). Looks like the old
 * self sign-up form: the name the facilitator entered is pre-filled so they
 * can correct it, and they choose a password. The account already exists,
 * so this updates it rather than signing up.
 */
export default function CreateAccountPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const metadata = user.user_metadata ?? {};
      setFirstName(typeof metadata.first_name === "string" ? metadata.first_name : "");
      setLastName(typeof metadata.last_name === "string" ? metadata.last_name : "");
      setEmail(user.email ?? "");
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/signIn");
  };

  const handleCreateAccount = async () => {
    if (!firstName.trim()) {
      setErrorMessage("Please enter your first name.");
      return;
    }
    if (!meetsPasswordRules(password)) {
      setErrorMessage("Your password doesn't meet all the requirements listed above.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSaving(true);
    const { error } = await supabase.auth.updateUser({
      password,
      // Same name keys as the invite and the sign-up form. The setup flag
      // releases them from this page (see isPendingInvite).
      data: {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        display_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        [ACCOUNT_SETUP_COMPLETE_KEY]: true,
      },
    });
    setIsSaving(false);

    if (error) {
      setErrorMessage(error.message ?? "Unable to create your account. Please try again.");
      return;
    }

    setErrorMessage("");
    // The app guard sends anyone who hasn't finished onboarding there.
    router.replace("/");
  };

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

      <h1 className="text-center text-[var(--color-charcoal)] font-bold text-3xl md:text-4xl mb-4 leading-tight px-4 max-w-lg mx-auto">
        Create your account
      </h1>

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
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={INPUT_CLASS}
            />
          </label>

          <label className="block flex-1 text-base text-text-muted">
            Last name
            <input
              type="text"
              placeholder="Last name"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={INPUT_CLASS}
            />
          </label>
        </div>

        <label className="block text-base text-text-muted">
          Email
          <input
            type="email"
            value={email}
            readOnly
            aria-readonly="true"
            className={`${INPUT_CLASS} bg-gray-50 text-text-muted cursor-not-allowed`}
          />
        </label>

        <div className="flex flex-col gap-2">
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

          <label className="block text-base text-text-muted mt-4">
            Confirm password
            <PasswordInput
              placeholder="Re-enter your password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </label>

          <div className="mt-1">
            <p className="mb-1.5 text-sm text-text-muted">Your password needs:</p>
            <PasswordRequirements password={password} />
          </div>
        </div>

        {errorMessage && <p className="text-sm text-red-600 mt-1">{errorMessage}</p>}

        <PrimaryButton type="submit" disabled={isSaving}>
          {isSaving ? "Creating your account…" : "Create account"}
        </PrimaryButton>
      </form>

      {/* The invite link signs this browser in as the invitee, and AppGuard
          holds them here until setup is done — so this is the only way out,
          e.g. for someone who opened a link meant for someone else. */}
      <p className="text-center text-sm text-text-muted mt-8">
        {email ? `Not ${email}? ` : "Wrong account? "}
        <button
          type="button"
          onClick={handleSignOut}
          className="text-[var(--color-charcoal)] font-semibold underline"
        >
          Sign out
        </button>
      </p>
    </div>
  );
}
