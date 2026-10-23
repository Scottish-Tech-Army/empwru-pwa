import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { getDisplayNameFromEmail } from "@/lib/user-display";
import { isPendingInvite } from "@/lib/invite-status";

/**
 * How long an invite link stays valid. Must match the Supabase project's
 * Email OTP Expiration (Authentication → Sign In / Providers → Email), set
 * to its 24-hour maximum — see documentation/16_User_Roles_and_Facilitator_Access.md.
 */
export const INVITE_LINK_HOURS = 24;

const HOUR_MS = 60 * 60 * 1000;

export interface PendingInvite {
  id: string;
  name: string;
  email: string;
  sentAt: string;
  /** e.g. "2 hours ago", computed server-side so it can't drift on hydration. */
  sentLabel: string;
  /** Followed the link but left before choosing a password. */
  opened: boolean;
  /** Link not yet used and past INVITE_LINK_HOURS. */
  expired: boolean;
}

function sentLabelFor(iso: string): string {
  const hours = Math.floor((Date.now() - new Date(iso).getTime()) / HOUR_MS);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

/**
 * Everyone invited who hasn't accepted yet, most recently sent first.
 * Reads auth.users through the service-role client, so callers MUST verify
 * the requester holds an admin/facilitator role first (see src/lib/roles.ts).
 */
export async function getPendingInvites(): Promise<PendingInvite[]> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) {
    throw new Error(`Failed to list users: ${error.message}`);
  }

  return data.users
    .filter(isPendingInvite)
    .map((user) => {
      // A resend updates confirmation_sent_at, so prefer it over invited_at.
      const sentAt = user.confirmation_sent_at ?? user.invited_at!;
      const displayName =
        typeof user.user_metadata?.display_name === "string"
          ? (user.user_metadata.display_name as string).trim()
          : "";
      return {
        id: user.id,
        name: displayName || getDisplayNameFromEmail(user.email),
        email: user.email ?? "",
        sentAt,
        sentLabel: sentLabelFor(sentAt),
        // Following the link confirms the email, so a confirmed pending
        // invitee opened it but never finished setting up.
        opened: Boolean(user.email_confirmed_at),
        expired:
          !user.email_confirmed_at &&
          Date.now() - new Date(sentAt).getTime() > INVITE_LINK_HOURS * HOUR_MS,
      };
    })
    .sort((a, b) => b.sentAt.localeCompare(a.sentAt));
}
