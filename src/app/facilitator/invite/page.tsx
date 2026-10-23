import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser, hasAnyRole } from "@/lib/roles";
import { getPendingInvites, INVITE_LINK_HOURS } from "@/lib/invites";
import { isOpenSignup } from "@/lib/signup-mode";
import FacilitatorSidebar from "../FacilitatorSidebar";
import InviteForm from "./InviteForm";
import PendingInvites from "./PendingInvites";

export const dynamic = "force-dynamic";

export default async function FacilitatorInvitePage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || !hasAnyRole(currentUser, ["admin", "facilitator"])) {
    redirect("/");
  }

  const pendingInvites = await getPendingInvites();

  return (
    <div className="min-h-screen bg-bg-subtle">
      <header className="flex items-center justify-between border-b border-deep-violet/10 bg-white px-5 py-4 sm:px-8">
        <div className="flex items-center gap-1 sm:gap-2">
          <FacilitatorSidebar email={currentUser.email} />
          <Link
            href="/facilitator"
            className="flex h-9 w-9 items-center justify-center rounded-full text-text-muted hover:bg-warm-ivory hover:text-deep-violet transition-colors"
            aria-label="Back to facilitator view"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="ml-1">
            <h1 className="text-lg text-deep-violet">Invite a participant</h1>
            <p className="text-xs text-text-muted">Signed in as {currentUser.email}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-8 sm:px-8">
        <div className="rounded-2xl border border-deep-violet/10 bg-white p-5 shadow-sm sm:p-6">
          <p className="mb-5 text-sm leading-6 text-text-muted">
            {isOpenSignup ? "" : "empwrU is invite-only. "}The participant will get an email with a link to create
            their account, then they&apos;ll go through onboarding as usual.
          </p>
          <InviteForm />
        </div>

        <PendingInvites invites={pendingInvites} linkHours={INVITE_LINK_HOURS} />
      </main>
    </div>
  );
}
