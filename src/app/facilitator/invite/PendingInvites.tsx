"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock3, RotateCw } from "lucide-react";
import type { PendingInvite } from "@/lib/invites";

export default function PendingInvites({
  invites,
  linkHours,
}: {
  invites: PendingInvite[];
  linkHours: number;
}) {
  const router = useRouter();
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [resentIds, setResentIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleResend = async (invite: PendingInvite) => {
    setResendingId(invite.id);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[invite.id];
      return next;
    });

    const res = await fetch("/api/facilitator/invite/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: invite.id }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setResendingId(null);

    if (!res.ok) {
      setErrors((prev) => ({ ...prev, [invite.id]: data.error ?? "Couldn't resend the invite." }));
      return;
    }

    setResentIds((prev) => [...prev, invite.id]);
    // Picks up the new sent time and clears the expired flag.
    router.refresh();
  };

  return (
    <section className="mt-8">
      <div className="mb-3">
        <h2 className="text-sm text-text-muted">
          Pending invites
          <span className="ml-1.5 text-text-subtle">({invites.length})</span>
        </h2>
        <p className="text-xs text-text-subtle">
          Invited but haven&apos;t finished creating their account. Links last {linkHours} hours; resend to
          send a fresh one.
        </p>
      </div>

      {invites.length === 0 ? (
        <div className="rounded-2xl border border-deep-violet/10 bg-white p-5 text-sm text-text-muted shadow-sm">
          No pending invites. Everyone you&apos;ve invited has joined.
        </div>
      ) : (
        <ul className="divide-y divide-deep-violet/10 rounded-2xl border border-deep-violet/10 bg-white shadow-sm">
          {invites.map((invite) => (
            <li key={invite.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm">{invite.name}</div>
                <div className="truncate text-xs text-text-subtle">{invite.email}</div>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                <Clock3 className="h-3 w-3" />
                Sent {invite.sentLabel.toLowerCase()}
              </div>

              {invite.opened ? (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full bg-deep-violet/10 px-2.5 py-1 text-xs text-deep-violet"
                  title="They followed the link but haven't chosen a password yet"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  Opened, not finished
                </span>
              ) : invite.expired ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fcebec] px-2.5 py-1 text-xs text-[#d23b3b]">
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  Link expired
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fbf0dc] px-2.5 py-1 text-xs text-[#c97c12]">
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  Waiting
                </span>
              )}

              <button
                type="button"
                onClick={() => handleResend(invite)}
                disabled={resendingId === invite.id}
                className="flex items-center gap-1.5 rounded-full border border-brand-primary/30 px-3 py-1.5 text-xs text-brand-primary transition hover:bg-brand-primary/5 disabled:opacity-60"
              >
                <RotateCw className={`h-3 w-3 ${resendingId === invite.id ? "animate-spin" : ""}`} />
                {resendingId === invite.id ? "Sending…" : resentIds.includes(invite.id) ? "Sent again" : "Resend"}
              </button>

              {errors[invite.id] && (
                <p className="basis-full text-xs text-[#d23b3b]">{errors[invite.id]}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
