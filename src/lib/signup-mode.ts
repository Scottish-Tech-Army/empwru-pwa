/**
 * How new participants get an account.
 *
 *  - "invite" (default): only facilitators can create accounts, by inviting
 *    people from /facilitator/invite. /signUp explains how to join.
 *  - "open": anyone can create an account from the /signUp form. Invites
 *    still work alongside it.
 *
 * Set with NEXT_PUBLIC_SIGNUP_MODE (in .env.local, and in Vercel's
 * environment variables, followed by a redeploy). Anything other than
 * "open" — including leaving it unset — means invite-only, so a missing
 * variable can never accidentally open up sign-up.
 *
 * Must stay in step with Supabase's "Allow new users to sign up" setting:
 * that is what actually blocks sign-ups; this only decides what the app shows.
 */
export type SignupMode = "invite" | "open";

export const SIGNUP_MODE: SignupMode =
  process.env.NEXT_PUBLIC_SIGNUP_MODE === "open" ? "open" : "invite";

export const isOpenSignup = SIGNUP_MODE === "open";
