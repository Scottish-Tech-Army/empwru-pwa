import type { Session } from "@supabase/supabase-js";

/**
 * Capitalize the first letter of each word — signup lets people type
 * their name in any case (e.g. "nicola smith"), so greetings built from
 * stored display names run through this rather than showing it verbatim.
 */
export function capitalizeWords(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Derive a display name from an email's local part when no explicit
 * display name is set (e.g. metadata not yet backfilled) — capitalized,
 * capped at 6 characters so it reads as a short name rather than the raw
 * local-part string.
 */
export function getDisplayNameFromEmail(email: string | null | undefined): string {
  const localPart = email?.split("@")[0] ?? "user";
  const cleaned = localPart.replace(/[^a-zA-Z0-9]/g, "");
  const derived = cleaned.slice(0, 6) || "user";

  return capitalizeWords(derived);
}

/**
 * The name to greet a signed-in user by: their stored display name if set,
 * otherwise one derived from their email.
 */
export function getSessionDisplayName(session: Session | null): string {
  if (!session) return "User";

  const metadataName = session.user.user_metadata?.display_name;
  return metadataName ? capitalizeWords(metadataName) : getDisplayNameFromEmail(session.user.email);
}
