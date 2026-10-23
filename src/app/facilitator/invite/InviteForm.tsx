"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Send } from "lucide-react";

const INPUT_CLASS =
  "mt-1.5 block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-brand-primary";

export default function InviteForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [invitedEmail, setInvitedEmail] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setErrorMessage("");
    setInvitedEmail(null);

    const res = await fetch("/api/facilitator/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, email }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setIsSending(false);

    if (!res.ok) {
      setErrorMessage(data.error ?? "Couldn't send the invite. Please try again.");
      return;
    }

    setInvitedEmail(email.trim());
    setFirstName("");
    setLastName("");
    setEmail("");
    // Shows the new person in the pending invites list below.
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <label className="block flex-1 text-sm text-text-muted">
          First name
          <input
            type="text"
            required
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={INPUT_CLASS}
          />
        </label>
        <label className="block flex-1 text-sm text-text-muted">
          Last name
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={INPUT_CLASS}
          />
        </label>
      </div>

      <label className="block text-sm text-text-muted">
        Email
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={INPUT_CLASS}
        />
      </label>

      {errorMessage && <p className="text-sm text-[#d23b3b]">{errorMessage}</p>}

      {invitedEmail && (
        <p className="flex items-center gap-2 rounded-xl bg-[#e7f6ef] px-4 py-3 text-sm text-[#1e9e6d]">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Invite sent to {invitedEmail}.
        </p>
      )}

      <button
        type="submit"
        disabled={isSending}
        className="flex items-center justify-center gap-1.5 self-start rounded-full bg-brand-primary px-5 py-2.5 text-sm text-white transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
      >
        <Send className="h-3.5 w-3.5" />
        {isSending ? "Sending…" : "Send invite"}
      </button>
    </form>
  );
}
