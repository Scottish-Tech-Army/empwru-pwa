import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";

/**
 * Landing point for links in Supabase auth emails. The invite email
 * template points here with a token hash:
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite
 * Verifying it server-side sets the session cookie. Supabase's default
 * invite link instead puts the session in the URL fragment (implicit
 * flow), which the PKCE-configured browser client rejects.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (tokenHash && type) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

    if (!error) {
      // A new invitee has no password yet, so they always set one first.
      const next = type === "invite" ? "/create-account" : "/";
      return NextResponse.redirect(`${origin}${next}`);
    }

    // An expired or already-used link is an everyday outcome (e.g. someone
    // clicks an old invite email), not a fault — note it without the alarm.
    if (error.code === "otp_expired") {
      console.info("[auth/confirm] link expired or already used");
    } else {
      console.error("Failed to verify auth email link", error);
    }
  }

  return NextResponse.redirect(`${origin}/signIn?link=expired`);
}
