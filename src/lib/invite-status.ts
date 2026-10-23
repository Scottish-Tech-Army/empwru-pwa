/**
 * Invite status checks shared by server code (pending invites, the roster)
 * and the browser (AppGuard). Kept free of server-only imports for that
 * reason.
 */

/**
 * user_metadata flag set when an invited participant finishes
 * /create-account. Following the invite link signs them in straight away, so
 * without it someone who closes that page before choosing a password would
 * be signed in to an account they can never sign back in to.
 */
export const ACCOUNT_SETUP_COMPLETE_KEY = "account_setup_complete";

interface InviteFields {
  invited_at?: string;
  user_metadata?: Record<string, unknown> | null;
}

/** Invited, and hasn't yet chosen a password on /create-account. */
export function isPendingInvite(user: InviteFields): boolean {
  return Boolean(user.invited_at) && user.user_metadata?.[ACCOUNT_SETUP_COMPLETE_KEY] !== true;
}
